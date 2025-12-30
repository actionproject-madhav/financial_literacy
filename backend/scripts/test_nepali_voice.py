#!/usr/bin/env python3
"""
Test Nepali Voice Support (STT + TTS)

Verifies that ElevenLabs properly handles:
- Nepali text-to-speech (TTS)
- Nepali speech-to-text (STT)
- Language code mapping ('nep' -> Nepali)
"""

import sys
import os
import base64

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.voice import VoiceService
from services.elevenlabs_client import generate_speech, VOICE_MAP


def test_nepali_tts():
    """Test Nepali Text-to-Speech"""
    print("\n" + "="*60)
    print("TEST 1: Nepali Text-to-Speech (TTS)")
    print("="*60)
    
    try:
        # Test Nepali text
        nepali_text = "नमस्ते! तपाईंलाई कस्तो छ?"
        print(f"Input text: {nepali_text}")
        print(f"Language: Nepali (ne/nep)")
        
        # Generate speech
        audio_bytes = generate_speech(
            text=nepali_text,
            language='ne',  # or 'nep'
            voice_gender='female'
        )
        
        print(f"✅ TTS Success!")
        print(f"   Audio size: {len(audio_bytes)} bytes")
        print(f"   Voice used: {VOICE_MAP.get('ne', 'default')}")
        
        return True
        
    except Exception as e:
        print(f"❌ TTS Failed: {e}")
        return False


def test_nepali_stt():
    """Test Nepali Speech-to-Text"""
    print("\n" + "="*60)
    print("TEST 2: Nepali Speech-to-Text (STT)")
    print("="*60)
    
    try:
        service = VoiceService()
        
        # For this test, we'll use the TTS output as input to STT
        # In production, this would be actual user audio
        nepali_text = "बैंकिङ मूल बातें"
        print(f"Original text: {nepali_text}")
        
        # Generate audio
        audio_bytes = generate_speech(text=nepali_text, language='ne')
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Transcribe
        print("Transcribing with language_hint='nep'...")
        result = service.transcribe(
            audio_base64=audio_base64,
            language_hint='nep'
        )
        
        print(f"✅ STT Success!")
        print(f"   Transcription: {result['transcription']}")
        print(f"   Confidence: {result['confidence']}")
        print(f"   Detected language: {result['detected_language']}")
        print(f"   Duration: {result['duration_ms']}ms")
        
        return True
        
    except Exception as e:
        print(f"❌ STT Failed: {e}")
        return False


def test_language_codes():
    """Test all supported language codes"""
    print("\n" + "="*60)
    print("TEST 3: Language Code Support")
    print("="*60)
    
    test_phrases = {
        'eng': 'Hello, welcome to financial literacy',
        'spa': 'Hola, bienvenido a educación financiera',
        'nep': 'नमस्ते, वित्तीय साक्षरतामा स्वागत छ'
    }
    
    results = []
    
    for lang_code, phrase in test_phrases.items():
        try:
            print(f"\nTesting {lang_code}: {phrase}")
            audio_bytes = generate_speech(text=phrase, language=lang_code[:2])
            print(f"   ✅ {lang_code}: {len(audio_bytes)} bytes")
            results.append(True)
        except Exception as e:
            print(f"   ❌ {lang_code}: {e}")
            results.append(False)
    
    return all(results)


def test_voice_service_integration():
    """Test VoiceService class with Nepali"""
    print("\n" + "="*60)
    print("TEST 4: VoiceService Integration")
    print("="*60)
    
    try:
        service = VoiceService()
        
        # Test supported languages
        print(f"Supported languages: {service.SUPPORTED_LANGUAGES}")
        
        if 'ne' in service.SUPPORTED_LANGUAGES:
            print("✅ Nepali ('ne') is supported")
        else:
            print("❌ Nepali ('ne') not in supported languages")
            return False
        
        # Test TTS
        print("\nGenerating Nepali speech...")
        audio_base64 = service.generate_speech(
            text="यो एक परीक्षण हो",
            language='ne'
        )
        
        if audio_base64:
            print(f"✅ Generated {len(audio_base64)} chars of base64 audio")
            return True
        else:
            print("❌ No audio generated")
            return False
            
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False


def main():
    print("\n" + "🇳🇵 "*20)
    print("NEPALI VOICE SUPPORT TEST SUITE")
    print("🇳🇵 "*20)
    
    results = []
    
    # Run all tests
    results.append(("Nepali TTS", test_nepali_tts()))
    results.append(("Nepali STT", test_nepali_stt()))
    results.append(("Language Codes", test_language_codes()))
    results.append(("Service Integration", test_voice_service_integration()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    all_passed = all(result[1] for result in results)
    
    print("\n" + "="*60)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Nepali voice support is working!")
    else:
        print("⚠️  SOME TESTS FAILED. Check ElevenLabs API key and configuration.")
    print("="*60 + "\n")
    
    return 0 if all_passed else 1


if __name__ == '__main__':
    sys.exit(main())

