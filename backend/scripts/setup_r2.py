"""
Setup Cloudflare R2 Bucket

Run this script once to initialize your R2 bucket.
Requires R2 credentials in .env file.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import boto3
from config.services import config


def setup_r2():
    """Create R2 bucket and configure public access"""

    if not all([config.R2_ACCOUNT_ID, config.R2_ACCESS_KEY_ID, config.R2_SECRET_ACCESS_KEY]):
        print("❌ R2 credentials not configured in .env")
        print("Required:")
        print("  - R2_ACCOUNT_ID")
        print("  - R2_ACCESS_KEY_ID")
        print("  - R2_SECRET_ACCESS_KEY")
        return False

    try:
        # Initialize S3-compatible client for R2
        client = boto3.client(
            's3',
            endpoint_url=f'https://{config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=config.R2_ACCESS_KEY_ID,
            aws_secret_access_key=config.R2_SECRET_ACCESS_KEY,
            region_name='auto'
        )

        # Check if bucket exists
        try:
            client.head_bucket(Bucket=config.R2_BUCKET_NAME)
            print(f"✅ Bucket '{config.R2_BUCKET_NAME}' already exists")
        except:
            # Create bucket
            print(f"Creating bucket: {config.R2_BUCKET_NAME}...")
            client.create_bucket(Bucket=config.R2_BUCKET_NAME)
            print(f"✅ Created bucket: {config.R2_BUCKET_NAME}")

        # Create folder structure
        folders = ['responses/', 'tts/', 'cache/']
        for folder in folders:
            try:
                client.put_object(
                    Bucket=config.R2_BUCKET_NAME,
                    Key=folder,
                    Body=b''
                )
                print(f"✅ Created folder: {folder}")
            except Exception as e:
                print(f"⚠️  Folder {folder}: {e}")

        # List buckets to confirm
        response = client.list_buckets()
        print(f"\nAll R2 buckets:")
        for bucket in response['Buckets']:
            print(f"  - {bucket['Name']}")

        print("\n✅ R2 setup complete!")
        print(f"\nNext steps:")
        print(f"1. Go to Cloudflare Dashboard → R2 → {config.R2_BUCKET_NAME}")
        print(f"2. Settings → Public Access → Enable")
        print(f"3. Copy the public URL and add to .env:")
        print(f"   R2_PUBLIC_URL=https://pub-xxx.r2.dev")

        return True

    except Exception as e:
        print(f"❌ R2 setup error: {e}")
        print("\nTroubleshooting:")
        print("1. Check your R2 credentials in .env")
        print("2. Ensure you have R2 permissions in Cloudflare")
        print("3. Try creating the bucket manually in Cloudflare Dashboard")
        return False


if __name__ == '__main__':
    print("=== Cloudflare R2 Setup ===\n")
    setup_r2()
