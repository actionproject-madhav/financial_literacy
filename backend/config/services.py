"""
Service Configuration for Budget-Friendly Voice Services

Supports both premium (OpenAI) and budget (Deepgram, Google, R2) options.
Set USE_BUDGET_SERVICES=true to use budget services.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class ServiceConfig:
    """Configuration for all external services"""

    # Service mode selection
    USE_BUDGET_SERVICES = os.getenv('USE_BUDGET_SERVICES', 'false').lower() == 'true'

    # ========== BUDGET SERVICES ==========

    # Deepgram (STT) - $0.0043/min vs OpenAI $0.006/min
    DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')

    # Google Cloud TTS - $0.004/1K chars vs OpenAI $0.015/1K
    GOOGLE_TTS_API_KEY = os.getenv('GOOGLE_TTS_API_KEY')
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

    # ElevenLabs TTS - High-quality, natural voices
    ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')

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
        """Validate that required credentials are present based on mode"""
        if cls.USE_BUDGET_SERVICES:
            # Budget mode validation
            required = []

            # Deepgram for STT
            if not cls.DEEPGRAM_API_KEY:
                required.append('DEEPGRAM_API_KEY')

            # Google TTS
            if not (cls.GOOGLE_TTS_API_KEY or cls.GOOGLE_APPLICATION_CREDENTIALS):
                required.append('GOOGLE_TTS_API_KEY or GOOGLE_APPLICATION_CREDENTIALS')

            # Supabase storage
            if not (cls.SUPABASE_URL and cls.SUPABASE_SERVICE_KEY):
                required.append('SUPABASE_URL and SUPABASE_SERVICE_KEY')

            if required:
                raise ValueError(f"Budget mode enabled but missing: {', '.join(required)}")

            print("✅ Using BUDGET services (Deepgram, Google TTS, Supabase Storage, Local Embeddings)")
        else:
            # Premium mode validation
            if not cls.OPENAI_API_KEY:
                raise ValueError("Premium mode requires OPENAI_API_KEY")

            print("✅ Using PREMIUM services (OpenAI)")

        return True

    @classmethod
    def get_storage_config(cls):
        """Get storage configuration based on mode"""
        if cls.USE_BUDGET_SERVICES and cls.SUPABASE_URL and cls.SUPABASE_SERVICE_KEY:
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
