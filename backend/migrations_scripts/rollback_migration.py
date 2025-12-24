#!/usr/bin/env python3
"""
Rollback script to clear migrated data from PostgreSQL

⚠️  WARNING: This script will DELETE data from PostgreSQL!
Use with caution.

Usage:
    python rollback_migration.py --dry-run        # Show what would be deleted
    python rollback_migration.py --collection users # Clear specific table
    python rollback_migration.py --all --confirm  # Clear all tables (requires confirmation)
"""
import sys
import os
import argparse

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from config.database import db
from models import (
    Learner, KnowledgeComponent, LearningItem, ItemKCMapping,
    LearnerSkillState, Interaction, Achievement, LearnerAchievement,
    DailyProgress
)
from migration_utils import logger


class MigrationRollback:
    """Rollback migrated data"""

    def __init__(self, dry_run=False):
        self.dry_run = dry_run

        # Models in reverse dependency order (to avoid FK violations)
        self.models_in_order = [
            ('daily_progress', DailyProgress),
            ('learner_achievements', LearnerAchievement),
            ('achievements', Achievement),
            ('interactions', Interaction),
            ('learner_skill_states', LearnerSkillState),
            ('item_kc_mappings', ItemKCMapping),
            ('learning_items', LearningItem),
            ('knowledge_components', KnowledgeComponent),
            ('learners', Learner),
        ]

    def clear_table(self, name: str, model: type) -> dict:
        """Clear all records from a table"""
        logger.info(f"\n{'='*80}")
        logger.info(f"{'DRY RUN: ' if self.dry_run else ''}Clearing table: {name}")
        logger.info(f"{'='*80}")

        result = {
            'table': name,
            'records_deleted': 0,
            'status': 'SUCCESS'
        }

        try:
            with app.app_context():
                # Count records before deletion
                count = db.session.query(model).count()
                logger.info(f"Found {count} records in {name}")

                if count == 0:
                    logger.info(f"Table {name} is already empty")
                    return result

                if self.dry_run:
                    logger.info(f"[DRY RUN] Would delete {count} records from {name}")
                    result['records_deleted'] = count
                else:
                    # Delete all records
                    deleted = db.session.query(model).delete()
                    db.session.commit()
                    logger.info(f"✅ Deleted {deleted} records from {name}")
                    result['records_deleted'] = deleted

        except Exception as e:
            logger.error(f"❌ Error clearing {name}: {str(e)}")
            result['status'] = 'ERROR'
            result['error'] = str(e)
            if not self.dry_run:
                db.session.rollback()

        return result

    def clear_all_tables(self):
        """Clear all tables in correct order"""
        logger.info("\n" + "="*80)
        logger.info(f"{'DRY RUN: ' if self.dry_run else ''}CLEARING ALL MIGRATED DATA")
        logger.info("="*80 + "\n")

        if self.dry_run:
            logger.info("🔍 DRY RUN MODE - No data will be deleted\n")
        else:
            logger.warning("⚠️  WARNING: This will DELETE all migrated data from PostgreSQL!")
            logger.warning("⚠️  This action cannot be undone!\n")

        results = []
        total_deleted = 0

        for name, model in self.models_in_order:
            result = self.clear_table(name, model)
            results.append(result)
            total_deleted += result['records_deleted']

        # Print summary
        logger.info("\n" + "="*80)
        logger.info("ROLLBACK SUMMARY")
        logger.info("="*80 + "\n")

        for result in results:
            status_icon = "✅" if result['status'] == 'SUCCESS' else "❌"
            logger.info(f"{status_icon} {result['table']:25s} | {result['records_deleted']:6d} records deleted")

        logger.info("-" * 80)
        logger.info(f"{'Total':25s} | {total_deleted:6d} records deleted")
        logger.info("="*80 + "\n")

        if self.dry_run:
            logger.info("✅ DRY RUN COMPLETED - No data was deleted")
        else:
            logger.info("✅ ROLLBACK COMPLETED - All data deleted")

    def get_table_counts(self):
        """Show current record counts"""
        logger.info("\n" + "="*80)
        logger.info("CURRENT POSTGRESQL TABLE COUNTS")
        logger.info("="*80 + "\n")

        total = 0

        with app.app_context():
            for name, model in reversed(self.models_in_order):
                count = db.session.query(model).count()
                total += count
                logger.info(f"{name:25s} | {count:6d} records")

        logger.info("-" * 80)
        logger.info(f"{'Total':25s} | {total:6d} records")
        logger.info("="*80 + "\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Rollback MongoDB to PostgreSQL migration'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be deleted without actually deleting'
    )
    parser.add_argument(
        '--collection',
        type=str,
        choices=['learners', 'knowledge_components', 'learning_items',
                 'item_kc_mappings', 'learner_skill_states', 'interactions',
                 'achievements', 'learner_achievements', 'daily_progress'],
        help='Clear specific table only'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Clear all tables'
    )
    parser.add_argument(
        '--confirm',
        action='store_true',
        help='Confirm deletion (required for non-dry-run)'
    )
    parser.add_argument(
        '--counts',
        action='store_true',
        help='Show current table counts'
    )

    args = parser.parse_args()

    rollback = MigrationRollback(dry_run=args.dry_run)

    # Show counts
    if args.counts:
        rollback.get_table_counts()
        return

    # Require confirmation for actual deletion
    if not args.dry_run and not args.confirm:
        logger.error("❌ ERROR: --confirm flag required for actual deletion")
        logger.error("💡 Use --dry-run to see what would be deleted")
        logger.error("💡 Use --confirm to proceed with deletion")
        return

    # Clear specific table
    if args.collection:
        # Find model for collection
        model_dict = dict(rollback.models_in_order)
        if args.collection in model_dict:
            rollback.clear_table(args.collection, model_dict[args.collection])
        else:
            logger.error(f"Unknown collection: {args.collection}")
        return

    # Clear all tables
    if args.all:
        if not args.dry_run:
            # Double confirmation
            logger.warning("\n⚠️  FINAL WARNING ⚠️")
            logger.warning("This will DELETE ALL migrated data from PostgreSQL!")
            logger.warning("This action CANNOT be undone!")
            response = input("\nType 'DELETE ALL DATA' to confirm: ")
            if response != 'DELETE ALL DATA':
                logger.info("❌ Rollback cancelled")
                return

        rollback.clear_all_tables()
        return

    # No action specified
    parser.print_help()
    logger.info("\n💡 Tip: Use --counts to see current table counts")
    logger.info("💡 Tip: Use --dry-run to test rollback without deleting")


if __name__ == '__main__':
    main()
