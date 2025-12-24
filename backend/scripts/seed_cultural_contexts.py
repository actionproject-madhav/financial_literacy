#!/usr/bin/env python3
"""
Cultural Context Seeder - Add culturally relevant context to knowledge components

This script populates cultural context data that helps learners from different
countries understand US financial concepts by comparing them to their home country.

Usage:
    python -m scripts.seed_cultural_contexts
    # or
    python scripts/seed_cultural_contexts.py
"""

from database import Database
from datetime import datetime

# Cultural contexts for different countries and topics
CONTEXTS = [
    # ===== Credit Score Concepts =====
    {
        "skill": "credit-score-basics",
        "country": "IND",
        "type": "comparison",
        "content": "Unlike India's CIBIL score which ranges from 300-900, US FICO scores range from 300-850. Both measure creditworthiness similarly - payment history, credit utilization, and length of credit history are key factors in both systems."
    },
    {
        "skill": "credit-score-basics",
        "country": "CHN",
        "type": "comparison",
        "content": "China's Social Credit System is different from US credit scores. US credit scores only track financial behavior (loans, credit cards, payments), not social behavior. Your score is determined by banks and credit bureaus, not the government."
    },
    {
        "skill": "credit-score-basics",
        "country": "NPL",
        "type": "equivalent",
        "content": "Nepal doesn't have a centralized credit scoring system like FICO. In the US, your financial history follows you everywhere through credit bureaus (Equifax, Experian, TransUnion). Building good credit early is crucial."
    },
    {
        "skill": "credit-score-basics",
        "country": "MEX",
        "type": "comparison",
        "content": "Mexico has Buró de Crédito and Círculo de Crédito, similar to US credit bureaus. However, your Mexican credit history won't transfer to the US - you'll start with no credit history and need to build it from scratch."
    },
    {
        "skill": "credit-score-factors",
        "country": "IND",
        "type": "comparison",
        "content": "Just like CIBIL in India, FICO scores prioritize: (1) Payment history (35%), (2) Credit utilization (30%), (3) Length of credit history (15%), (4) New credit (10%), (5) Credit mix (10%). The principles are the same."
    },
    {
        "skill": "building-credit",
        "country": "IND",
        "type": "warning",
        "content": "In India, you might have built credit through home loans or car loans. In the US, credit cards are the most common way to build credit. Don't avoid credit cards - used responsibly, they're essential tools."
    },
    {
        "skill": "building-credit",
        "country": "MEX",
        "type": "comparison",
        "content": "Unlike Mexico where cash is king and many people don't use credit cards, in the US you NEED credit history for major purchases (homes, cars) and even apartments. Start building credit early with a secured card."
    },

    # ===== Banking Concepts =====
    {
        "skill": "checking-accounts",
        "country": "IND",
        "type": "equivalent",
        "content": "A US checking account is similar to an Indian Savings Account used for daily transactions, but with lower interest rates. Most Americans use checking for all regular spending and keep savings separate."
    },
    {
        "skill": "checking-accounts",
        "country": "CHN",
        "type": "comparison",
        "content": "Unlike China where WeChat Pay and Alipay dominate, the US still relies heavily on traditional banking. Checking accounts linked to debit cards are the standard for daily transactions. Mobile payment apps like Venmo/Zelle are growing but not as universal."
    },
    {
        "skill": "checking-accounts",
        "country": "PHL",
        "type": "tip",
        "content": "Similar to using GCash in the Philippines, many US banks offer mobile banking apps. However, you'll still need a traditional checking account - the app is just a tool to access it."
    },
    {
        "skill": "bank-fees-and-terms",
        "country": "IND",
        "type": "warning",
        "content": "US banks charge more fees than Indian banks - monthly maintenance fees ($10-15), overdraft fees ($30-35), ATM fees ($2-5). Look for accounts with fee waivers through direct deposit or minimum balance."
    },
    {
        "skill": "wire-transfers-remittances",
        "country": "MEX",
        "type": "comparison",
        "content": "Sending money to Mexico? Traditional banks charge $40-50 per wire transfer. Consider alternatives like Wise (formerly TransferWise), Remitly, or Xoom for much lower fees (often under $5) and better exchange rates."
    },
    {
        "skill": "wire-transfers-remittances",
        "country": "IND",
        "type": "comparison",
        "content": "For remittances to India, alternatives like Wise, Remitly, or Xoom typically offer better rates than traditional banks. Some offer INR direct deposit to Indian bank accounts within 1-2 days for low fees."
    },

    # ===== Tax Concepts =====
    {
        "skill": "itin-vs-ssn",
        "country": "IND",
        "type": "equivalent",
        "content": "ITIN is like PAN card in India - used for tax purposes only. SSN is more like Aadhaar - a universal ID number. If you're eligible for SSN (on H1B, OPT, etc.), always use SSN instead of ITIN."
    },
    {
        "skill": "itin-vs-ssn",
        "country": "MEX",
        "type": "equivalent",
        "content": "ITIN is similar to Mexico's RFC (Registro Federal de Contribuyentes) for tax purposes. SSN is a broader ID like CURP. Choose SSN if you're eligible to work in the US."
    },
    {
        "skill": "filing-taxes",
        "country": "IND",
        "type": "comparison",
        "content": "US tax filing is different from India's ITR process. In the US, YOU must file taxes even if your employer withholds - the government doesn't automatically process it. Deadline is April 15th each year for the previous year."
    },
    {
        "skill": "filing-taxes",
        "country": "CHN",
        "type": "comparison",
        "content": "Unlike China's employer-filed system, in the US you must file your own taxes even though your employer withholds. Use Form 1040 for federal taxes. Many states also require separate state tax returns."
    },
    {
        "skill": "w2-and-1099-forms",
        "country": "IND",
        "type": "comparison",
        "content": "W2 is for salaried employees (like Form 16 in India). 1099 is for contractors/freelancers. H1B holders receive W2. Be careful with 1099 - you'll owe both employer and employee portions of taxes."
    },

    # ===== Retirement Concepts =====
    {
        "skill": "401k-basics",
        "country": "IND",
        "type": "equivalent",
        "content": "401(k) is similar to India's EPF (Employee Provident Fund) but more flexible. You choose how to invest it (stocks, bonds, etc.), and contributions are pre-tax. Many employers match contributions - free money!"
    },
    {
        "skill": "401k-basics",
        "country": "MEX",
        "type": "equivalent",
        "content": "US 401(k) is similar to Mexico's Afore retirement system, but with more investment control. Your employer may match up to 3-6% of contributions - always contribute at least enough to get the full match."
    },
    {
        "skill": "roth-ira",
        "country": "IND",
        "type": "comparison",
        "content": "Roth IRA has no direct equivalent in India. You pay taxes now but withdrawals in retirement are tax-free. Similar concept to NPS's Tier-1 account but with tax treatment reversed. Great for young earners expecting higher income later."
    },

    # ===== Investing Concepts =====
    {
        "skill": "stocks-basics",
        "country": "IND",
        "type": "comparison",
        "content": "US stock market (NYSE, NASDAQ) works similarly to NSE/BSE in India. Main difference: US market is much larger and more liquid. Many Indian companies (like Infosys, ICICI) have ADRs (American Depositary Receipts) listed in the US."
    },
    {
        "skill": "stocks-basics",
        "country": "CHN",
        "type": "comparison",
        "content": "Unlike China's A-share market which has foreign ownership restrictions, US markets are fully open to all investors. You can freely buy and sell stocks as a visa holder - no special permissions needed."
    },
    {
        "skill": "index-funds",
        "country": "IND",
        "type": "comparison",
        "content": "US index funds like S&P 500 are similar to India's Nifty 50 or Sensex index funds. They track the overall market. Very low fees (often 0.03-0.1%) compared to actively managed funds."
    },

    # ===== Money Management =====
    {
        "skill": "50-30-20-rule",
        "country": "PHL",
        "type": "tip",
        "content": "The 50/30/20 rule applies regardless of income level. Even if you're sending remittances home, try to save at least 20% for your future. Consider remittances as part of your 'needs' (50%) if supporting family."
    },
    {
        "skill": "emergency-fund-planning",
        "country": "IND",
        "type": "comparison",
        "content": "Unlike India where family can often help in emergencies, in the US you're more on your own. Target 3-6 months of expenses in an emergency fund. Use a high-yield savings account (currently 4-5% APY) instead of keeping it idle."
    },
    {
        "skill": "understanding-paystubs",
        "country": "MEX",
        "type": "comparison",
        "content": "US paystubs are more detailed than Mexican recibos de nómina. You'll see: gross pay, federal taxes, FICA (Social Security/Medicare), state taxes, and deductions. Net pay is what actually hits your account - often 25-30% less than gross."
    },

    # ===== Cryptocurrency =====
    {
        "skill": "crypto-tax-reporting",
        "country": "ALL",
        "type": "warning",
        "content": "CRITICAL: In the US, cryptocurrency is treated as property by the IRS. EVERY trade (even crypto-to-crypto) is a taxable event. You must report all transactions on Form 8949. Failure to report can result in serious penalties."
    },
]


