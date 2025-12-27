"""
ElevenLabs Voice Client (STT + TTS)

Provides both:
- Speech-to-Text (STT) using Scribe models
- Text-to-Speech (TTS) with high-quality, natural voices

Multi-language support with superior voice quality and emotional range.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config

# Initialize ElevenLabs client
try:
    from elevenlabs import VoiceSettings
    from elevenlabs.client import ElevenLabs

    if config.ELEVENLABS_API_KEY:
        elevenlabs_client = ElevenLabs(api_key=config.ELEVENLABS_API_KEY)
    else:
        elevenlabs_client = None
        print("⚠️  ELEVENLABS_API_KEY not set")

except ImportError:
    elevenlabs_client = None
    print("⚠️  elevenlabs package not installed. Run: pip install elevenlabs")


# Voice mapping by language
# Using standard ElevenLabs voice IDs (pre-made voices available to all accounts)
VOICE_MAP = {
    'en': '21m00Tcm4TlvDq8ikWAM',        # Rachel - Natural US English (female)
    'en-male': 'pNInz6obpgDQGcFmaJgB',   # Adam - US English (male)
    'es': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Multi-lingual (female)
    'zh': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Chinese (multi-lingual voice)
    'hi': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Hindi (multi-lingual voice)
    'ne': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Nepali (multi-lingual voice)
    'ko': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Korean (multi-lingual voice)
    'ja': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Japanese (multi-lingual voice)
    'ar': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Arabic (multi-lingual voice)
    'fr': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - French (multi-lingual voice)
    'pt': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Portuguese (multi-lingual voice)
    'vi': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Vietnamese (multi-lingual voice)
    'tl': 'XrExE9yKIg1WjnnlVkGX',        # Matilda - Filipino/Tagalog (multi-lingual voice)
}


def generate_speech(
    text: str,
    language: str = 'en',
    voice_gender: str = 'female',
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    style: float = 0.0,
    use_speaker_boost: bool = True
) -> bytes:
    """
    Generate speech from text using ElevenLabs.

    Args:
        text: Text to convert to speech
        language: Language code (en, es, zh, hi, etc.)
        voice_gender: 'female' or 'male' (affects English voice selection)
        stability: Voice stability (0-1). Lower = more expressive, Higher = more stable
        similarity_boost: Voice clarity (0-1). Higher = more similar to original voice
        style: Style exaggeration (0-1). Higher = more expressive
        use_speaker_boost: Boost speaker similarity

    Returns:
        Audio bytes (MP3 format)
    """
    if not elevenlabs_client:
        raise RuntimeError("ElevenLabs client not initialized. Check ELEVENLABS_API_KEY.")

    # Select voice based on language and gender
    voice_key = f"{language}-male" if language == 'en' and voice_gender == 'male' else language
    voice_name = VOICE_MAP.get(voice_key, VOICE_MAP['en'])

    try:
        # Generate speech with custom voice settings
        audio_generator = elevenlabs_client.text_to_speech.convert(
            text=text,
            voice_id=voice_name,
            model_id="eleven_multilingual_v2",  # Best multi-language model
            voice_settings=VoiceSettings(
                stability=stability,
                similarity_boost=similarity_boost,
                style=style,
                use_speaker_boost=use_speaker_boost
            )
        )

        # Collect audio bytes from generator
        audio_bytes = b''.join(audio_generator)
        return audio_bytes

    except Exception as e:
        print(f"ElevenLabs TTS error: {e}")
        raise


def generate_speech_with_emotions(
    text: str,
    language: str = 'en',
    voice_gender: str = 'female',
    emotion: str = 'neutral'
) -> bytes:
    """
    Generate speech with specific emotional tone.

    Args:
        text: Text to convert
        language: Language code
        voice_gender: 'female' or 'male'
        emotion: 'neutral', 'happy', 'sad', 'angry', 'excited', 'calm'

    Returns:
        Audio bytes (MP3)
    """
    # Emotion presets (stability, similarity_boost, style)
    EMOTION_PRESETS = {
        'neutral': (0.5, 0.75, 0.0),
        'happy': (0.3, 0.75, 0.4),
        'excited': (0.2, 0.8, 0.6),
        'calm': (0.7, 0.75, 0.1),
        'sad': (0.6, 0.7, 0.3),
        'angry': (0.4, 0.8, 0.5),
    }

    stability, similarity_boost, style = EMOTION_PRESETS.get(emotion, EMOTION_PRESETS['neutral'])

    return generate_speech(
        text=text,
        language=language,
        voice_gender=voice_gender,
        stability=stability,
        similarity_boost=similarity_boost,
        style=style
    )


def get_available_voices():
    """Get list of available voices from ElevenLabs API"""
    if not elevenlabs_client:
        return []

    try:
        voices_response = elevenlabs_client.voices.get_all()
        return [{"name": voice.name, "voice_id": voice.voice_id} for voice in voices_response.voices]
    except Exception as e:
        print(f"Error fetching voices: {e}")
        return []


def get_supported_languages():
    """Get list of supported language codes"""
    return [k for k in VOICE_MAP.keys() if '-' not in k]  # Exclude -male variants


def transcribe_audio(
    audio_bytes: bytes,
    language_code: str = 'en',
    model_id: str = 'scribe_v1'  # or 'scribe_v2_realtime' for real-time
) -> dict:
    """
    Transcribe audio to text using ElevenLabs Scribe.

    Args:
        audio_bytes: Raw audio file bytes
        language_code: Language code (e.g., 'en', 'es', 'zh')
        model_id: Model to use ('scribe_v1' for batch, 'scribe_v2_realtime' for real-time)

    Returns:
        {
            'text': str,
            'language': str,
            'confidence': float (0-1),
            'duration_ms': int,
            'words': list (if available)
        }
    """
    if not elevenlabs_client:
        raise RuntimeError("ElevenLabs client not initialized. Check ELEVENLABS_API_KEY.")

    try:
        # Use ElevenLabs speech-to-text API
        # Note: API structure may vary, adjust based on actual SDK
        response = elevenlabs_client.speech_to_text.convert(
            file=audio_bytes,
            model_id=model_id,
            language_code=language_code
        )

        # Extract transcription
        text = response.text if hasattr(response, 'text') else str(response)
        detected_language = getattr(response, 'language', language_code)
        confidence = getattr(response, 'confidence', 0.9)
        duration_ms = int(getattr(response, 'duration', 0) * 1000)
        words = getattr(response, 'words', [])

        return {
            'text': text,
            'language': detected_language,
            'confidence': confidence,
            'duration_ms': duration_ms,
            'words': words
        }

    except Exception as e:
        print(f"ElevenLabs STT error: {e}")
        raise
