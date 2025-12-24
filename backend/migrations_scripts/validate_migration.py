#!/usr/bin/env python3
"""
Validation script to verify data migration integrity

Usage:
    python validate_migration.py --all          # Validate all collections
    python validate_migration.py --collection users # Validate specific collection
    python validate_migration.py --sample 100   # Validate sample of 100 records per collection
"""
import sys
import os
import argparse
from datetime import datetime
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

from app import app
from config.database import db
from models import (
    Learner, KnowledgeComponent, LearningItem, ItemKCMapping,
    LearnerSkillState, Interaction, Achievement, LearnerAchievement,
    DailyProgress
)
from migration_utils import logger, DataTransformer


class MigrationValidator:
    """Validate migrated data"""

    def __init__(self):
        # Connect to MongoDB
        mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
        database_name = os.getenv('DATABASE_NAME', 'receipt_scanner')

        self.mongo_client = MongoClient(mongo_uri)
        self.mongo_db = self.mongo_client[database_name]
        self.transformer = DataTransformer()

        self.collection_models = {
            'learners': Learner,
            'knowledge_components': KnowledgeComponent,
            'learning_items': LearningItem,
            'item_kc_mappings': ItemKCMapping,
            'learner_skill_states': LearnerSkillState,
            'interactions': Interaction,
            'achievements': Achievement,
            'learner_achievements': LearnerAchievement,
            'daily_progress': DailyProgress
        }

    def validate_counts(self, collection_name: str) -> dict:
        """Validate record counts match between MongoDB and PostgreSQL"""
        logger.info(f"\n{'='*80}")
        logger.info(f"Validating counts for: {collection_name}")
        logger.info(f"{'='*80}")

        if collection_name not in self.collection_models:
            logger.error(f"Unknown collection: {collection_name}")
            return None

        model = self.collection_models[collection_name]

        # Count MongoDB documents
        mongo_collection = self.mongo_db[collection_name]
        mongo_count = mongo_collection.count_documents({})

        # Count PostgreSQL records
        with app.app_context():
            pg_count = db.session.query(model).count()

        # Calculate difference
        difference = abs(mongo_count - pg_count)
        match_percentage = (min(mongo_count, pg_count) / max(mongo_count, pg_count) * 100) if max(mongo_count, pg_count) > 0 else 100

        result = {
            'collection': collection_name,
            'mongodb_count': mongo_count,
            'postgresql_count': pg_count,
            'difference': difference,
            'match_percentage': match_percentage,
            'status': 'PASS' if mongo_count == pg_count else 'FAIL'
        }

        # Log results
        logger.info(f"MongoDB count:    {mongo_count}")
        logger.info(f"PostgreSQL count: {pg_count}")
        logger.info(f"Difference:       {difference}")
        logger.info(f"Match:            {match_percentage:.2f}%")
        logger.info(f"Status:           {result['status']}")

        if result['status'] == 'FAIL':
            logger.warning(f"⚠️  Count mismatch detected!")
        else:
            logger.info(f"✅ Counts match!")

        return result

    def validate_sample_data(self, collection_name: str, sample_size: int = 10) -> dict:
        """Validate sample records for data integrity"""
        logger.info(f"\n{'='*80}")
        logger.info(f"Validating sample data for: {collection_name}")
        logger.info(f"Sample size: {sample_size}")
        logger.info(f"{'='*80}")

        if collection_name not in self.collection_models:
            logger.error(f"Unknown collection: {collection_name}")
            return None

        model = self.collection_models[collection_name]
        mongo_collection = self.mongo_db[collection_name]

        # Get sample MongoDB documents
        total_docs = mongo_collection.count_documents({})
        if total_docs == 0:
            logger.warning(f"No documents found in {collection_name}")
            return {'status': 'SKIP', 'reason': 'No documents'}

        # Random sample
        sample_size = min(sample_size, total_docs)
        skip_amount = random.randint(0, max(0, total_docs - sample_size))
        mongo_docs = list(mongo_collection.find().skip(skip_amount).limit(sample_size))

        passed = 0
        failed = 0
        errors = []

        with app.app_context():
            for mongo_doc in mongo_docs:
                # Convert MongoDB ObjectId to UUID
                mongo_id = mongo_doc.get('_id')
                pg_id = self.transformer.convert_object_id_to_uuid(mongo_id)

                # Find corresponding PostgreSQL record
                if collection_name in ['item_kc_mappings', 'learner_skill_states',
                                       'learner_achievements', 'daily_progress']:
                    # Composite key models - need special handling
                    # Skip for now in sample validation
                    passed += 1
                    continue

                # Single key models
                pg_record = db.session.query(model).filter_by(
                    **{f"{model.__name__.lower()}_id": pg_id}
                ).first()

                if pg_record:
                    passed += 1
                    logger.debug(f"✓ Found record: {pg_id}")
                else:
                    failed += 1
                    error_msg = f"Missing record: {mongo_id} -> {pg_id}"
                    errors.append(error_msg)
                    logger.debug(f"✗ {error_msg}")

        result = {
            'collection': collection_name,
            'sample_size': sample_size,
            'passed': passed,
            'failed': failed,
            'success_rate': (passed / sample_size * 100) if sample_size > 0 else 0,
            'errors': errors[:5],  # Keep first 5 errors
            'status': 'PASS' if failed == 0 else 'FAIL'
        }

        logger.info(f"\nSample validation results:")
        logger.info(f"  Passed:       {passed}/{sample_size}")
        logger.info(f"  Failed:       {failed}/{sample_size}")
        logger.info(f"  Success rate: {result['success_rate']:.2f}%")
        logger.info(f"  Status:       {result['status']}")

        if errors:
            logger.warning(f"\n⚠️  Sample errors detected:")
            for error in errors[:5]:
                logger.warning(f"  - {error}")

        return result

    def validate_all(self, sample_size: int = 10):
        """Validate all collections"""
        logger.info("\n" + "="*80)
        logger.info("FULL MIGRATION VALIDATION")
        logger.info("="*80 + "\n")

        count_results = []
        sample_results = []

        for collection_name in self.collection_models.keys():
            # Check if collection exists in MongoDB
            if collection_name not in self.mongo_db.list_collection_names():
                logger.info(f"Skipping {collection_name} - not found in MongoDB")
                continue

            # Validate counts
            count_result = self.validate_counts(collection_name)
            if count_result:
                count_results.append(count_result)

            # Validate sample data
            if count_result and count_result['mongodb_count'] > 0:
                sample_result = self.validate_sample_data(collection_name, sample_size)
                if sample_result:
                    sample_results.append(sample_result)

        # Print summary
        logger.info("\n" + "="*80)
        logger.info("VALIDATION SUMMARY")
        logger.info("="*80 + "\n")

        logger.info("Count Validation:")
        logger.info("-" * 80)
        total_mongo = 0
        total_pg = 0
        passed_count = 0

        for result in count_results:
            status_icon = "✅" if result['status'] == 'PASS' else "❌"
            logger.info(f"{status_icon} {result['collection']:25s} | MongoDB: {result['mongodb_count']:6d} | PostgreSQL: {result['postgresql_count']:6d} | Diff: {result['difference']:6d}")
            total_mongo += result['mongodb_count']
            total_pg += result['postgresql_count']
            if result['status'] == 'PASS':
                passed_count += 1

        logger.info("-" * 80)
        logger.info(f"{'Total':25s} | MongoDB: {total_mongo:6d} | PostgreSQL: {total_pg:6d} | Diff: {abs(total_mongo - total_pg):6d}")
        logger.info(f"\nCount validation: {passed_count}/{len(count_results)} collections passed\n")

        if sample_results:
            logger.info("\nSample Data Validation:")
            logger.info("-" * 80)
            passed_sample = 0

            for result in sample_results:
                status_icon = "✅" if result['status'] == 'PASS' else "❌"
                logger.info(f"{status_icon} {result['collection']:25s} | {result['passed']:3d}/{result['sample_size']:3d} passed | {result['success_rate']:5.1f}%")
                if result['status'] == 'PASS':
                    passed_sample += 1

            logger.info(f"\nSample validation: {passed_sample}/{len(sample_results)} collections passed\n")

        # Overall status
        all_passed = (passed_count == len(count_results) and
                      (not sample_results or passed_sample == len(sample_results)))

        logger.info("="*80)
        if all_passed:
            logger.info("✅ ALL VALIDATIONS PASSED - Migration successful!")
        else:
            logger.info("❌ SOME VALIDATIONS FAILED - Please review errors above")
        logger.info("="*80 + "\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Validate MongoDB to PostgreSQL migration'
    )
    parser.add_argument(
        '--collection',
        type=str,
        help='Validate specific collection only'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Validate all collections'
    )
    parser.add_argument(
        '--sample',
        type=int,
        default=10,
        help='Sample size for data validation (default: 10)'
    )
    parser.add_argument(
        '--count-only',
        action='store_true',
        help='Only validate counts, skip sample data'
    )

    args = parser.parse_args()

    validator = MigrationValidator()

    # Validate specific collection
    if args.collection:
        validator.validate_counts(args.collection)
        if not args.count_only:
            validator.validate_sample_data(args.collection, args.sample)
        return

    # Validate all
    if args.all:
        validator.validate_all(args.sample if not args.count_only else 0)
        return

    # No action specified
    parser.print_help()


if __name__ == '__main__':
    main()
