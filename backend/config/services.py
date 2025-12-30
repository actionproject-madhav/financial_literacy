"""
Service Configuration for Voice Services

Supports OpenAI Whisper (STT) and ElevenLabs (TTS) for voice services.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class ServiceConfig:
    """Configuration for all external services"""

    # ========== VOICE SERVICES ==========

    # ElevenLabs TTS - High-quality, natural voices (Primary TTS)
    ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY_4')

    # Google Cloud TTS - Alternative TTS option
    GOOGLE_TTS_API_KEY = os.getenv('GOOGLE_TTS_API_KEY')
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

    # Supabase Storage - Free 1GB storage, 2GB bandwidth/month (no card required)
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
    SUPABASE_BUCKET_NAME = os.getenv('SUPABASE_BUCKET_NAME', 'finlit-audio')

    # Local embeddings model (free)
    EMBEDDING_MODEL = 'all-MiniLM-L6-v2'  # Fast, good quality, runs locally

    # ========== PREMIUM SERVICES ==========

    # OpenAI (STT, TTS, Embeddings, LLM)
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_WHISPER_MODEL = 'whisper-1'
    OPENAI_TTS_MODEL = 'tts-1'
    OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small'
    OPENAI_CHAT_MODEL = 'gpt-4o-mini'

    # ========== AWS S3 (Alternative to R2) ==========

    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'finlit-audio')
    AWS_S3_REGION = os.getenv('AWS_S3_REGION', 'us-east-1')

    @classmethod
    def validate(cls):
        """Validate that required credentials are present"""
        required = []
        
        # ElevenLabs for both STT and TTS
        if not cls.ELEVENLABS_API_KEY:
            required.append('ELEVENLABS_API_KEY')
        
        if required:
            raise ValueError(f"Missing required credentials: {', '.join(required)}")

        print("✅ Service configuration validated")
        print("   STT: ElevenLabs Scribe")
        print("   TTS: ElevenLabs")

        return True

    @classmethod
    def get_storage_config(cls):
        """Get storage configuration"""
        if cls.SUPABASE_URL and cls.SUPABASE_SERVICE_KEY:
            return {
                'type': 'supabase',
                'url': cls.SUPABASE_URL,
                'service_key': cls.SUPABASE_SERVICE_KEY,
                'bucket': cls.SUPABASE_BUCKET_NAME
            }
        elif cls.AWS_ACCESS_KEY_ID:
            return {
                'type': 's3',
                'access_key': cls.AWS_ACCESS_KEY_ID,
                'secret_key': cls.AWS_SECRET_ACCESS_KEY,
                'bucket': cls.AWS_S3_BUCKET,
                'region': cls.AWS_S3_REGION
            }
        else:
            return {'type': 'none'}  # No cloud storage, use database only


# Singleton instance
config = ServiceConfig()
