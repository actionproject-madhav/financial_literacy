#!/usr/bin/env python3
"""
Skill Seeder - Insert all knowledge components

This script populates the database with comprehensive knowledge components
across all financial literacy domains.

Usage:
    python -m scripts.seed_skills
    # or
    python scripts/seed_skills.py
"""

from database import Database
from pymongo.errors import DuplicateKeyError
from datetime import datetime

# Comprehensive skills across all domains
SKILLS = [
    # ===== Banking Fundamentals =====
    {
        "slug": "understanding-us-currency",
        "name": "Understanding US Currency",
        "description": "Learn about US dollars, coins, and how to handle cash safely",
        "domain": "banking",
        "difficulty_tier": 1,
        "bloom_level": "understand",
        "estimated_minutes": 10,
        "icon_url": "/icons/currency.svg"
    },
    {
        "slug": "bank-account-types",
        "name": "Types of Bank Accounts",
        "description": "Overview of different account types in the US banking system",
        "domain": "banking",
        "difficulty_tier": 1,
        "bloom_level": "understand",
        "estimated_minutes": 15,
        "icon_url": "/icons/bank-accounts.svg"
    },
    {
        "slug": "checking-accounts",
        "name": "Checking Accounts",
        "description": "How to use checking accounts for everyday transactions",
        "domain": "banking",
        "difficulty_tier": 1,
        "bloom_level": "apply",
        "estimated_minutes": 20,
        "icon_url": "/icons/checking.svg",
        "parent_slug": "bank-account-types"
    },
    {
        "slug": "savings-accounts",
        "name": "Savings Accounts",
        "description": "Building savings with interest-bearing accounts",
        "domain": "banking",
        "difficulty_tier": 1,
        "bloom_level": "apply",
        "estimated_minutes": 20,
        "icon_url": "/icons/savings.svg",
        "parent_slug": "bank-account-types"
    },
    {
        "slug": "bank-fees-and-terms",
        "name": "Bank Fees and Terms",
        "description": "Understanding common banking fees and how to avoid them",
        "domain": "banking",
        "difficulty_tier": 2,
        "bloom_level": "analyze",
        "estimated_minutes": 25,
        "icon_url": "/icons/fees.svg"
    },
    {
        "slug": "mobile-banking-basics",
        "name": "Mobile Banking Basics",
        "description": "Using mobile apps to manage your money safely",
        "domain": "banking",
        "difficulty_tier": 1,
        "bloom_level": "apply",
        "estimated_minutes": 15,
        "icon_url": "/icons/mobile-banking.svg"
    },
    {
        "slug": "wire-transfers-remittances",
        "name": "Wire Transfers and Remittances",
        "description": "Sending money internationally and domestically",
        "domain": "banking",
        "difficulty_tier": 2,
        "bloom_level": "apply",
        "estimated_minutes": 30,
        "icon_url": "/icons/wire-transfer.svg"
    },

    # ===== Money Management =====
    {
        "slug": "w2-employment",
        "name": "W2 Employment",
        "description": "Understanding W2 employment status and what it means",
        "domain": "money-management",
        "difficulty_tier": 1,
        "bloom_level": "understand",
        "estimated_minutes": 15,
        "icon_url": "/icons/employment.svg"
    },
    {
        "slug": "understanding-paystubs",
        "name": "Understanding Paystubs",
        "description": "Reading and interpreting your paycheck stub",
        "domain": "money-management",
        "difficulty_tier": 2,
        "bloom_level": "analyze",
        "estimated_minutes": 25,
        "icon_url": "/icons/paystub.svg"
    },
    {
        "slug": "expense-tracking",
        "name": "Expense Tracking",
        "description": "Tools and methods to track your spending",
        "domain": "money-management",
        "difficulty_tier": 1,
        "bloom_level": "apply",
        "estimated_minutes": 20,
        "icon_url": "/icons/expense-tracking.svg"
    },
    {
        "slug": "50-30-20-rule",
        "name": "50/30/20 Budgeting Rule",
        "description": "Simple budgeting framework for managing income",
        "domain": "money-management",
        "difficulty_tier": 2,
        "bloom_level": "apply",
        "estimated_minutes": 30,
        "icon_url": "/icons/budget.svg"
    },
    {
        "slug": "emergency-fund-planning",
        "name": "Emergency Fund Planning",
        "description": "Building a financial safety net for unexpected expenses",
        "domain": "money-management",
        "difficulty_tier": 2,
        "bloom_level": "create",
        "estimated_minutes": 35,
        "icon_url": "/icons/emergency-fund.svg"
    },

    # ===== Credit and Debt =====
    {
        "slug": "what-is-credit",
        "name": "What is Credit",
        "description": "Introduction to credit and how it works in the US",
        "domain": "credit",
        "difficulty_tier": 1,
        "bloom_level": "understand",
        "estimated_minutes": 15,
        "icon_url": "/icons/credit.svg"
    },
    {
        "slug": "credit-score-basics",
        "name": "Credit Score Basics",
        "description": "Understanding FICO scores and credit bureaus",
        "domain": "credit",
        "difficulty_tier": 1,
        "bloom_level": "understand",
        "estimated_minutes": 20,
        "icon_url": "/icons/credit-score.svg",
        "parent_slug": "what-is-credit"
    },
    {
        "slug": "credit-score-factors",
        "name": "Credit Score Factors",
        "description": "The 5 key factors that determine your credit score",
        "domain": "credit",
        "difficulty_tier": 2,
        "bloom_level": "analyze",
        "estimated_minutes": 30,
        "icon_url": "/icons/credit-factors.svg",
        "parent_slug": "credit-score-basics"
    },
    {
        "slug": "building-credit",
        "name": "Building Credit History",
        "description": "Strategies for establishing and improving your credit",
        "domain": "credit",
        "difficulty_tier": 2,
        "bloom_level": "apply",
        "estimated_minutes": 25,
        "icon_url": "/icons/credit-building.svg",
        "parent_slug": "credit-score-basics"
    },
    {
        "slug": "secured-credit-cards",
        "name": "Secured Credit Cards",
        "description": "Using secured cards to build credit from scratch",
        "domain": "credit",
        "difficulty_tier": 2,
        "bloom_level": "apply",
        "estimated_minutes": 20,
        "icon_url": "/icons/secured-card.svg"
    },
    {
        "slug": "understanding-interest-rates",
        "name": "Understanding Interest Rates",
        "description": "APR, compound interest, and how credit card interest works",
        "domain": "credit",
        "difficulty_tier": 2,
        "bloom_level": "understand",
        "estimated_minutes": 25,
        "icon_url": "/icons/interest.svg"
    },

    # ===== Investing =====
    {
        "slug": "what-is-investing",
        "name": "What is Investing",
        "description": "Introduction to investing and building wealth",
        "domain": "investing",
        "difficulty_tier": 1,
        "bloom_level": "understand",
        "estimated_minutes": 20,
        "icon_url": "/icons/investing.svg"
    },
    {
        "slug": "risk-vs-return",
        "name": "Risk vs Return",
        "description": "Understanding the relationship between risk and potential gains",
        "domain": "investing",
        "difficulty_tier": 2,
        "bloom_level": "analyze",
        "estimated_minutes": 30,
        "icon_url": "/icons/risk-return.svg"
    },
    {
        "slug": "stocks-basics",
        "name": "Stocks Basics",
        "description": "What stocks are and how the stock market works",
        "domain": "investing",
        "difficulty_tier": 2,
        "bloom_level": "understand",
        "estimated_minutes": 25,
        "icon_url": "/icons/stocks.svg"
    },
    {
        "slug": "bonds-basics",
        "name": "Bonds Basics",
        "description": "Introduction to bonds and fixed-income investing",
        "domain": "investing",
        "difficulty_tier": 2,
        "bloom_level": "understand",
        "estimated_minutes": 25,
        "icon_url": "/icons/bonds.svg"
    },
    {
        "slug": "etfs-explained",
        "name": "ETFs Explained",
        "description": "Exchange-traded funds and their advantages",
        "domain": "investing",
        "difficulty_tier": 2,
        "bloom_level": "understand",
        "estimated_minutes": 30,
        "icon_url": "/icons/etf.svg"
    },
    {
        "slug": "index-funds",
        "name": "Index Funds",
        "description": "Passive investing with index funds",
        "domain": "investing",
        "difficulty_tier": 2,
        "bloom_level": "apply",
        "estimated_minutes": 30,
        "icon_url": "/icons/index-funds.svg"
    },
    {
        "slug": "diversification",
        "name": "Diversification",
        "description": "Don't put all your eggs in one basket - portfolio diversification",
        "domain": "investing",
        "difficulty_tier": 3,
        "bloom_level": "create",
        "estimated_minutes": 35,
        "icon_url": "/icons/diversification.svg"
    },

    # ===== Retirement =====
    {
        "slug": "retirement-planning-basics",
        "name": "Retirement Planning Basics",
        "description": "Why and how to save for retirement in the US",
        "domain": "retirement",
        "difficulty_tier": 2,
        "bloom_level": "understand",
        "estimated_minutes": 25,
        "icon_url": "/icons/retirement.svg"
    },
    {
        "slug": "401k-basics",
        "name": "401(k) Basics",
        "description": "Employer-sponsored retirement accounts",
        "domain": "retirement",
        "difficulty_tier": 2,
        "bloom_level": "apply",
        "estimated_minutes": 30,
        "icon_url": "/icons/401k.svg"
    },
    {
        "slug": "employer-match",
        "name": "Employer Match",
        "description": "Understanding and maximizing employer 401(k) matching",
        "domain": "retirement",
        "difficulty_tier": 2,
        "bloom_level": "apply",
        "estimated_minutes": 20,
        "icon_url": "/icons/match.svg",
        "parent_slug": "401k-basics"
    },
    {
        "slug": "traditional-ira",
        "name": "Traditional IRA",
        "description": "Individual Retirement Accounts with tax-deferred growth",
        "domain": "retirement",
        "difficulty_tier": 3,
        "bloom_level": "apply",
        "estimated_minutes": 35,
        "icon_url": "/icons/ira.svg"
    },
    {
        "slug": "roth-ira",
        "name": "Roth IRA",
        "description": "After-tax retirement accounts with tax-free withdrawals",
        "domain": "retirement",
        "difficulty_tier": 3,
        "bloom_level": "apply",
        "estimated_minutes": 35,
        "icon_url": "/icons/roth.svg"
    },

    # ===== Taxes =====
    {
        "slug": "itin-vs-ssn",
        "name": "ITIN vs SSN",
        "description": "Tax identification numbers and when to use each",
        "domain": "taxes",
        "difficulty_tier": 1,
        "bloom_level": "understand",
        "estimated_minutes": 15,
        "icon_url": "/icons/itin-ssn.svg"
    },
    {
        "slug": "w2-and-1099-forms",
        "name": "W2 and 1099 Forms",
        "description": "Understanding tax forms for employees and contractors",
        "domain": "taxes",
        "difficulty_tier": 2,
        "bloom_level": "understand",
        "estimated_minutes": 25,
        "icon_url": "/icons/tax-forms.svg"
    },
    {
        "slug": "tax-withholding",
        "name": "Tax Withholding",
        "description": "How taxes are taken from your paycheck",
        "domain": "taxes",
        "difficulty_tier": 2,
        "bloom_level": "understand",
        "estimated_minutes": 20,
        "icon_url": "/icons/withholding.svg"
    },
    {
        "slug": "filing-taxes",
        "name": "Filing Your Taxes",
        "description": "Steps to file your annual tax return",
        "domain": "taxes",
        "difficulty_tier": 2,
        "bloom_level": "apply",
        "estimated_minutes": 40,
        "icon_url": "/icons/tax-filing.svg"
    },
    {
        "slug": "free-filing-options",
        "name": "Free Filing Options",
        "description": "IRS Free File and other free tax preparation services",
        "domain": "taxes",
        "difficulty_tier": 2,
        "bloom_level": "apply",
        "estimated_minutes": 20,
        "icon_url": "/icons/free-file.svg"
    },
    {
        "slug": "tax-deductions-credits",
        "name": "Tax Deductions and Credits",
        "description": "Common deductions and credits to reduce your tax bill",
        "domain": "taxes",
        "difficulty_tier": 3,
        "bloom_level": "analyze",
        "estimated_minutes": 35,
        "icon_url": "/icons/deductions.svg"
    },

    # ===== Cryptocurrency =====
    {
        "slug": "what-is-cryptocurrency",
        "name": "What is Cryptocurrency",
        "description": "Introduction to Bitcoin, blockchain, and digital assets",
        "domain": "crypto",
        "difficulty_tier": 2,
        "bloom_level": "understand",
        "estimated_minutes": 30,
        "icon_url": "/icons/crypto.svg"
    },
    {
        "slug": "crypto-wallets",
        "name": "Crypto Wallets",
        "description": "Hot wallets, cold wallets, and securing your crypto",
        "domain": "crypto",
        "difficulty_tier": 3,
        "bloom_level": "apply",
        "estimated_minutes": 35,
        "icon_url": "/icons/wallet.svg"
    },
    {
        "slug": "crypto-exchanges",
        "name": "Crypto Exchanges",
        "description": "Buying and selling cryptocurrency on exchanges",
        "domain": "crypto",
        "difficulty_tier": 3,
        "bloom_level": "apply",
        "estimated_minutes": 30,
        "icon_url": "/icons/exchange.svg"
    },
    {
        "slug": "crypto-tax-reporting",
        "name": "Crypto Tax Reporting",
        "description": "IRS rules for reporting cryptocurrency transactions",
        "domain": "crypto",
        "difficulty_tier": 3,
        "bloom_level": "apply",
        "estimated_minutes": 40,
        "icon_url": "/icons/crypto-tax.svg"
    },
]


