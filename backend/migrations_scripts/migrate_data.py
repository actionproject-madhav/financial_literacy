#!/usr/bin/env python3
"""
Main data migration script from MongoDB to PostgreSQL

Usage:
    python migrate_data.py --dry-run          # Test migration without writing
    python migrate_data.py --collection users # Migrate specific collection
    python migrate_data.py --all              # Migrate all collections
    python migrate_data.py --batch-size 500   # Custom batch size
"""
import sys
import os
import argparse
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import Flask app and database
from app import app
from config.database import db
from models import (
    Learner, KnowledgeComponent, LearningItem, ItemKCMapping,
    LearnerSkillState, Interaction, Achievement, LearnerAchievement,
    DailyProgress
)

# Import migration utilities
from migration_utils import (
    MigrationStats, BatchProcessor, create_progress_bar, logger
)
from data_mapper import MongoToPostgresMapper


class DataMigrator:
    """Orchestrates data migration from MongoDB to PostgreSQL"""

    def __init__(self, dry_run=False, batch_size=100):
        self.dry_run = dry_run
        self.batch_size = batch_size
        self.mapper = MongoToPostgresMapper()
        self.stats = {}

        # Connect to MongoDB
        mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
        database_name = os.getenv('DATABASE_NAME', 'receipt_scanner')

        logger.info(f"Connecting to MongoDB: {database_name}")
        self.mongo_client = MongoClient(mongo_uri)
        self.mongo_db = self.mongo_client[database_name]

        # Collection to model mapping
        self.collection_mappings = {
            'learners': {
                'model': Learner,
                'mapper': self.mapper.map_learner,
                'order': 1
            },
            'knowledge_components': {
                'model': KnowledgeComponent,
                'mapper': self.mapper.map_knowledge_component,
                'order': 2
            },
            'learning_items': {
                'model': LearningItem,
                'mapper': self.mapper.map_learning_item,
                'order': 3
            },
            'item_kc_mappings': {
                'model': ItemKCMapping,
                'mapper': self.mapper.map_item_kc_mapping,
                'order': 4
            },
            'learner_skill_states': {
                'model': LearnerSkillState,
                'mapper': self.mapper.map_learner_skill_state,
                'order': 5
            },
            'interactions': {
                'model': Interaction,
                'mapper': self.mapper.map_interaction,
                'order': 6
            },
            'achievements': {
                'model': Achievement,
                'mapper': self.mapper.map_achievement,
                'order': 7
            },
            'learner_achievements': {
                'model': LearnerAchievement,
                'mapper': self.mapper.map_learner_achievement,
                'order': 8
            },
            'daily_progress': {
                'model': DailyProgress,
                'mapper': self.mapper.map_daily_progress,
                'order': 9
            }
        }

    def get_available_collections(self):
        """Get list of available MongoDB collections"""
        all_collections = self.mongo_db.list_collection_names()
        return [c for c in all_collections if c in self.collection_mappings]

    def migrate_collection(self, collection_name: str) -> MigrationStats:
        """Migrate a single collection from MongoDB to PostgreSQL"""
        if collection_name not in self.collection_mappings:
            logger.error(f"Unknown collection: {collection_name}")
            return None

        mapping = self.collection_mappings[collection_name]
        model = mapping['model']
        mapper_func = mapping['mapper']

        stats = MigrationStats()
        stats.start()

        logger.info(f"\n{'='*80}")
        logger.info(f"Migrating collection: {collection_name}")
        logger.info(f"Target model: {model.__name__}")
        logger.info(f"{'='*80}\n")

        try:
            # Get MongoDB collection
            mongo_collection = self.mongo_db[collection_name]
            total_docs = mongo_collection.count_documents({})
            stats.total_records = total_docs

            logger.info(f"Found {total_docs} documents in MongoDB")

            if total_docs == 0:
                logger.warning(f"No documents found in {collection_name}")
                stats.end()
                return stats

            # Process in batches
            batch_processor = BatchProcessor(self.batch_size)
            processed = 0

            with app.app_context():
                for mongo_doc in mongo_collection.find():
                    processed += 1

                    # Map MongoDB document to PostgreSQL model data
                    pg_data = mapper_func(mongo_doc)

                    if pg_data is None:
                        stats.record_failure(f"Failed to map document: {mongo_doc.get('_id')}")
                        logger.debug(f"Progress: {create_progress_bar(total_docs, processed)}")
                        continue

                    # Add to batch
                    batch_processor.add(pg_data)

                    # Process batch when full
                    if batch_processor.is_full():
                        self._process_batch(
                            batch_processor.get_batch(),
                            model,
                            stats
                        )

                    # Log progress
                    if processed % 100 == 0:
                        logger.info(f"Progress: {create_progress_bar(total_docs, processed)}")

                # Process remaining batch
                remaining = batch_processor.get_remaining()
                if remaining:
                    self._process_batch(remaining, model, stats)

                logger.info(f"Final:    {create_progress_bar(total_docs, processed)}")

        except Exception as e:
            logger.error(f"Migration failed for {collection_name}: {str(e)}")
            stats.record_failure(str(e))

        stats.end()
        return stats

    def _process_batch(self, batch_data: list, model: type, stats: MigrationStats):
        """Process a batch of records"""
        if self.dry_run:
            logger.info(f"[DRY RUN] Would insert {len(batch_data)} records into {model.__name__}")
            stats.successful_migrations += len(batch_data)
            return

        try:
            # Bulk insert
            for data in batch_data:
                try:
                    # Create model instance
                    instance = model(**data)
                    db.session.add(instance)
                    stats.record_success()

                except IntegrityError as e:
                    db.session.rollback()
                    error_msg = f"Integrity error in {model.__name__}: {str(e)[:100]}"
                    stats.record_failure(error_msg)
                    logger.debug(error_msg)

                except Exception as e:
                    db.session.rollback()
                    error_msg = f"Error inserting into {model.__name__}: {str(e)[:100]}"
                    stats.record_failure(error_msg)
                    logger.debug(error_msg)

            # Commit batch
            db.session.commit()
            logger.debug(f"Committed batch of {len(batch_data)} records")

        except Exception as e:
            db.session.rollback()
            logger.error(f"Batch processing failed: {str(e)}")
            for _ in batch_data:
                stats.record_failure(str(e))

    def migrate_all(self):
        """Migrate all collections in order"""
        logger.info("\n" + "="*80)
        logger.info("STARTING FULL MIGRATION")
        logger.info("="*80 + "\n")

        if self.dry_run:
            logger.info("🔍 DRY RUN MODE - No data will be written\n")

        # Get available collections
        available = self.get_available_collections()

        if not available:
            logger.warning("No collections found to migrate!")
            logger.info("\nAvailable MongoDB collections:")
            for coll in self.mongo_db.list_collection_names():
                logger.info(f"  - {coll}")
            return

        # Sort by order
        sorted_collections = sorted(
            available,
            key=lambda x: self.collection_mappings[x]['order']
        )

        logger.info(f"Found {len(sorted_collections)} collections to migrate:")
        for coll in sorted_collections:
            count = self.mongo_db[coll].count_documents({})
            logger.info(f"  {self.collection_mappings[coll]['order']}. {coll}: {count} documents")
        logger.info("")

        # Migrate each collection
        all_stats = {}
        start_time = datetime.utcnow()

        for collection_name in sorted_collections:
            stats = self.migrate_collection(collection_name)
            all_stats[collection_name] = stats

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        # Print summary
        logger.info("\n" + "="*80)
        logger.info("MIGRATION SUMMARY")
        logger.info("="*80 + "\n")

        total_records = 0
        total_success = 0
        total_failed = 0
        total_skipped = 0

        for collection_name, stats in all_stats.items():
            if stats:
                logger.info(f"{collection_name}:")
                logger.info(f"  Total:      {stats.total_records}")
                logger.info(f"  Successful: {stats.successful_migrations}")
                logger.info(f"  Failed:     {stats.failed_migrations}")
                logger.info(f"  Skipped:    {stats.skipped_records}")
                logger.info(f"  Success %:  {stats.success_rate:.2f}%\n")

                total_records += stats.total_records
                total_success += stats.successful_migrations
                total_failed += stats.failed_migrations
                total_skipped += stats.skipped_records

        logger.info("="*80)
        logger.info("OVERALL TOTALS")
        logger.info("="*80)
        logger.info(f"Total Records:    {total_records}")
        logger.info(f"Successful:       {total_success}")
        logger.info(f"Failed:           {total_failed}")
        logger.info(f"Skipped:          {total_skipped}")
        logger.info(f"Total Duration:   {duration:.2f} seconds")
        success_rate = (total_success / total_records * 100) if total_records > 0 else 0
        logger.info(f"Overall Success:  {success_rate:.2f}%")
        logger.info("="*80 + "\n")

        if self.dry_run:
            logger.info("✅ DRY RUN COMPLETED - No data was written to PostgreSQL")
        else:
            logger.info("✅ MIGRATION COMPLETED")

        logger.info(f"\n📄 Full migration log saved to: migration.log")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Migrate data from MongoDB to PostgreSQL'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run migration without writing to database'
    )
    parser.add_argument(
        '--collection',
        type=str,
        help='Migrate specific collection only'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Migrate all collections'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Number of records per batch (default: 100)'
    )
    parser.add_argument(
        '--list',
        action='store_true',
        help='List available collections'
    )

    args = parser.parse_args()

    # Create migrator
    migrator = DataMigrator(
        dry_run=args.dry_run,
        batch_size=args.batch_size
    )

    # List collections
    if args.list:
        logger.info("\nAvailable collections for migration:")
        for coll in migrator.get_available_collections():
            count = migrator.mongo_db[coll].count_documents({})
            logger.info(f"  - {coll}: {count} documents")
        logger.info("")
        return

    # Migrate specific collection
    if args.collection:
        migrator.migrate_collection(args.collection)
        return

    # Migrate all
    if args.all:
        migrator.migrate_all()
        return

    # No action specified
    parser.print_help()
    logger.info("\n💡 Tip: Use --dry-run flag to test migration without writing data")
    logger.info("💡 Tip: Use --list to see available collections")


if __name__ == '__main__':
    main()
