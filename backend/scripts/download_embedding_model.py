"""
Download Sentence Transformers Embedding Model

Downloads the all-MiniLM-L6-v2 model (~22MB) for local embeddings.
Run this once to avoid first-call delay in production.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config


def download_model():
    """Download and cache the embedding model"""

    print(f"=== Downloading Embedding Model ===\n")
    print(f"Model: {config.EMBEDDING_MODEL}")
    print(f"Size: ~22MB")
    print(f"This will download once and cache locally.\n")

    try:
        from sentence_transformers import SentenceTransformer

        print("Downloading...")
        model = SentenceTransformer(config.EMBEDDING_MODEL)

        print(f"✅ Model downloaded successfully")
        print(f"✅ Model cached locally (will be reused on next run)")

        # Test the model
        print("\nTesting model...")
        test_embedding = model.encode("This is a test sentence")
        print(f"✅ Embedding generated: {len(test_embedding)} dimensions")

        # Test similarity
        emb1 = model.encode("credit card")
        emb2 = model.encode("credit card")
        emb3 = model.encode("savings account")

        from scipy.spatial.distance import cosine
        sim_same = 1 - cosine(emb1, emb2)
        sim_diff = 1 - cosine(emb1, emb3)

        print(f"\nSimilarity test:")
        print(f"  'credit card' vs 'credit card': {sim_same:.3f} (should be ~1.0)")
        print(f"  'credit card' vs 'savings account': {sim_diff:.3f} (should be <0.8)")

        print("\n✅ Model ready for use!")
        print("\nYou can now:")
        print("1. Set USE_BUDGET_SERVICES=true in .env")
        print("2. Start using free local embeddings")

        return True

    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("\nInstall required packages:")
        print("  pip install sentence-transformers torch")
        return False

    except Exception as e:
        print(f"❌ Download error: {e}")
        return False


if __name__ == '__main__':
    download_model()