def seed_skills():
    """Seed all knowledge components into the database"""
    print("="*80)
    print("SEEDING KNOWLEDGE COMPONENTS")
    print("="*80)

    # Initialize database
    db = Database()

    if not db.is_connected:
        print("\n❌ Cannot connect to database. Check your MONGO_URI in .env")
        return False

    print(f"\n📚 Inserting {len(SKILLS)} knowledge components...")

    # Track parent relationships to set later
    parent_relationships = []

    created_count = 0
    skipped_count = 0
    error_count = 0

    for skill_data in SKILLS:
        try:
            # Check if skill already exists
            existing = db.collections.knowledge_components.find_one({
                "slug": skill_data["slug"]
            })

            if existing:
                print(f"  ⚠️  Skill already exists: {skill_data['name']} ({skill_data['slug']})")
                skipped_count += 1
                continue

            # Extract parent_slug if present
            parent_slug = skill_data.pop("parent_slug", None)

            # Create the knowledge component
            kc_id = db.collections.create_knowledge_component(**skill_data)

            print(f"  ✓ Created: {skill_data['name']} ({skill_data['slug']})")
            created_count += 1

            # Track parent relationship
            if parent_slug:
                parent_relationships.append({
                    "child_slug": skill_data["slug"],
                    "parent_slug": parent_slug
                })

        except DuplicateKeyError:
            print(f"  ⚠️  Duplicate key: {skill_data['slug']}")
            skipped_count += 1
        except Exception as e:
            print(f"  ❌ Error creating {skill_data['slug']}: {e}")
            error_count += 1

    # Now set parent relationships
    if parent_relationships:
        print(f"\n🔗 Setting up parent relationships...")

        for rel in parent_relationships:
            try:
                child = db.collections.knowledge_components.find_one({
                    "slug": rel["child_slug"]
                })
                parent = db.collections.knowledge_components.find_one({
                    "slug": rel["parent_slug"]
                })

                if child and parent:
                    db.collections.knowledge_components.update_one(
                        {"_id": child["_id"]},
                        {"$set": {"parent_kc_id": parent["_id"]}}
                    )
                    print(f"  ✓ Linked {rel['child_slug']} → {rel['parent_slug']}")
                else:
                    print(f"  ⚠️  Could not link {rel['child_slug']} → {rel['parent_slug']}")

            except Exception as e:
                print(f"  ❌ Error linking {rel['child_slug']}: {e}")

    # Summary
    print("\n" + "="*80)
    print("SEEDING COMPLETE")
    print("="*80)
    print(f"\n📊 Summary:")
    print(f"  • Created: {created_count}")
    print(f"  • Skipped (already exist): {skipped_count}")
    print(f"  • Errors: {error_count}")
    print(f"  • Total: {len(SKILLS)}")
    print(f"  • Parent relationships: {len(parent_relationships)}")

    # Show breakdown by domain
    from collections import Counter
    domain_counts = Counter(skill["domain"] for skill in SKILLS)

    print(f"\n📚 By Domain:")
    for domain, count in sorted(domain_counts.items()):
        print(f"  • {domain}: {count} skills")

    print("\n✅ Knowledge components seeded successfully!\n")

    return True


if __name__ == "__main__":
    seed_skills()
