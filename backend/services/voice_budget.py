"""
Complete Voice Service - Budget-Aware Version

Uses OpenAI Whisper (STT) and ElevenLabs/Google TTS (TTS) with Supabase Storage.

Can be imported as drop-in replacement for original voice.py
"""

import base64
import io
from typing import Dict, Optional

from config.services import config

# Import services
try:
    from services import google_tts_client, supabase_client, elevenlabs_client
    from services.voice import VoiceService as PremiumVoiceService
    SERVICES_AVAILABLE = True
except ImportError:
    SERVICES_AVAILABLE = False

class BudgetVoiceService:
    """Voice service using ElevenLabs (STT + TTS) and Google TTS (fallback)"""

    def __init__(self):
        if not SERVICES_AVAILABLE:
            raise RuntimeError("Services not available. Install: elevenlabs, google-cloud-texttospeech, supabase")
        
        # Use ElevenLabs for STT (from main voice service)
        self.voice_service = PremiumVoiceService()

    def transcribe(self, audio_base64: str, language_hint: Optional[str] = None) -> Dict:
        """
        Transcribe audio using ElevenLabs Scribe.

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
        # Transcribe with ElevenLabs Scribe
        result = self.voice_service.transcribe(audio_base64, language_hint)

        # Upload to Supabase if configured
        audio_url = None
        if supabase_client.supabase_client:
            try:
                # Decode audio for upload
                if ',' in audio_base64:
                    audio_data = audio_base64.split(',')[1]
                else:
                    audio_data = audio_base64

                audio_bytes = base64.b64decode(audio_data)
                audio_url = supabase_client.upload_audio(audio_bytes)
            except Exception as e:
                print(f"Supabase upload warning: {e}")

        # Analyze confidence from audio
        confidence_analysis = self._analyze_audio_from_base64(audio_base64)

        return {
            'transcription': result['transcription'],
            'confidence': result['confidence'],
            'detected_language': result['detected_language'],
            'duration_ms': result['duration_ms'],
            'audio_url': audio_url,
            'words': [],  # OpenAI Whisper doesn't provide word-level timestamps in basic mode
            **confidence_analysis
        }

    def generate_tts(self, text: str, language: str = 'en', voice: Optional[str] = None) -> Optional[str]:
        """
        Generate TTS using ElevenLabs (if available), Google Cloud TTS, or OpenAI TTS (fallback).

        Args:
            text: Text to convert
            language: Language code
            voice: Voice selection (for OpenAI)

        Returns:
            Base64 audio data URI or None
        """
        # Try ElevenLabs first (best quality)
        try:
            if elevenlabs_client.elevenlabs_client:
                audio_bytes = elevenlabs_client.generate_speech(text, language)
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                return f"data:audio/mp3;base64,{audio_base64}"
        except Exception as e:
            print(f"ElevenLabs TTS failed, trying Google TTS fallback: {e}")

        # Fallback to Google TTS (cheaper)
        try:
            if google_tts_client.tts_client:
                audio_bytes = google_tts_client.generate_speech(text, language)
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                return f"data:audio/mp3;base64,{audio_base64}"
        except Exception as e:
            print(f"Google TTS failed, trying OpenAI fallback: {e}")

        # Fallback to OpenAI TTS if others not available
        try:
            from openai import OpenAI
            if config.OPENAI_API_KEY:
                client = OpenAI(api_key=config.OPENAI_API_KEY)
                response = client.audio.speech.create(
                    model=config.OPENAI_TTS_MODEL,  # tts-1 (cheapest)
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
        Generate TTS with Supabase caching (ElevenLabs, Google TTS, or OpenAI fallback).

        Args:
            text: Text to convert
            item_id: Unique identifier for caching
            language: Language code

        Returns:
            Public URL to cached audio or None
        """
        if not supabase_client.supabase_client:
            # Fall back to non-cached version
            return self.generate_tts(text, language)

        try:
            # Check cache
            cached_url = supabase_client.get_tts_url(item_id, language)
            if cached_url:
                return cached_url

            # Generate (try ElevenLabs first, then Google, then OpenAI)
            audio_bytes = None

            # Try ElevenLabs first
            try:
                if elevenlabs_client.elevenlabs_client:
                    audio_bytes = elevenlabs_client.generate_speech(text, language)
            except Exception as e:
                print(f"ElevenLabs TTS failed in cached mode: {e}")

            # Fallback to Google TTS
            if not audio_bytes:
                try:
                    if google_tts_client.tts_client:
                        audio_bytes = google_tts_client.generate_speech(text, language)
                except Exception as e:
                    print(f"Google TTS failed in cached mode: {e}")

            # Fallback to OpenAI if both failed
            if not audio_bytes and config.OPENAI_API_KEY:
                from openai import OpenAI
                client = OpenAI(api_key=config.OPENAI_API_KEY)
                response = client.audio.speech.create(
                    model=config.OPENAI_TTS_MODEL,  # tts-1 (cheapest)
                    voice="alloy",
                    input=text
                )
                audio_bytes = response.content

            if audio_bytes:
                # Upload to Supabase
                url = supabase_client.upload_tts(audio_bytes, item_id, language)
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
        # Always use BudgetVoiceService which uses ElevenLabs for both STT and TTS
        if SERVICES_AVAILABLE:
            self._service = BudgetVoiceService()
            print("🎤 Using voice services (ElevenLabs STT + TTS)")
        else:
            # Fallback to main voice service if available
            if PremiumVoiceService:
                self._service = PremiumVoiceService()
                print("🎤 Using ElevenLabs voice services (STT + TTS)")
            else:
                raise RuntimeError("Voice services not available. Install dependencies.")

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