def seed_contexts():
    """Seed all cultural contexts into the database"""
    print("="*80)
    print("SEEDING CULTURAL CONTEXTS")
    print("="*80)

    # Initialize database
    db = Database()

    if not db.is_connected:
        print("\n❌ Cannot connect to database. Check your MONGO_URI in .env")
        return False

    print(f"\n🌍 Inserting {len(CONTEXTS)} cultural contexts...")

    created_count = 0
    skipped_count = 0
    error_count = 0

    for ctx in CONTEXTS:
        try:
            # Find the knowledge component
            skill = db.collections.knowledge_components.find_one({"slug": ctx["skill"]})

            if not skill:
                print(f"  ⚠️  KC not found: {ctx['skill']}")
                error_count += 1
                continue

            kc_id = skill['_id']

            # Check if context already exists
            existing = db.collections.cultural_contexts.find_one({
                "kc_id": kc_id,
                "country_code": ctx["country"],
                "context_type": ctx["type"]
            })

            if existing:
                skipped_count += 1
                continue

            # Insert context
            db.collections.cultural_contexts.insert_one({
                "kc_id": kc_id,
                "country_code": ctx["country"],
                "context_type": ctx["type"],
                "content": ctx["content"],
                "is_verified": True,
                "created_at": datetime.utcnow(),
                "upvotes": 0,
                "downvotes": 0
            })

            print(f"  ✓ Added context: {ctx['skill']} ({ctx['country']}) - {ctx['type']}")
            created_count += 1

        except Exception as e:
            print(f"  ❌ Error adding context for {ctx.get('skill', 'unknown')}: {e}")
            error_count += 1

    # Summary
    print("\n" + "="*80)
    print("CULTURAL CONTEXT SEEDING COMPLETE")
    print("="*80)
    print(f"\n📊 Summary:")
    print(f"  • Created: {created_count}")
    print(f"  • Skipped (already exist): {skipped_count}")
    print(f"  • Errors: {error_count}")
    print(f"  • Total: {len(CONTEXTS)}")

    # Show breakdown by country
    from collections import Counter
    country_counts = Counter(ctx["country"] for ctx in CONTEXTS)

    print(f"\n🌍 By Country:")
    country_names = {
        "IND": "India",
        "CHN": "China",
        "MEX": "Mexico",
        "NPL": "Nepal",
        "PHL": "Philippines",
        "ALL": "All Countries"
    }
    for country_code, count in sorted(country_counts.items()):
        country_name = country_names.get(country_code, country_code)
        print(f"  • {country_name} ({country_code}): {count} contexts")

    # Show breakdown by type
    type_counts = Counter(ctx["type"] for ctx in CONTEXTS)

    print(f"\n📝 By Type:")
    for ctx_type, count in sorted(type_counts.items()):
        print(f"  • {ctx_type}: {count} contexts")

    print("\n💡 Next Steps:")
    print("  • Add contexts for more countries (Brazil, Vietnam, Nigeria, etc.)")
    print("  • Get community verification for contexts")
    print("  • Translate contexts to native languages")
    print("\n✅ Cultural contexts seeded successfully!\n")

    return True


if __name__ == "__main__":
    seed_contexts()
