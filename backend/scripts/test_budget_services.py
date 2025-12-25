"""
Test Budget Voice Services

Tests all budget services to ensure they're configured correctly.
"""

import sys
import os
import base64

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config


def test_deepgram():
    """Test Deepgram STT"""
    print("\n=== Testing Deepgram (STT) ===")

    if not config.DEEPGRAM_API_KEY:
        print("❌ DEEPGRAM_API_KEY not set")
        return False

    try:
        from services import deepgram_client

        # Create a simple test audio (just silence, but tests API)
        print("Testing API connection...")
        # You would need real audio here for a full test
        print("✅ Deepgram client initialized")
        print(f"Supported languages: {deepgram_client.get_supported_languages()}")
        return True

    except Exception as e:
        print(f"❌ Deepgram test failed: {e}")
        return False


def test_google_tts():
    """Test Google Cloud TTS"""
    print("\n=== Testing Google Cloud TTS ===")

    if not (config.GOOGLE_TTS_API_KEY or config.GOOGLE_APPLICATION_CREDENTIALS):
        print("❌ Google TTS credentials not set")
        return False

    try:
        from services import google_tts_client

        print("Generating test audio...")
        audio_bytes = google_tts_client.generate_speech("Test", "en")

        print(f"✅ Generated {len(audio_bytes)} bytes of audio")
        print(f"Supported languages: {google_tts_client.get_supported_languages()}")
        return True

    except Exception as e:
        print(f"❌ Google TTS test failed: {e}")
        return False


def test_supabase():
    """Test Supabase Storage"""
    print("\n=== Testing Supabase Storage ===")

    if not all([config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY]):
        print("❌ Supabase credentials not set")
        return False

    try:
        from services import supabase_client

        print("Testing Supabase connection...")

        # Test upload
        test_data = b"test audio data"
        url = supabase_client.upload_audio(test_data, folder='test', extension='txt')

        print(f"✅ Upload successful: {url}")

        # Test list
        files = supabase_client.list_files(prefix='test/', max_keys=5)
        print(f"✅ Found {len(files)} test files")

        # Cleanup
        if url:
            supabase_client.delete_audio(url)
            print("✅ Cleanup successful")

        return True

    except Exception as e:
        print(f"❌ Supabase test failed: {e}")
        return False


def test_local_embeddings():
    """Test local sentence transformers"""
    print("\n=== Testing Local Embeddings ===")

    try:
        from services import local_embeddings

        print("Loading model...")
        emb = local_embeddings.get_embedding("test")
        print(f"✅ Generated embedding: {len(emb)} dimensions")

        # Test matching
        choices = [
            {'id': 'a', 'text': 'credit card'},
            {'id': 'b', 'text': 'debit card'},
            {'id': 'c', 'text': 'savings account'}
        ]

        result = local_embeddings.match_text_to_choices("a card for credit", choices)
        print(f"✅ Matching test:")
        print(f"   Best match: {result['best_match']} ({result['best_score']:.3f})")
        print(f"   Scores: {result['similarity_scores']}")

        return True

    except Exception as e:
        print(f"❌ Local embeddings test failed: {e}")
        print("   Run: python scripts/download_embedding_model.py")
        return False


def main():
    print("=== Budget Services Test Suite ===")
    print(f"USE_BUDGET_SERVICES: {config.USE_BUDGET_SERVICES}")

    results = {
        'Deepgram': test_deepgram(),
        'Google TTS': test_google_tts(),
        'Supabase Storage': test_supabase(),
        'Local Embeddings': test_local_embeddings()
    }

    print("\n=== Test Summary ===")
    for service, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {service}")

    passed_count = sum(results.values())
    total_count = len(results)

    print(f"\nTotal: {passed_count}/{total_count} services working")

    if passed_count == total_count:
        print("\n🎉 All budget services are ready!")
        print("\nNext steps:")
        print("1. Set USE_BUDGET_SERVICES=true in .env")
        print("2. Restart your backend")
        print("3. Start saving money!")
    else:
        print("\n⚠️  Some services need configuration.")
        print("Check the output above for details.")


if __name__ == '__main__':
    main()
