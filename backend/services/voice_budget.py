"""
Complete Voice Service - Budget-Aware Version

Automatically uses budget or premium services based on config.USE_BUDGET_SERVICES:
- Budget: Deepgram (STT), Google TTS, R2 (storage)
- Premium: OpenAI Whisper, OpenAI TTS

Can be imported as drop-in replacement for original voice.py
"""

import base64
import io
from typing import Dict, Optional

from config.services import config

# Import budget services
try:
    from services import deepgram_client, google_tts_client, r2_client
    BUDGET_AVAILABLE = True
except ImportError:
    BUDGET_AVAILABLE = False

# Import premium services (original OpenAI-based)
try:
    from services.voice import VoiceService as PremiumVoiceService
    PREMIUM_AVAILABLE = True
except ImportError:
    PREMIUM_AVAILABLE = False


class BudgetVoiceService:
    """Voice service using budget-friendly providers"""

    def __init__(self):
        if not BUDGET_AVAILABLE:
            raise RuntimeError("Budget services not available. Install: deepgram-sdk, google-cloud-texttospeech, boto3")

    def transcribe(self, audio_base64: str, language_hint: Optional[str] = None) -> Dict:
        """
        Transcribe audio using Deepgram.

        Args:
            audio_base64: Base64 encoded audio
            language_hint: Optional language code

        Returns:
            {
                'transcription': str,
                'confidence': float,
                'detected_language': str,
                'duration_ms': int,
                'audio_url': str or None,
                'words': list
            }
        """
        # Transcribe with Deepgram
        result = deepgram_client.transcribe_from_base64(audio_base64, language_hint)

        # Upload to R2 if configured
        audio_url = None
        if r2_client.r2_client:
            try:
                # Decode audio for upload
                if ',' in audio_base64:
                    audio_data = audio_base64.split(',')[1]
                else:
                    audio_data = audio_base64

                audio_bytes = base64.b64decode(audio_data)
                audio_url = r2_client.upload_audio(audio_bytes)
            except Exception as e:
                print(f"R2 upload warning: {e}")

        # Analyze confidence from audio
        confidence_analysis = self._analyze_audio_from_base64(audio_base64)

        return {
            'transcription': result['text'],
            'confidence': result['confidence'],
            'detected_language': result['language'],
            'duration_ms': int(result['duration_sec'] * 1000),
            'audio_url': audio_url,
            'words': result.get('words', []),
            **confidence_analysis
        }

    def generate_tts(self, text: str, language: str = 'en', voice: Optional[str] = None) -> Optional[str]:
        """
        Generate TTS using Google Cloud TTS (if available) or OpenAI TTS (fallback).

        Args:
            text: Text to convert
            language: Language code
            voice: Voice selection (for OpenAI)

        Returns:
            Base64 audio data URI or None
        """
        try:
            # Try Google TTS first (cheaper)
            if google_tts_client.tts_client:
                audio_bytes = google_tts_client.generate_speech(text, language)
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                return f"data:audio/mp3;base64,{audio_base64}"
        except Exception as e:
            print(f"Google TTS failed, trying OpenAI fallback: {e}")

        # Fallback to OpenAI TTS if Google not available
        try:
            from openai import OpenAI
            if config.OPENAI_API_KEY:
                client = OpenAI(api_key=config.OPENAI_API_KEY)
                response = client.audio.speech.create(
                    model="tts-1",
                    voice=voice or "alloy",
                    input=text
                )
                audio_base64 = base64.b64encode(response.content).decode('utf-8')
                return f"data:audio/mp3;base64,{audio_base64}"
        except Exception as e:
            print(f"OpenAI TTS error: {e}")

        return None

    def generate_tts_cached(self, text: str, item_id: str, language: str = 'en') -> Optional[str]:
        """
        Generate TTS with R2 caching (Google TTS or OpenAI fallback).

        Args:
            text: Text to convert
            item_id: Unique identifier for caching
            language: Language code

        Returns:
            Public URL to cached audio or None
        """
        if not r2_client.r2_client:
            # Fall back to non-cached version
            return self.generate_tts(text, language)

        try:
            # Check cache
            cached_url = r2_client.get_tts_url(item_id, language)
            if cached_url:
                return cached_url

            # Generate (try Google first, then OpenAI)
            audio_bytes = None
            try:
                if google_tts_client.tts_client:
                    audio_bytes = google_tts_client.generate_speech(text, language)
            except:
                pass

            # Fallback to OpenAI if Google failed
            if not audio_bytes and config.OPENAI_API_KEY:
                from openai import OpenAI
                client = OpenAI(api_key=config.OPENAI_API_KEY)
                response = client.audio.speech.create(
                    model="tts-1",
                    voice="alloy",
                    input=text
                )
                audio_bytes = response.content

            if audio_bytes:
                # Upload to R2
                url = r2_client.upload_tts(audio_bytes, item_id, language)
                return url

        except Exception as e:
            print(f"Cached TTS error: {e}")
            return None

    def _analyze_audio_from_base64(self, audio_base64: str) -> Dict:
        """Analyze audio confidence from base64 audio"""
        try:
            from pydub import AudioSegment

            # Decode
            if ',' in audio_base64:
                audio_data = audio_base64.split(',')[1]
            else:
                audio_data = audio_base64

            audio_bytes = base64.b64decode(audio_data)

            # Load audio
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))

            # Hesitation detection (leading silence)
            silence_thresh = audio.dBFS - 16
            hesitation_ms = 0
            for i in range(0, min(5000, len(audio)), 100):
                chunk = audio[i:i+100]
                if len(chunk) > 0 and chunk.dBFS > silence_thresh:
                    hesitation_ms = i
                    break

            # Speech pace estimation
            duration_sec = len(audio) / 1000
            if duration_sec > 0:
                estimated_words = max(1, (duration_sec - hesitation_ms/1000) / 0.3)
                speech_pace_wpm = int((estimated_words / duration_sec) * 60)
            else:
                speech_pace_wpm = 0

            # Voice confidence from volume consistency
            chunks = [audio[i:i+500] for i in range(0, len(audio), 500)]
            volumes = [c.dBFS for c in chunks if len(c) > 0 and c.dBFS > -50]

            if volumes:
                avg_volume = sum(volumes) / len(volumes)
                variance = sum((v - avg_volume)**2 for v in volumes) / len(volumes)
                confidence_score = max(0, min(1, 1 - (variance / 100)))
            else:
                confidence_score = 0.5

            return {
                'hesitation_ms': hesitation_ms,
                'speech_pace_wpm': speech_pace_wpm,
                'voice_confidence_score': round(confidence_score, 3)
            }

        except Exception as e:
            print(f"Audio analysis error: {e}")
            return {
                'hesitation_ms': 0,
                'speech_pace_wpm': 0,
                'voice_confidence_score': 0.5
            }


