"""
Local Sentence Transformers Embeddings

100% FREE - No API calls needed
- Model: all-MiniLM-L6-v2 (22MB, fast, good quality)
- Runs on CPU, no GPU required
- 384-dimensional embeddings

Replaces OpenAI Embeddings ($0.00002/1K tokens) with local processing.
"""

import sys
import os
import numpy as np
from scipy.spatial.distance import cosine
from functools import lru_cache

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.services import config

# Initialize sentence transformers model
try:
    from sentence_transformers import SentenceTransformer

    @lru_cache(maxsize=1)
    def get_model():
        """
        Load embedding model (cached).
        Downloads on first use (~22MB).
        """
        print(f"Loading embedding model: {config.EMBEDDING_MODEL}...")
        model = SentenceTransformer(config.EMBEDDING_MODEL)
        print("✅ Embedding model loaded")
        return model

except ImportError:
    print("⚠️  sentence-transformers not installed. Run: pip install sentence-transformers torch")
    def get_model():
        raise RuntimeError("sentence-transformers not available")


def get_embedding(text: str) -> list:
    """
    Get embedding vector for text.

    Args:
        text: Input text

    Returns:
        List of 384 floats (embedding vector)
    """
    model = get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def get_embeddings_batch(texts: list, batch_size: int = 32) -> list:
    """
    Get embeddings for multiple texts (efficient batching).

    Args:
        texts: List of text strings
        batch_size: Batch size for processing

    Returns:
        List of embedding vectors
    """
    model = get_model()
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        batch_size=batch_size,
        show_progress_bar=len(texts) > 100
    )
    return [e.tolist() for e in embeddings]


def calculate_similarity(embedding1: list, embedding2: list) -> float:
    """
    Calculate cosine similarity between two embeddings.

    Args:
        embedding1: First embedding vector
        embedding2: Second embedding vector

    Returns:
        Similarity score (0-1, higher is more similar)
    """
    try:
        similarity = 1 - cosine(embedding1, embedding2)
        return max(0.0, min(1.0, similarity))  # Clamp to [0, 1]
    except Exception as e:
        print(f"Similarity calculation error: {e}")
        return 0.0


def find_best_match(query_embedding: list, candidate_embeddings: list) -> tuple:
    """
    Find best matching candidate from a list.

    Args:
        query_embedding: Query embedding vector
        candidate_embeddings: List of candidate embedding vectors

    Returns:
        Tuple of (best_index, similarity_score)
    """
    similarities = [
        calculate_similarity(query_embedding, candidate)
        for candidate in candidate_embeddings
    ]

    if not similarities:
        return -1, 0.0

    best_idx = int(np.argmax(similarities))
    return best_idx, similarities[best_idx]


def match_text_to_choices(text: str, choices: list) -> dict:
    """
    Match text to multiple choice options using semantic similarity.

    Args:
        text: Input text to match
        choices: List of dicts with {'id': 'a', 'text': '...'}

    Returns:
        {
            'similarity_scores': {'a': 0.8, 'b': 0.3, ...},
            'best_match': 'a',
            'best_score': 0.8
        }
    """
    if not choices:
        return {
            'similarity_scores': {},
            'best_match': None,
            'best_score': 0.0
        }

    model = get_model()

    # Get all embeddings in one batch (efficient)
    all_texts = [text] + [c['text'] for c in choices]
    embeddings = model.encode(all_texts, convert_to_numpy=True)

    query_embedding = embeddings[0]
    choice_embeddings = embeddings[1:]

    # Calculate similarities
    similarity_scores = {}
    for i, choice in enumerate(choices):
        sim = 1 - cosine(query_embedding, choice_embeddings[i])
        similarity_scores[choice['id']] = round(float(sim), 3)

    # Find best match
    best_match = max(similarity_scores, key=similarity_scores.get)

    return {
        'similarity_scores': similarity_scores,
        'best_match': best_match,
        'best_score': similarity_scores[best_match]
    }


def cluster_similar_texts(texts: list, threshold: float = 0.75) -> list:
    """
    Cluster similar texts together.

    Useful for finding misconception patterns.

    Args:
        texts: List of text strings
        threshold: Minimum similarity to be in same cluster

    Returns:
        List of clusters, where each cluster is a list of text indices
    """
    if not texts:
        return []

    # Get embeddings
    embeddings = get_embeddings_batch(texts)

    # Simple greedy clustering
    clusters = []
    assigned = set()

    for i, emb1 in enumerate(embeddings):
        if i in assigned:
            continue

        # Start new cluster
        cluster = [i]
        assigned.add(i)

        # Find similar texts
        for j, emb2 in enumerate(embeddings):
            if j <= i or j in assigned:
                continue

            sim = calculate_similarity(emb1, emb2)
            if sim >= threshold:
                cluster.append(j)
                assigned.add(j)

        if len(cluster) >= 1:
            clusters.append(cluster)

    return clusters


# Pre-warm the model on import (optional)
def prewarm_model():
    """Pre-load model to avoid first-call delay"""
    try:
        get_model()
    except:
        pass


# Uncomment to pre-warm model on import
# prewarm_model()
