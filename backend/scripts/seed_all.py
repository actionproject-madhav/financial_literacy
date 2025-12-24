#!/usr/bin/env python3
"""
Master Seeder - Run all seed scripts in order

This script runs all seeding scripts in the correct order to populate
the entire database with comprehensive seed data.

Usage:
    python -m scripts.seed_all
    # or
    python scripts/seed_all.py
"""

import sys
from seed_skills import seed_skills
from generate_questions import insert_questions
from seed_cultural_contexts import seed_contexts
from seed_achievements import seed_achievements


def seed_all():
    """Run all seed scripts in order"""
    print("\n" + "="*80)
    print("  MASTER SEEDER - POPULATE ENTIRE DATABASE")
    print("="*80)

    print("\n🚀 This will run all seed scripts in order:")
    print("   1. Knowledge Components (Skills)")
    print("   2. Learning Items (Questions)")
    print("   3. Cultural Contexts")
    print("   4. Achievements")
    print("\n⚠️  This may take a few minutes...\n")

    response = input("Continue? [y/N]: ")
    if response.lower() != 'y':
        print("\n❌ Aborted by user\n")
        return False

    success = True

    # Step 1: Seed skills
    print("\n" + "="*80)
    print("STEP 1/3: SEEDING KNOWLEDGE COMPONENTS")
    print("="*80)
    try:
        if not seed_skills():
            print("❌ Failed to seed knowledge components")
            success = False
    except Exception as e:
        print(f"❌ Error seeding knowledge components: {e}")
        success = False

    if not success:
        print("\n❌ Aborting due to errors in step 1")
        return False

    # Step 2: Generate questions
    print("\n" + "="*80)
    print("STEP 2/3: GENERATING LEARNING ITEMS")
    print("="*80)
    try:
        if not insert_questions():
            print("❌ Failed to generate learning items")
            success = False
    except Exception as e:
        print(f"❌ Error generating learning items: {e}")
        success = False

    # Step 3: Seed cultural contexts
    print("\n" + "="*80)
    print("STEP 3/4: SEEDING CULTURAL CONTEXTS")
    print("="*80)
    try:
        if not seed_contexts():
            print("❌ Failed to seed cultural contexts")
            success = False
    except Exception as e:
        print(f"❌ Error seeding cultural contexts: {e}")
        success = False

    # Step 4: Seed achievements
    print("\n" + "="*80)
    print("STEP 4/4: SEEDING ACHIEVEMENTS")
    print("="*80)
    try:
        seed_achievements()  # This function doesn't return a boolean
        print("✅ Achievements seeded successfully")
    except Exception as e:
        print(f"❌ Error seeding achievements: {e}")
        success = False

    # Final summary
    print("\n" + "="*80)
    if success:
        print("✅ ALL SEED SCRIPTS COMPLETED SUCCESSFULLY!")
    else:
        print("⚠️  SEEDING COMPLETED WITH SOME ERRORS")
    print("="*80)

    if success:
        print("\n🎉 Your database is now populated with:")
        print("   • 40+ Knowledge Components across 7 domains")
        print("   • 30+ Learning Items (Questions)")
        print("   • 40+ Cultural Contexts for 5+ countries")
        print("   • 15+ Achievements for gamification")
        print("\n💡 Next Steps:")
        print("   1. Run the API test: python test_api.py")
        print("   2. Start the Flask server: python app.py")
        print("   3. Try the example usage: python example_usage.py")
        print("\n")
    else:
        print("\n⚠️  Some errors occurred. Check the output above for details.")
        print("   You can run individual scripts to retry specific steps:")
        print("   • python -m scripts.seed_skills")
        print("   • python -m scripts.generate_questions")
        print("   • python -m scripts.seed_cultural_contexts")
        print("   • python -m scripts.seed_achievements")
        print("\n")

    return success


if __name__ == "__main__":
    try:
        success = seed_all()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Interrupted by user\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}\n")
        sys.exit(1)
