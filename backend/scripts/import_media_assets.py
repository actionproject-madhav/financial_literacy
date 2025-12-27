#!/usr/bin/env python3
"""
Import media assets from media_assets.json to MongoDB
"""

import json
import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()


def import_media_assets():
    """Import media assets from media_assets.json to MongoDB."""

    # Load media_assets.json
    print("Loading media_assets.json...")
    with open('media_assets.json', 'r', encoding='utf-8') as f:
        media_data = json.load(f)

    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "finlit")

    client = MongoClient(mongo_uri)
    db = client[db_name]

    print(f"\nConnecting to MongoDB: {mongo_uri}")
    print(f"Database: {db_name}")

    # Print stats
    total_assets = media_data["metadata"]["total_assets"]
    print("\n" + "=" * 60)
    print("MEDIA ASSETS TO IMPORT:")
    print("=" * 60)
    print(f"Total Assets: {total_assets}")

    # Count by type
    asset_types = {}
    for asset in media_data["assets"]:
        asset_type = asset["type"]
        asset_types[asset_type] = asset_types.get(asset_type, 0) + 1

    print("\nAssets by type:")
    for asset_type, count in sorted(asset_types.items()):
        print(f"  {asset_type}: {count}")

    # Import assets
    print("\n" + "=" * 60)
    print("IMPORTING MEDIA ASSETS...")
    print("=" * 60)

    media_collection = db.media_assets
    created_count = 0
    updated_count = 0
    skipped_count = 0

    for asset in media_data["assets"]:
        asset_id = asset["asset_id"]

        # Check if asset already exists
        existing = media_collection.find_one({"asset_id": asset_id})

        if existing:
            # Update existing asset
            asset_doc = {
                "type": asset["type"],
                "urls": asset.get("urls", {}),
                "alt_text": asset.get("alt_text", ""),
                "caption": asset.get("caption"),
                "dimensions": asset.get("dimensions"),
                "file_size": asset.get("file_size"),
                "mime_type": asset.get("mime_type"),
                "tags": asset.get("tags", []),
                "used_in": asset.get("used_in", []),
                "component_name": asset.get("component_name"),
                "component_props": asset.get("component_props"),
                "is_active": asset.get("is_active", True),
                "updated_at": datetime.utcnow()
            }

            result = media_collection.update_one(
                {"asset_id": asset_id},
                {"$set": asset_doc}
            )

            if result.modified_count > 0:
                print(f"  ✓ Updated: {asset_id} ({asset['type']})")
                updated_count += 1
            else:
                print(f"  - Skipped (no changes): {asset_id} ({asset['type']})")
                skipped_count += 1
        else:
            # Create new asset
            asset_doc = {
                "asset_id": asset_id,
                "type": asset["type"],
                "urls": asset.get("urls", {}),
                "alt_text": asset.get("alt_text", ""),
                "caption": asset.get("caption"),
                "dimensions": asset.get("dimensions"),
                "file_size": asset.get("file_size"),
                "mime_type": asset.get("mime_type"),
                "tags": asset.get("tags", []),
                "used_in": asset.get("used_in", []),
                "component_name": asset.get("component_name"),
                "component_props": asset.get("component_props"),
                "is_active": asset.get("is_active", True),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            media_collection.insert_one(asset_doc)
            print(f"  ✓ Created: {asset_id} ({asset['type']})")
            created_count += 1

    # Create indexes
    print("\n" + "=" * 60)
    print("CREATING INDEXES...")
    print("=" * 60)
    media_collection.create_index("asset_id", unique=True)
    media_collection.create_index("type")
    media_collection.create_index("tags")
    media_collection.create_index("used_in")
    print("  ✓ Indexes created")

    # Summary
    print("\n" + "=" * 60)
    print("IMPORT COMPLETE!")
    print("=" * 60)
    print(f"  Created: {created_count}")
    print(f"  Updated: {updated_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Total: {created_count + updated_count + skipped_count}")
    print("=" * 60)


def list_media_assets():
    """List all media assets in the database."""

    # Connect to MongoDB
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "finlit")

    client = MongoClient(mongo_uri)
    db = client[db_name]

    print("\n" + "=" * 60)
    print("MEDIA ASSETS IN DATABASE:")
    print("=" * 60)

    assets = list(db.media_assets.find({"is_active": True}))

    if not assets:
        print("\nNo media assets found in database.")
        return

    # Group by type
    by_type = {}
    for asset in assets:
        asset_type = asset["type"]
        if asset_type not in by_type:
            by_type[asset_type] = []
        by_type[asset_type].append(asset)

    for asset_type, type_assets in sorted(by_type.items()):
        print(f"\n{asset_type.upper()} ({len(type_assets)}):")
        for asset in type_assets:
            used_in = ", ".join(asset.get("used_in", []))
            print(f"  - {asset['asset_id']}")
            if asset.get("alt_text"):
                print(f"    Alt: {asset['alt_text'][:60]}...")
            if used_in:
                print(f"    Used in: {used_in}")

    print(f"\nTotal assets: {len(assets)}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_media_assets()
    else:
        import_media_assets()
