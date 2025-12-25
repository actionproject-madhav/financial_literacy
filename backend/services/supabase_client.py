"""
Supabase Storage Client

Free storage with generous limits, no credit card required.
- Supabase: 1GB free storage, 2GB bandwidth/month
- Perfect for voice responses and TTS caching

Uses Supabase Storage API.
"""

import uuid
import sys
import os
from typing import Optional, List, Dict
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config

# Initialize Supabase client
try:
    from supabase import create_client, Client
    supabase_client: Optional[Client] = None
    
    if config.SUPABASE_URL and config.SUPABASE_SERVICE_KEY:
        supabase_client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
        print("✅ Supabase client initialized")
    else:
        supabase_client = None
        print("⚠️  Supabase credentials not set")
except ImportError:
    supabase_client = None
    print("⚠️  supabase-py not installed. Run: pip install supabase")
except Exception as e:
    supabase_client = None
    print(f"⚠️  Supabase initialization error: {e}")


def upload_audio(audio_bytes: bytes, folder: str = 'responses', extension: str = 'webm') -> str:
    """
    Upload audio file to Supabase Storage.

    Args:
        audio_bytes: Raw audio data
        folder: Folder path in bucket (e.g., 'responses', 'tts')
        extension: File extension

    Returns:
        Public URL to the file
    """
    if not supabase_client:
        raise RuntimeError("Supabase client not initialized. Check credentials.")

    filename = f"{uuid.uuid4()}.{extension}"
    file_path = f"{folder}/{filename}"

    try:
        # Upload to Supabase Storage
        bucket_name = config.SUPABASE_BUCKET_NAME
        content_type = f'audio/{extension}' if extension != 'mp3' else 'audio/mpeg'
        
        result = supabase_client.storage.from_(bucket_name).upload(
            path=file_path,
            file=audio_bytes,
            file_options={
                "content-type": content_type,
                "cache-control": "public, max-age=31536000"
            }
        )

        # Get public URL
        public_url = supabase_client.storage.from_(bucket_name).get_public_url(file_path)
        return public_url

    except Exception as e:
        print(f"Supabase upload error: {e}")
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
    if not supabase_client:
        raise RuntimeError("Supabase client not initialized.")

    file_path = f"tts/{item_id}/{language}.mp3"

    try:
        bucket_name = config.SUPABASE_BUCKET_NAME
        
        # Upload with upsert (overwrite if exists)
        result = supabase_client.storage.from_(bucket_name).upload(
            path=file_path,
            file=audio_bytes,
            file_options={
                "content-type": "audio/mpeg",
                "cache-control": "public, max-age=31536000",
                "upsert": "true"
            }
        )

        # Get public URL
        public_url = supabase_client.storage.from_(bucket_name).get_public_url(file_path)
        return public_url

    except Exception as e:
        print(f"Supabase TTS upload error: {e}")
        raise


def get_tts_url(item_id: str, language: str = 'en') -> Optional[str]:
    """
    Check if TTS audio exists in cache.

    Args:
        item_id: Learning item ID
        language: Language code

    Returns:
        URL if exists, None otherwise
    """
    if not supabase_client:
        return None

    file_path = f"tts/{item_id}/{language}.mp3"

    try:
        bucket_name = config.SUPABASE_BUCKET_NAME
        
        # Check if file exists by trying to list it
        try:
            files = supabase_client.storage.from_(bucket_name).list(path=f"tts/{item_id}/")
            file_exists = any(f.get('name') == f"{language}.mp3" for f in files if isinstance(f, dict))
        except:
            file_exists = False
        
        if file_exists:
            public_url = supabase_client.storage.from_(bucket_name).get_public_url(file_path)
            return public_url
        return None

    except Exception as e:
        print(f"Supabase check error: {e}")
        return None


def delete_audio(url: str) -> bool:
    """
    Delete audio file by URL.

    Args:
        url: Full public URL

    Returns:
        True if deleted successfully
    """
    if not supabase_client:
        return False

    try:
        # Extract file path from URL
        # URL format: https://xxxxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
        bucket_name = config.SUPABASE_BUCKET_NAME
        public_prefix = f"{config.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/"
        
        if public_prefix not in url:
            # Try alternative URL format
            public_prefix2 = f"/storage/v1/object/public/{bucket_name}/"
            if public_prefix2 in url:
                file_path = url.split(public_prefix2)[1]
            else:
                return False
        else:
            file_path = url.replace(public_prefix, "")
        
        result = supabase_client.storage.from_(bucket_name).remove([file_path])
        return True

    except Exception as e:
        print(f"Supabase delete error: {e}")
        return False


def list_files(prefix: str = '', max_keys: int = 100) -> List[Dict]:
    """
    List files in Supabase Storage bucket.

    Args:
        prefix: Prefix to filter (e.g., 'tts/', 'responses/')
        max_keys: Maximum number of files to return

    Returns:
        List of file metadata dicts
    """
    if not supabase_client:
        return []

    try:
        bucket_name = config.SUPABASE_BUCKET_NAME
        
        # List files with prefix
        files = supabase_client.storage.from_(bucket_name).list(path=prefix, limit=max_keys)
        
        result = []
        for file_info in files[:max_keys]:
            if isinstance(file_info, dict) and file_info.get('name'):  # Skip directories
                file_path = f"{prefix}{file_info['name']}" if prefix else file_info['name']
                public_url = supabase_client.storage.from_(bucket_name).get_public_url(file_path)
                
                result.append({
                    'key': file_path,
                    'size': file_info.get('metadata', {}).get('size', 0) if isinstance(file_info.get('metadata'), dict) else 0,
                    'last_modified': file_info.get('updated_at', datetime.now()),
                    'url': public_url
                })
        
        return result

    except Exception as e:
        print(f"Supabase list error: {e}")
        return []

