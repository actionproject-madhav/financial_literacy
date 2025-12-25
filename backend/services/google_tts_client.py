"""
Google Cloud Text-to-Speech Client

73% cheaper than OpenAI TTS
- Google: $0.004/1K chars
- OpenAI: $0.015/1K chars

Provides Neural2 voices with better quality and multi-language support.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config

# Initialize Google TTS client
try:
    from google.cloud import texttospeech

    # Initialize based on credentials type
    if config.GOOGLE_APPLICATION_CREDENTIALS:
        # Service account JSON file
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = config.GOOGLE_APPLICATION_CREDENTIALS
        tts_client = texttospeech.TextToSpeechClient()
    elif config.GOOGLE_TTS_API_KEY:
        # API key (less common for TTS)
        tts_client = texttospeech.TextToSpeechClient()
    else:
        tts_client = None
        print("⚠️  Google TTS credentials not set")

except ImportError:
    tts_client = None
    print("⚠️  google-cloud-texttospeech not installed. Run: pip install google-cloud-texttospeech")


# Voice mapping by language (using Neural2 voices for best quality)
VOICE_MAP = {
    'en': ('en-US', 'en-US-Neural2-J'),      # Natural US English (female)
    'en-male': ('en-US', 'en-US-Neural2-D'), # US English (male)
    'es': ('es-US', 'es-US-Neural2-A'),      # Spanish (US)
    'ne': ('ne-NP', 'ne-NP-Standard-A'),     # Nepali (standard)
    'zh': ('cmn-CN', 'cmn-CN-Neural2-A'),    # Mandarin Chinese
    'hi': ('hi-IN', 'hi-IN-Neural2-A'),      # Hindi
    'tl': ('fil-PH', 'fil-PH-Neural2-A'),    # Filipino/Tagalog
    'vi': ('vi-VN', 'vi-VN-Neural2-A'),      # Vietnamese
    'ko': ('ko-KR', 'ko-KR-Neural2-A'),      # Korean
    'ar': ('ar-XA', 'ar-XA-Wavenet-A'),      # Arabic
    'fr': ('fr-FR', 'fr-FR-Neural2-A'),      # French
    'pt': ('pt-BR', 'pt-BR-Neural2-A'),      # Portuguese (Brazil)
    'ja': ('ja-JP', 'ja-JP-Neural2-B'),      # Japanese
}


def generate_speech(text: str, language: str = 'en', speaking_rate: float = 1.0, voice_gender: str = 'female') -> bytes:
    """
    Generate speech from text using Google Cloud TTS.

    Args:
        text: Text to convert to speech
        language: Language code (en, es, ne, etc.)
        speaking_rate: Speed (0.5 = slow, 1.0 = normal, 1.5 = fast)
        voice_gender: 'female' or 'male' (only affects English for now)

    Returns:
        Audio bytes (MP3 format)
    """
    if not tts_client:
        raise RuntimeError("Google TTS client not initialized. Check credentials.")

    # Select voice
    voice_key = f"{language}-male" if language == 'en' and voice_gender == 'male' else language
    lang_code, voice_name = VOICE_MAP.get(voice_key, VOICE_MAP['en'])

    # Set input text
    input_text = texttospeech.SynthesisInput(text=text)

    # Configure voice
    voice = texttospeech.VoiceSelectionParams(
        language_code=lang_code,
        name=voice_name
    )

    # Configure audio
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=speaking_rate
    )

    try:
        # Generate speech
        response = tts_client.synthesize_speech(
            input=input_text,
            voice=voice,
            audio_config=audio_config
        )

        return response.audio_content

    except Exception as e:
        print(f"Google TTS error: {e}")
        raise


def generate_speech_ssml(ssml: str, language: str = 'en', speaking_rate: float = 1.0) -> bytes:
    """
    Generate speech from SSML (Speech Synthesis Markup Language).

    SSML allows for fine control:
    - <break time="500ms"/> - Pauses
    - <emphasis level="strong">important</emphasis> - Emphasis
    - <say-as interpret-as="cardinal">401</say-as> - Pronunciation hints

    Args:
        ssml: SSML string
        language: Language code
        speaking_rate: Speech speed

    Returns:
        Audio bytes (MP3)
    """
    if not tts_client:
        raise RuntimeError("Google TTS client not initialized.")

    lang_code, voice_name = VOICE_MAP.get(language, VOICE_MAP['en'])

    input_text = texttospeech.SynthesisInput(ssml=ssml)

    voice = texttospeech.VoiceSelectionParams(
        language_code=lang_code,
        name=voice_name
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=speaking_rate
    )

    try:
        response = tts_client.synthesize_speech(
            input=input_text,
            voice=voice,
            audio_config=audio_config
        )

        return response.audio_content

    except Exception as e:
        print(f"Google TTS SSML error: {e}")
        raise


def get_supported_languages():
    """Get list of supported language codes"""
    return [k for k in VOICE_MAP.keys() if '-' not in k]  # Exclude -male variants
