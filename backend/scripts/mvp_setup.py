"""
MVP Setup - No Credit Card Required

Sets up budget services using only free services (no card needed):
- Deepgram STT ($200 free credit, no card)
- Local Embeddings (100% free)
- Supabase Storage (1GB free, no card)
- OpenAI TTS (fallback, you already have it)
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config


def check_services():
    """Check which services are configured"""
    print("=== Checking Service Configuration ===\n")

    services = {
        'Deepgram (STT)': bool(config.DEEPGRAM_API_KEY),
        'OpenAI (TTS/LLM)': bool(config.OPENAI_API_KEY),
        'Supabase Storage': bool(config.SUPABASE_URL and config.SUPABASE_SERVICE_KEY),
        'Local Embeddings': True  # Always available after download
    }

    for service, configured in services.items():
        status = "✅ Configured" if configured else "❌ Not configured"
        print(f"{status}  {service}")

    print("\n" + "="*50)

    missing = [s for s, c in services.items() if not c and s != 'Local Embeddings']

    if missing:
        print(f"\n⚠️  Missing: {', '.join(missing)}")
        print("\nTo configure:")
        if 'Deepgram' in str(missing):
            print("1. Sign up at https://console.deepgram.com (no card)")
            print("   Add DEEPGRAM_API_KEY to .env")
        if 'OpenAI' in str(missing):
            print("2. Get API key from https://platform.openai.com")
            print("   Add OPENAI_API_KEY to .env")
        if 'Supabase' in str(missing):
            print("3. Sign up at https://supabase.com (no card)")
            print("   Create project, create 'finlit-audio' bucket, add credentials to .env")
    else:
        print("\n🎉 All MVP services configured!")

        # Check if budget mode is enabled
        if config.USE_BUDGET_SERVICES:
            print("✅ Budget mode ENABLED")
        else:
            print("⚠️  Budget mode disabled. Set USE_BUDGET_SERVICES=true in .env")

    return len(missing) == 0


def test_embeddings():
    """Test local embeddings"""
    print("\n=== Testing Local Embeddings ===\n")

    try:
        from services import local_embeddings

        print("Loading model...")
        emb = local_embeddings.get_embedding("test")
        print(f"✅ Model loaded ({len(emb)} dimensions)")

        # Quick test
        choices = [
            {'id': 'a', 'text': 'savings account'},
            {'id': 'b', 'text': 'credit card'}
        ]
        result = local_embeddings.match_text_to_choices("account for saving money", choices)
        print(f"✅ Matching works (best: {result['best_match']} - {result['best_score']:.2f})")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nRun: python scripts/download_embedding_model.py")
        return False


def test_supabase():
    """Test Supabase Storage connection"""
    print("\n=== Testing Supabase Storage ===\n")

    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        print("⚠️  Supabase not configured")
        return False

    try:
        from services import supabase_client

        # Test upload
        test_data = b"mvp test"
        url = supabase_client.upload_audio(test_data, folder='mvp-test', extension='txt')
        print(f"✅ Upload works: {url}")

        # Cleanup
        supabase_client.delete_audio(url)
        print("✅ Delete works")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    print("="*50)
    print("MVP SETUP - NO CREDIT CARD REQUIRED")
    print("="*50)

    # Check configuration
    all_configured = check_services()

    # Test embeddings
    embeddings_ok = test_embeddings()

    # Test Supabase (if configured)
    supabase_ok = test_supabase() if config.SUPABASE_URL else True

    print("\n" + "="*50)
    print("SETUP SUMMARY")
    print("="*50)

    if all_configured and embeddings_ok and r2_ok:
        print("\n🎉 MVP READY!")
        print("\nYour setup:")
        print("✅ Deepgram STT (no card)")
        print("✅ Local Embeddings (100% free)")
        print("✅ Cloudflare R2 (no card)")
        print("✅ OpenAI TTS + LLM (you have it)")

        print("\nCost breakdown:")
        print("- STT: ~$0.43 per 100 voice answers (Deepgram)")
        print("- Embeddings: $0.00 (local)")
        print("- Storage: $0.00 for first 10GB (R2)")
        print("- TTS: ~$0.75 per 100 questions (OpenAI)")
        print("\nTotal: ~$1.18 per 100 interactions")
        print("vs Premium: ~$2.20 per 100 interactions")
        print("Savings: 46%!")

        print("\nNext steps:")
        print("1. Make sure USE_BUDGET_SERVICES=true in .env")
        print("2. Run: python app.py")
        print("3. Test voice endpoint")

    else:
        print("\n⚠️  Setup incomplete")
        print("\nWhat's missing:")
        if not all_configured:
            print("- Some services not configured (see above)")
        if not embeddings_ok:
            print("- Local embeddings not working")
        if not r2_ok:
            print("- R2 not working")

        print("\nFix the issues above and run this script again.")


if __name__ == '__main__':
    main()
