"""
Setup Supabase Storage Bucket

Run this script once to verify your Supabase bucket is configured correctly.
Requires Supabase credentials in .env file.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config


def setup_supabase():
    """Verify Supabase bucket configuration"""

    if not all([config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY, config.SUPABASE_BUCKET_NAME]):
        print("❌ Supabase credentials not configured in .env")
        print("\nRequired:")
        print("  - SUPABASE_URL")
        print("  - SUPABASE_SERVICE_KEY")
        print("  - SUPABASE_BUCKET_NAME")
        return False

    try:
        from supabase import create_client

        # Initialize client
        supabase = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)

        bucket_name = config.SUPABASE_BUCKET_NAME

        # List all buckets to verify connection
        print(f"Checking Supabase connection...")
        buckets = supabase.storage.list_buckets()
        
        print(f"\n✅ Connected to Supabase")
        print(f"Available buckets: {[b.name for b in buckets] if buckets else 'None'}")

        # Check if our bucket exists
        bucket_exists = any(b.name == bucket_name for b in buckets) if buckets else False

        if bucket_exists:
            print(f"\n✅ Bucket '{bucket_name}' exists")
        else:
            print(f"\n⚠️  Bucket '{bucket_name}' not found")
            print(f"\nTo create it:")
            print(f"1. Go to Supabase Dashboard → Storage")
            print(f"2. Click 'New bucket'")
            print(f"3. Name: {bucket_name}")
            print(f"4. Check 'Public bucket'")
            print(f"5. Click 'Create bucket'")
            return False

        # Test upload/delete
        print(f"\nTesting upload/delete...")
        test_data = b"test file"
        test_path = "setup-test/test.txt"
        
        # Upload
        result = supabase.storage.from_(bucket_name).upload(
            path=test_path,
            file=test_data,
            file_options={"content-type": "text/plain"}
        )
        print(f"✅ Upload successful")

        # Delete
        supabase.storage.from_(bucket_name).remove([test_path])
        print(f"✅ Delete successful")

        print(f"\n✅ Supabase setup complete!")
        print(f"\nBucket '{bucket_name}' is ready to use.")
        print(f"\nPublic URL format:")
        print(f"  {config.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/path/to/file")

        return True

    except Exception as e:
        print(f"❌ Supabase setup error: {e}")
        print("\nTroubleshooting:")
        print("1. Check your Supabase credentials in .env")
        print("2. Ensure the bucket exists and is public")
        print("3. Verify your service_role key has storage permissions")
        return False


if __name__ == '__main__':
    print("=== Supabase Storage Setup ===\n")
    setup_supabase()

