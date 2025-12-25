"""
Cloudflare R2 Storage Client

Free egress (vs AWS S3), 60% cost reduction overall
- R2: $0.015/GB storage + free egress
- S3: $0.023/GB storage + $0.09/GB egress

Uses S3-compatible API via boto3.
"""

import boto3
import uuid
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config

# Initialize R2 client (S3-compatible)
try:
    if config.R2_ACCESS_KEY_ID and config.R2_SECRET_ACCESS_KEY and config.R2_ACCOUNT_ID:
        r2_client = boto3.client(
            's3',
            endpoint_url=f'https://{config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=config.R2_ACCESS_KEY_ID,
            aws_secret_access_key=config.R2_SECRET_ACCESS_KEY,
            region_name='auto'  # R2 uses 'auto' region
        )
        print("✅ R2 client initialized")
    else:
        r2_client = None
        print("⚠️  R2 credentials not set")
except Exception as e:
    r2_client = None
    print(f"⚠️  R2 initialization error: {e}")


def upload_audio(audio_bytes: bytes, folder: str = 'responses', extension: str = 'webm') -> str:
    """
    Upload audio file to R2.

    Args:
        audio_bytes: Raw audio data
        folder: Folder path in bucket (e.g., 'responses', 'tts')
        extension: File extension

    Returns:
        Public URL to the file
    """
    if not r2_client:
        raise RuntimeError("R2 client not initialized. Check credentials.")

    filename = f"{folder}/{uuid.uuid4()}.{extension}"

    try:
        r2_client.put_object(
            Bucket=config.R2_BUCKET_NAME,
            Key=filename,
            Body=audio_bytes,
            ContentType=f'audio/{extension}',
            CacheControl='public, max-age=31536000'  # Cache for 1 year
        )

        # Return public URL
        return f"{config.R2_PUBLIC_URL}/{filename}"

    except Exception as e:
        print(f"R2 upload error: {e}")
        raise


def upload_tts(audio_bytes: bytes, item_id: str, language: str = 'en') -> str:
    """
    Upload TTS audio with predictable path for caching.

    Args:
        audio_bytes: Audio data (MP3)
        item_id: Learning item ID
        language: Language code

    Returns:
        Public URL
    """
    if not r2_client:
        raise RuntimeError("R2 client not initialized.")

    filename = f"tts/{item_id}/{language}.mp3"

    try:
        r2_client.put_object(
            Bucket=config.R2_BUCKET_NAME,
            Key=filename,
            Body=audio_bytes,
            ContentType='audio/mp3',
            CacheControl='public, max-age=31536000'  # Cache for 1 year
        )

        return f"{config.R2_PUBLIC_URL}/{filename}"

    except Exception as e:
        print(f"R2 TTS upload error: {e}")
        raise


def get_tts_url(item_id: str, language: str = 'en') -> str | None:
    """
    Check if TTS audio exists in cache.

    Args:
        item_id: Learning item ID
        language: Language code

    Returns:
        URL if exists, None otherwise
    """
    if not r2_client:
        return None

    filename = f"tts/{item_id}/{language}.mp3"

    try:
        # Check if object exists
        r2_client.head_object(
            Bucket=config.R2_BUCKET_NAME,
            Key=filename
        )
        return f"{config.R2_PUBLIC_URL}/{filename}"

    except r2_client.exceptions.NoSuchKey:
        return None
    except Exception as e:
        print(f"R2 check error: {e}")
        return None


def delete_audio(url: str) -> bool:
    """
    Delete audio file by URL.

    Args:
        url: Full public URL

    Returns:
        True if deleted successfully
    """
    if not r2_client or not config.R2_PUBLIC_URL:
        return False

    try:
        # Extract key from URL
        key = url.replace(f"{config.R2_PUBLIC_URL}/", "")

        r2_client.delete_object(
            Bucket=config.R2_BUCKET_NAME,
            Key=key
        )

        return True

    except Exception as e:
        print(f"R2 delete error: {e}")
        return False


def list_files(prefix: str = '', max_keys: int = 100) -> list:
    """
    List files in R2 bucket.

    Args:
        prefix: Prefix to filter (e.g., 'tts/', 'responses/')
        max_keys: Maximum number of files to return

    Returns:
        List of file metadata dicts
    """
    if not r2_client:
        return []

    try:
        response = r2_client.list_objects_v2(
            Bucket=config.R2_BUCKET_NAME,
            Prefix=prefix,
            MaxKeys=max_keys
        )

        if 'Contents' not in response:
            return []

        return [
            {
                'key': obj['Key'],
                'size': obj['Size'],
                'last_modified': obj['LastModified'],
                'url': f"{config.R2_PUBLIC_URL}/{obj['Key']}"
            }
            for obj in response['Contents']
        ]

    except Exception as e:
        print(f"R2 list error: {e}")
        return []
