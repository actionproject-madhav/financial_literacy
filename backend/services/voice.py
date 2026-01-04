"""
Voice Service for Speech-to-Text and Text-to-Speech

This service handles:
- Voice transcription using ElevenLabs Scribe (STT)
- Text-to-speech generation using ElevenLabs (TTS)
- Audio confidence analysis
"""

import os
import base64
import io
import tempfile
from typing import Dict, Optional
import numpy as np
from dotenv import load_dotenv

# Try to import pydub for audio processing
try:
    from pydub import AudioSegment
    from pydub.silence import detect_leading_silence
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("Warning: pydub not available. Audio analysis features will be limited.")

load_dotenv()


class VoiceService:
    """
    Voice input/output service using ElevenLabs APIs

    Features:
    - Speech-to-text transcription (ElevenLabs Scribe)
    - Text-to-speech generation (ElevenLabs)
    - Audio confidence analysis
    - Multi-language support
    """

    SUPPORTED_LANGUAGES = ['en', 'es', 'zh', 'hi', 'ne', 'ko', 'ja', 'ar', 'fr', 'pt']

    def __init__(self):
        """Initialize ElevenLabs client (optional - fallbacks available)"""
        from config.services import config
        
        self.client = None
        if config.ELEVENLABS_API_KEY:
            try:
                from elevenlabs.client import ElevenLabs
                self.client = ElevenLabs(api_key=config.ELEVENLABS_API_KEY)
            except ImportError:
                print("⚠️  elevenlabs package not installed. Will use fallback TTS services.")
            except Exception as e:
                print(f"⚠️  ElevenLabs initialization failed: {e}. Will use fallback TTS services.")
        else:
            print("⚠️  ELEVENLABS_API_KEY not set. Will use fallback TTS services.")

    def _decode_base64_audio(self, audio_base64: str) -> bytes:
        """
        Decode base64 audio string to bytes

        Args:
            audio_base64: Base64 encoded audio (may include data URI prefix)

        Returns:
            Raw audio bytes
        """
        # Remove data URI prefix if present
        if ',' in audio_base64:
            audio_base64 = audio_base64.split(',')[1]

        return base64.b64decode(audio_base64)

    def transcribe(
        self,
        audio_base64: str,
        language_hint: Optional[str] = None
    ) -> Dict:
        """
        Transcribe audio to text using ElevenLabs Scribe

        Args:
            audio_base64: Base64 encoded audio file
            language_hint: Optional language code hint (e.g., 'en', 'es')

        Returns:
            {
                'transcription': str,
                'confidence': float (0-1),
                'detected_language': str,
                'duration_ms': int
            }
        """
        try:
            # Decode audio
            audio_bytes = self._decode_base64_audio(audio_base64)

            # Write to temporary file
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio.flush()
                temp_path = temp_audio.name

            # Read audio bytes
            with open(temp_path, 'rb') as audio_file:
                audio_bytes = audio_file.read()

            # Clean up temp file
            os.unlink(temp_path)

            # Transcribe using ElevenLabs Scribe
            from services.elevenlabs_client import transcribe_audio
            result = transcribe_audio(
                audio_bytes=audio_bytes,
                language_code=language_hint or 'en',
                model_id='scribe_v1'  # Use v1 for batch transcription
            )

            # Extract results
            transcription = result['text']
            duration_ms = result['duration_ms']
            detected_language = result['language']
            confidence = result['confidence']

            return {
                'transcription': transcription,
                'confidence': round(confidence, 3),
                'detected_language': detected_language,
                'duration_ms': duration_ms
            }

        except Exception as e:
            print(f"Error transcribing audio with ElevenLabs: {e}")
            return {
                'transcription': '',
                'confidence': 0.0,
                'detected_language': language_hint or 'en',
                'duration_ms': 0,
                'error': str(e)
            }

    def generate_tts(
        self,
        text: str,
        language: str = 'en',
        voice: Optional[str] = None
    ) -> Optional[str]:
        """
        Generate text-to-speech audio using ElevenLabs with fallbacks to Google TTS or OpenAI TTS

        Args:
            text: Text to convert to speech
            language: Language code
            voice: Voice ID to use (default: auto-select by language)

        Returns:
            Base64 encoded audio or None on error
        """
        # Try ElevenLabs first (if available)
        if self.client is not None:
            try:
                from services.elevenlabs_client import VOICE_MAP, generate_speech
                
                # Select voice based on language
                if not voice:
                    voice_key = language
                    voice_id = VOICE_MAP.get(voice_key, VOICE_MAP['en'])
                else:
                    voice_id = voice

                # Generate speech using ElevenLabs
                audio_bytes = generate_speech(
                    text=text,
                    language=language,
                    voice_gender='female'  # Default, can be made configurable
                )

                # Convert to base64
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

                return f"data:audio/mp3;base64,{audio_base64}"

        except Exception as e:
            error_msg = str(e)
            print(f"Error generating TTS with ElevenLabs: {error_msg}")
            
            # Check for specific error types
            is_blocked = '401' in error_msg or 'unauthorized' in error_msg.lower() or 'unusual_activity' in error_msg.lower() or 'blocked' in error_msg.lower()
            if is_blocked:
                print("⚠️  ElevenLabs API blocked. Using fallback TTS service...")
            elif 'quota' in error_msg.lower() or 'limit' in error_msg.lower():
                print("⚠️  ElevenLabs quota exceeded. Using fallback TTS service...")
            
            # Fallback to Google TTS
            try:
                from services import google_tts_client
                if google_tts_client.tts_client:
                    print(f"  🔄 Trying Google TTS for {language}...")
                    audio_bytes = google_tts_client.generate_speech(text, language)
                    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                    print(f"  ✅ Google TTS success for {language}")
                    return f"data:audio/mp3;base64,{audio_base64}"
            except Exception as e2:
                print(f"  ⚠️  Google TTS failed: {e2}")
            
            # Fallback to OpenAI TTS
            try:
                from config.services import config
                from openai import OpenAI
                if config.OPENAI_API_KEY:
                    print(f"  🔄 Trying OpenAI TTS for {language}...")
                    client = OpenAI(api_key=config.OPENAI_API_KEY)
                    
                    # Map language to OpenAI voice (OpenAI has limited voices)
                    # OpenAI supports: alloy, echo, fable, onyx, nova, shimmer
                    # For non-English, we'll use a multilingual voice
                    voice_map = {
                        'en': 'alloy',
                        'es': 'nova',  # Good for Spanish
                        'ne': 'nova',  # Try nova for Nepali
                    }
                    openai_voice = voice_map.get(language, 'alloy')
                    
                    response = client.audio.speech.create(
                        model="tts-1",  # tts-1 (cheapest) - note: limited language support
                        voice=voice or openai_voice,
                        input=text
                    )
                    audio_base64 = base64.b64encode(response.content).decode('utf-8')
                    print(f"  ✅ OpenAI TTS success for {language}")
                    return f"data:audio/mp3;base64,{audio_base64}"
            except Exception as e3:
                print(f"  ⚠️  OpenAI TTS failed: {e3}")
            
            print(f"  ❌ All TTS services failed for {language}")
            return None

    def analyze_audio_confidence(self, audio_base64: str) -> Dict:
        """
        Analyze audio for learning signals

        Args:
            audio_base64: Base64 encoded audio

        Returns:
            {
                'hesitation_ms': int,
                'speech_pace_wpm': int,
                'confidence_score': float (0-1),
                'filler_words_count': int,
                'volume_variance': float,
                'false_starts': int
            }
        """
        if not PYDUB_AVAILABLE:
            return {
                'hesitation_ms': 0,
                'speech_pace_wpm': 0,
                'confidence_score': 0.5,
                'filler_words_count': 0,
                'volume_variance': 0.0,
                'false_starts': 0,
                'warning': 'Audio analysis unavailable (pydub not installed)'
            }

        try:
            # Decode audio
            audio_bytes = self._decode_base64_audio(audio_base64)

            # Load with pydub
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))

            # 1. Detect leading silence (hesitation)
            hesitation_ms = detect_leading_silence(audio, silence_threshold=-40.0)

            # 2. Calculate volume variance
            samples = np.array(audio.get_array_of_samples())
            volume_variance = float(np.std(samples)) if len(samples) > 0 else 0.0

            # 3. Estimate speech pace (rough approximation)
            # Actual WPM would require transcription timing
            duration_seconds = len(audio) / 1000.0
            # Assume average speaking rate as baseline
            estimated_wpm = 120  # Default assumption

            # 4. Filler words - would need transcription
            # Placeholder for now
            filler_words_count = 0

            # 5. False starts - would need advanced analysis
            false_starts = 0

            # 6. Overall confidence score
            # Lower hesitation = higher confidence
            # Lower volume variance = higher confidence (more controlled)
            hesitation_penalty = min(hesitation_ms / 2000.0, 0.3)  # Max 0.3 penalty
            variance_penalty = min(volume_variance / 10000.0, 0.2)  # Max 0.2 penalty

            confidence_score = max(0.0, min(1.0, 1.0 - hesitation_penalty - variance_penalty))

            return {
                'hesitation_ms': hesitation_ms,
                'speech_pace_wpm': estimated_wpm,
                'confidence_score': round(confidence_score, 3),
                'filler_words_count': filler_words_count,
                'volume_variance': round(volume_variance, 2),
                'false_starts': false_starts
            }

        except Exception as e:
            print(f"Error analyzing audio: {e}")
            return {
                'hesitation_ms': 0,
                'speech_pace_wpm': 0,
                'confidence_score': 0.5,
                'filler_words_count': 0,
                'volume_variance': 0.0,
                'false_starts': 0,
                'error': str(e)
            }

    def detect_filler_words(self, transcription: str) -> int:
        """
        Count filler words in transcription

        Args:
            transcription: Transcribed text

        Returns:
            Count of filler words
        """
        filler_words = [
            'um', 'uh', 'like', 'you know', 'basically', 'literally',
            'actually', 'sort of', 'kind of', 'i mean', 'well'
        ]

        text_lower = transcription.lower()
        count = sum(text_lower.count(filler) for filler in filler_words)

        return count

    def detect_false_starts(self, transcription: str) -> int:
        """
        Detect false starts in transcription

        Args:
            transcription: Transcribed text

        Returns:
            Count of false starts
        """
        # Look for patterns like "I think... no wait" or "It's... um..."
        false_start_indicators = ['...', 'no wait', 'i mean', 'wait no', 'actually']

        text_lower = transcription.lower()
        count = sum(text_lower.count(indicator) for indicator in false_start_indicators)

        return count

    def enhanced_confidence_analysis(
        self,
        audio_base64: str,
        transcription: str
    ) -> Dict:
        """
        Enhanced confidence analysis combining audio and transcription

        Args:
            audio_base64: Base64 encoded audio
            transcription: Transcribed text

        Returns:
            Enhanced confidence metrics
        """
        # Get basic audio analysis
        audio_analysis = self.analyze_audio_confidence(audio_base64)

        # Add transcription-based analysis
        filler_count = self.detect_filler_words(transcription)
        false_starts = self.detect_false_starts(transcription)

        # Calculate word count and pace
        word_count = len(transcription.split())
        duration_seconds = max(1, audio_analysis.get('hesitation_ms', 1000) / 1000.0)

        # Calculate actual WPM
        actual_wpm = int((word_count / duration_seconds) * 60)

        # Adjust confidence based on fillers and false starts
        filler_penalty = min(filler_count * 0.05, 0.2)
        false_start_penalty = min(false_starts * 0.1, 0.2)

        adjusted_confidence = max(0.0, audio_analysis['confidence_score'] - filler_penalty - false_start_penalty)

        return {
            **audio_analysis,
            'speech_pace_wpm': actual_wpm,
            'filler_words_count': filler_count,
            'false_starts': false_starts,
            'confidence_score': round(adjusted_confidence, 3),
            'word_count': word_count
        }