# Create unified VoiceService that switches based on config
class VoiceService:
    """
    Unified voice service that automatically uses budget or premium services.

    Set USE_BUDGET_SERVICES=true in .env to use budget services.
    """

    def __init__(self):
        if config.USE_BUDGET_SERVICES:
            if not BUDGET_AVAILABLE:
                raise RuntimeError("Budget services requested but not available. Install dependencies.")
            self._service = BudgetVoiceService()
            print("🎤 Using BUDGET voice services (Deepgram, Google TTS)")
        else:
            if PREMIUM_AVAILABLE:
                self._service = PremiumVoiceService()
                print("🎤 Using PREMIUM voice services (OpenAI)")
            else:
                # Fallback to budget if premium not available
                self._service = BudgetVoiceService()
                print("🎤 Premium not available, using BUDGET voice services")

    def transcribe(self, audio_base64: str, language_hint: Optional[str] = None) -> Dict:
        """Transcribe audio to text"""
        return self._service.transcribe(audio_base64, language_hint)

    def generate_tts(self, text: str, language: str = 'en', voice: Optional[str] = None) -> Optional[str]:
        """Generate text-to-speech"""
        return self._service.generate_tts(text, language, voice)

    def generate_tts_cached(self, text: str, item_id: str, language: str = 'en') -> Optional[str]:
        """Generate TTS with caching (budget mode only)"""
        if hasattr(self._service, 'generate_tts_cached'):
            return self._service.generate_tts_cached(text, item_id, language)
        else:
            return self.generate_tts(text, language)
