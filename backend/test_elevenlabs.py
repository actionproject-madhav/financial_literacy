"""
Test script for ElevenLabs TTS integration
Run this to verify your ELEVENLABS_API_KEY is working correctly
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services import elevenlabs_client
from config.services import config

def test_elevenlabs():
    """Test ElevenLabs TTS generation"""

    print("=" * 60)
    print("Testing ElevenLabs TTS Integration")
    print("=" * 60)

    # Check API key
    if not config.ELEVENLABS_API_KEY:
        print("❌ ELEVENLABS_API_KEY not found in environment")
        print("   Please set it in your .env file:")
        print("   ELEVENLABS_API_KEY=your_api_key_here")
        return False

    print(f"✅ API Key found: {config.ELEVENLABS_API_KEY[:10]}...")

    # Check if client initialized
    if not elevenlabs_client.elevenlabs_client:
        print("❌ ElevenLabs client failed to initialize")
        return False

    print("✅ ElevenLabs client initialized")

    # Test text-to-speech generation
    print("\n" + "=" * 60)
    print("Testing TTS Generation")
    print("=" * 60)

    test_text = "Hello! This is a test of the ElevenLabs text to speech system."

    try:
        print(f"Generating speech for: '{test_text}'")
        audio_bytes = elevenlabs_client.generate_speech(
            text=test_text,
            language='en'
        )

        if audio_bytes and len(audio_bytes) > 0:
            print(f"✅ Successfully generated {len(audio_bytes)} bytes of audio")

            # Optionally save to file
            output_file = "test_elevenlabs_output.mp3"
            with open(output_file, 'wb') as f:
                f.write(audio_bytes)
            print(f"✅ Audio saved to: {output_file}")
            print(f"   You can play this file to hear the generated speech")

            return True
        else:
            print("❌ No audio generated")
            return False

    except Exception as e:
        print(f"❌ Error generating speech: {e}")
        return False

def test_voice_service():
    """Test the complete voice service with ElevenLabs"""

    print("\n" + "=" * 60)
    print("Testing Voice Service Integration")
    print("=" * 60)

    try:
        from services.voice_budget import BudgetVoiceService

        voice_service = BudgetVoiceService()
        print("✅ BudgetVoiceService initialized")

        # Test TTS generation through the service
        test_text = "Testing the voice service integration with ElevenLabs."
        audio_data_uri = voice_service.generate_tts(test_text, language='en')

        if audio_data_uri and audio_data_uri.startswith('data:audio'):
            print("✅ Voice service successfully generated TTS")
            print(f"   Generated data URI: {audio_data_uri[:50]}...")
            return True
        else:
            print("❌ Voice service failed to generate TTS")
            return False

    except Exception as e:
        print(f"❌ Error testing voice service: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_available_voices():
    """Test fetching available voices"""

    print("\n" + "=" * 60)
    print("Available Voices")
    print("=" * 60)

    try:
        voices = elevenlabs_client.get_available_voices()
        if voices:
            print(f"✅ Found {len(voices)} available voices:")
            for i, voice in enumerate(voices[:10], 1):  # Show first 10
                print(f"   {i}. {voice['name']} (ID: {voice['voice_id']})")
            if len(voices) > 10:
                print(f"   ... and {len(voices) - 10} more")
            return True
        else:
            print("⚠️  No voices returned (this might be OK)")
            return True
    except Exception as e:
        print(f"⚠️  Error fetching voices: {e}")
        return True  # Not critical

if __name__ == '__main__':
    print("\n🎤 ElevenLabs Integration Test Suite\n")

    results = []

    # Run tests
    results.append(("ElevenLabs TTS", test_elevenlabs()))
    results.append(("Voice Service", test_voice_service()))
    results.append(("Available Voices", test_available_voices()))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")

    all_passed = all(r for _, r in results[:2])  # Only check critical tests

    if all_passed:
        print("\n🎉 All tests passed! ElevenLabs integration is working correctly.")
        print("\nNext steps:")
        print("1. The voice API will now use ElevenLabs for TTS")
        print("2. Test it in your application by using the voice features")
        print("3. Check the console logs to confirm ElevenLabs is being used")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        print("\nTroubleshooting:")
        print("1. Verify ELEVENLABS_API_KEY is set correctly in .env")
        print("2. Check that you have API credits in your ElevenLabs account")
        print("3. Ensure the elevenlabs package is installed: pip install elevenlabs")
