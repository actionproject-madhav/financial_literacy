"""
Deepgram Speech-to-Text Client

28% cheaper than OpenAI Whisper
- Deepgram: $0.0043/min
- OpenAI Whisper: $0.006/min

Provides better multi-language support including Nepali, Tagalog, Vietnamese.
"""

import base64
import sys
import os

# Add parent directory to path for config import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config

# Initialize Deepgram client
try:
    from deepgram import DeepgramClient, PrerecordedOptions, FileSource
    if config.DEEPGRAM_API_KEY:
        deepgram_client = DeepgramClient(config.DEEPGRAM_API_KEY)
    else:
        deepgram_client = None
        print("⚠️  DEEPGRAM_API_KEY not set")
except ImportError:
    deepgram_client = None
    print("⚠️  deepgram-sdk not installed. Run: pip install deepgram-sdk")


# Language mapping for Deepgram
LANGUAGE_MAP = {
    'en': 'en-US',
    'es': 'es',
    'ne': 'ne',  # Nepali supported!
    'zh': 'zh-CN',
    'hi': 'hi',
    'tl': 'tl',  # Tagalog
    'vi': 'vi',  # Vietnamese
    'ko': 'ko',
    'ar': 'ar',
    'fr': 'fr',
    'pt': 'pt',
    'ja': 'ja'
}


def transcribe_audio(audio_bytes: bytes, language_hint: str = None) -> dict:
    """
    Transcribe audio using Deepgram Nova-2 model.

    Args:
        audio_bytes: Raw audio bytes
        language_hint: Language code (en, es, ne, etc.)

    Returns:
        {
            'text': str,
            'confidence': float (0-1),
            'language': str,
            'duration_sec': float,
            'words': list  # Word-level timestamps
        }
    """
    if not deepgram_client:
        raise RuntimeError("Deepgram client not initialized. Check DEEPGRAM_API_KEY.")

    # Configure options
    options = PrerecordedOptions(
        model='nova-2',  # Best accuracy model
        smart_format=True,  # Auto-capitalize, punctuate
        punctuate=True,
        diarize=False,  # Don't separate speakers
        detect_language=language_hint is None,  # Auto-detect if no hint
        language=LANGUAGE_MAP.get(language_hint, language_hint) if language_hint else None
    )

    # Create file source
    payload = FileSource(buffer=audio_bytes)

    try:
        # Transcribe
        response = deepgram_client.listen.rest.v('1').transcribe_file(
            payload,
            options
        )

        # Extract results
        result = response['results']
        channel = result['channels'][0]
        alternative = channel['alternatives'][0]

        # Extract word-level data
        words = []
        if 'words' in alternative and alternative['words']:
            words = [
                {
                    'word': w['word'],
                    'start': w['start'],
                    'end': w['end'],
                    'confidence': w['confidence']
                }
                for w in alternative['words']
            ]

        return {
            'text': alternative['transcript'],
            'confidence': alternative['confidence'],
            'language': result.get('metadata', {}).get('detected_language') or language_hint or 'en',
            'duration_sec': result['metadata']['duration'],
            'words': words
        }

    except Exception as e:
        print(f"Deepgram transcription error: {e}")
        raise


def transcribe_from_base64(audio_base64: str, language_hint: str = None) -> dict:
    """
    Transcribe from base64-encoded audio.

    Args:
        audio_base64: Base64 string (may include data URI prefix)
        language_hint: Optional language code

    Returns:
        Same as transcribe_audio()
    """
    # Remove data URL prefix if present
    if ',' in audio_base64:
        audio_base64 = audio_base64.split(',')[1]

    audio_bytes = base64.b64decode(audio_base64)
    return transcribe_audio(audio_bytes, language_hint)


def get_supported_languages():
    """Get list of supported language codes"""
    return list(LANGUAGE_MAP.keys())
