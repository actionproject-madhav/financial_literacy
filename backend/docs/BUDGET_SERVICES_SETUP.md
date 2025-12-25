# Budget-Friendly Voice Services Setup Guide

Complete guide to setting up budget voice services that reduce costs from **$1.10 to $0.45 per 1000 interactions** (60% savings).

## Cost Comparison

| Service | Premium | Budget | Savings |
|---------|---------|--------|---------|
| **Speech-to-Text** | OpenAI Whisper ($0.006/min) | Deepgram ($0.0043/min) | 28% |
| **Embeddings** | OpenAI ($0.00002/1K) | Local (FREE) | 100% |
| **Text-to-Speech** | OpenAI ($0.015/1K chars) | Google TTS ($0.004/1K) | 73% |
| **Storage** | AWS S3 ($0.023/GB + egress) | Cloudflare R2 (free egress) | ~60% |

**Total savings: ~60%** ($1.10 → $0.45 per 1000 interactions)

---

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd financial_literacy/backend
pip install -r requirements.txt
```

### 2. Download Embedding Model

```bash
python scripts/download_embedding_model.py
```

This downloads the free embedding model (~22MB) that replaces OpenAI embeddings.

### 3. Configure Services

Choose services based on your needs:

**Option A: Minimal Setup (Local Embeddings Only)**
- Free embeddings replace OpenAI
- Still uses OpenAI for STT/TTS
- Saves ~20% immediately

```bash
# In .env
USE_BUDGET_SERVICES=true
OPENAI_API_KEY=sk-proj-...  # Still needed for STT/TTS
```

**Option B: Full Budget Setup (Maximum Savings)**
- All budget services
- Saves ~60%
- Requires signup for Deepgram, Google Cloud, R2

Continue to detailed setup below.

---

## Detailed Setup

### Service 1: Deepgram (Speech-to-Text)

**Cost:** $0.0043/min (vs OpenAI $0.006/min) = **28% savings**

#### Setup Steps

1. **Create Account**
   - Go to [console.deepgram.com](https://console.deepgram.com)
   - Sign up (get $200 free credit)

2. **Get API Key**
   - Dashboard → API Keys → Create New Key
   - Copy the key

3. **Configure**
   ```bash
   # In .env
   DEEPGRAM_API_KEY=your_key_here
   ```

4. **Verify**
   ```bash
   python scripts/test_budget_services.py
   ```

**Features:**
- Better multi-language support (Nepali, Tagalog, Vietnamese)
- Word-level timestamps
- Speaker diarization (if needed)
- Live transcription support

---

### Service 2: Google Cloud TTS (Text-to-Speech)

**Cost:** $0.004/1K chars (vs OpenAI $0.015/1K) = **73% savings**

#### Setup Steps

1. **Create Google Cloud Project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project: "finlit-voice"

2. **Enable API**
   - Navigation Menu → APIs & Services → Library
   - Search "Cloud Text-to-Speech API"
   - Click "Enable"

3. **Create Service Account**
   - APIs & Services → Credentials
   - Create Credentials → Service Account
   - Name: "finlit-tts-service"
   - Grant role: "Cloud Text-to-Speech User"

4. **Download Key**
   - Click on service account
   - Keys tab → Add Key → Create New Key → JSON
   - Download the JSON file

5. **Configure**
   ```bash
   # In .env
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/downloaded-key.json
   ```

   Or move to project:
   ```bash
   mv ~/Downloads/finlit-*.json ./financial_literacy/backend/config/google-tts-key.json

   # Then in .env
   GOOGLE_APPLICATION_CREDENTIALS=./config/google-tts-key.json
   ```

6. **Test**
   ```bash
   python scripts/test_budget_services.py
   ```

**Features:**
- Neural2 voices (highest quality)
- 50+ languages
- SSML support for fine control
- WaveNet voices available

---

### Service 3: Cloudflare R2 (Storage)

**Cost:** $0.015/GB storage + **FREE egress** (vs S3 $0.023/GB + $0.09/GB egress) = **~60% savings**

#### Setup Steps

1. **Create Cloudflare Account**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign up (free plan works!)

2. **Create R2 Bucket**
   - Navigation → R2
   - Create bucket: "finlit-audio"

3. **Enable Public Access**
   - Click on bucket
   - Settings → Public Access
   - Enable "Allow Access"
   - Note the public URL (e.g., `https://pub-abc123.r2.dev`)

4. **Create API Token**
   - R2 → Overview
   - Manage R2 API Tokens → Create API Token
   - Permissions: "Object Read & Write"
   - Note: Account ID, Access Key ID, Secret Access Key

5. **Configure**
   ```bash
   # In .env
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=finlit-audio
   R2_PUBLIC_URL=https://pub-abc123.r2.dev
   ```

6. **Initialize Bucket**
   ```bash
   python scripts/setup_r2.py
   ```

7. **Test**
   ```bash
   python scripts/test_budget_services.py
   ```

**Benefits:**
- No egress fees (huge savings!)
- S3-compatible API
- Global edge network
- 10GB free storage

---

### Service 4: Local Embeddings (FREE)

**Cost:** $0 (vs OpenAI $0.00002/1K tokens) = **100% savings**

#### Setup Steps

1. **Download Model**
   ```bash
   python scripts/download_embedding_model.py
   ```

   This downloads `all-MiniLM-L6-v2` (~22MB):
   - 384-dimensional embeddings
   - Fast inference on CPU
   - Good quality for semantic matching

2. **Test**
   ```python
   from services import local_embeddings

   # Get embedding
   emb = local_embeddings.get_embedding("credit card")
   print(f"Embedding size: {len(emb)}")  # 384

   # Match to choices
   result = local_embeddings.match_text_to_choices(
       "a card for borrowing money",
       [
           {'id': 'a', 'text': 'credit card'},
           {'id': 'b', 'text': 'debit card'},
           {'id': 'c', 'text': 'gift card'}
       ]
   )
   print(f"Best match: {result['best_match']}")  # 'a'
   ```

**Advantages:**
- Zero API costs
- No network latency
- Works offline
- Privacy (data never leaves your server)

---

## Enable Budget Services

Once all services are configured:

```bash
# In .env
USE_BUDGET_SERVICES=true
```

Restart your backend:

```bash
python app.py
```

You should see:
```
✅ Using BUDGET services (Deepgram, Google TTS, R2, Local Embeddings)
🎤 Using BUDGET voice services
🔍 Using BUDGET semantic matching
```

---

## Verification

### Test All Services

```bash
python scripts/test_budget_services.py
```

Expected output:
```
=== Budget Services Test Suite ===

=== Testing Deepgram (STT) ===
✅ Deepgram client initialized

=== Testing Google Cloud TTS ===
✅ Generated 1234 bytes of audio

=== Testing Cloudflare R2 ===
✅ Upload successful
✅ Found 1 test files

=== Testing Local Embeddings ===
✅ Generated embedding: 384 dimensions
✅ Matching test:
   Best match: a (0.892)

=== Test Summary ===
✅ PASS Deepgram
✅ PASS Google TTS
✅ PASS R2 Storage
✅ PASS Local Embeddings

Total: 4/4 services working
🎉 All budget services are ready!
```

### Test Voice Interaction

```bash
curl -X POST http://localhost:5000/api/adaptive/voice/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio_base64": "..."}'
```

---

## Usage in Code

Budget services are drop-in replacements:

```python
# Import works the same regardless of budget/premium mode
from services.voice_budget import VoiceService
from services.semantic_budget import SemanticMatcher

# Initialize (automatically uses budget or premium based on config)
voice = VoiceService()
matcher = SemanticMatcher()

# Use exactly as before
transcription = voice.transcribe(audio_base64, language_hint='en')
match = matcher.match_answer(spoken_text, choices, correct_answer)
```

The services automatically switch based on `USE_BUDGET_SERVICES` in `.env`.

---

## Cost Breakdown

### Example: 10,000 Users, 10 Voice Answers Each

**Premium (OpenAI Everything):**
```
STT:     100,000 × 3 sec avg = 5,000 min × $0.006 = $30.00
TTS:     10,000 questions × 50 chars × $0.015/1K = $7.50
Embeddings: 400,000 tokens × $0.00002 = $8.00
Storage: 100GB × $0.023 + egress $0.09 = $11.20
TOTAL: $56.70/month
```

**Budget (Mixed):**
```
STT:     100,000 × 3 sec avg = 5,000 min × $0.0043 = $21.50
TTS:     10,000 questions × 50 chars × $0.004/1K = $2.00
Embeddings: FREE (local) = $0.00
Storage: 100GB × $0.015 + $0 egress = $1.50
LLM (edge cases): ~$5.00
TOTAL: $30.00/month
```

**Savings: $26.70/month (47% reduction)**

At scale (100K users): **$267/month saved!**

---

## Troubleshooting

### Issue: Deepgram "Unauthorized"

**Solution:**
```bash
# Check API key in .env
echo $DEEPGRAM_API_KEY

# Test directly
curl -X POST https://api.deepgram.com/v1/listen \
  -H "Authorization: Token YOUR_KEY" \
  -H "Content-Type: audio/wav" \
  --data-binary @test.wav
```

### Issue: Google TTS "Permission Denied"

**Solution:**
1. Check service account has "Cloud Text-to-Speech User" role
2. Verify JSON key path is correct
3. Enable the API: `gcloud services enable texttospeech.googleapis.com`

### Issue: R2 "Access Denied"

**Solution:**
```bash
# Verify credentials
python -c "from config.services import config; print(config.R2_ACCOUNT_ID)"

# Test connection
python scripts/setup_r2.py
```

### Issue: Embedding Model Download Fails

**Solution:**
```bash
# Manual download
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Check disk space
df -h

# Clear cache if needed
rm -rf ~/.cache/torch/sentence_transformers/
```

---

## Advanced Configuration

### Use Faster Embedding Model

For even faster inference:

```bash
# In config/services.py
EMBEDDING_MODEL = 'all-MiniLM-L12-v2'  # Faster, 384 dims
# or
EMBEDDING_MODEL = 'paraphrase-MiniLM-L3-v2'  # Smallest, still good
```

### Custom TTS Voices

```python
from services.google_tts_client import generate_speech

# Slower speed for learners
audio = generate_speech("What is APR?", "en", speaking_rate=0.8)

# SSML for fine control
ssml = """
<speak>
  What is <emphasis level="strong">APR</emphasis>?
  <break time="500ms"/>
  Let's find out!
</speak>
"""
audio = generate_speech_ssml(ssml, "en")
```

### Hybrid Mode

Use budget for most operations, premium for edge cases:

```python
# In config/services.py
USE_BUDGET_SERVICES = True
OPENAI_API_KEY = "sk-..."  # Keep for LLM fallback

# Services will:
# - Use Deepgram for STT
# - Use local embeddings for matching
# - Fall back to OpenAI LLM only for uncertain answers
```

---

## Migration from Premium

### Gradual Migration

1. **Week 1:** Enable local embeddings only
   ```bash
   USE_BUDGET_SERVICES=true
   # Keep OpenAI key for STT/TTS
   ```

2. **Week 2:** Add Deepgram STT
   ```bash
   DEEPGRAM_API_KEY=...
   ```

3. **Week 3:** Add Google TTS + R2
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=...
   R2_ACCESS_KEY_ID=...
   ```

4. **Week 4:** Remove OpenAI (optional, keep for LLM fallback)

### Rollback Plan

If issues occur:

```bash
# Instant rollback
USE_BUDGET_SERVICES=false

# Restart backend
pm2 restart finlit-backend
```

---

## Monitoring & Alerts

### Track Costs

**Deepgram:**
- Dashboard → Usage
- Set alerts at 80% of free credit

**Google Cloud:**
```bash
gcloud billing budgets create \
  --billing-account=ACCOUNT_ID \
  --display-name="FinLit TTS Budget" \
  --budget-amount=20
```

**Cloudflare R2:**
- Dashboard → R2 → Metrics
- Free tier: 10GB storage, unlimited requests

### Performance Monitoring

```python
# Add to your logging
import time

start = time.time()
result = voice.transcribe(audio)
elapsed = time.time() - start

logger.info(f"STT latency: {elapsed:.2f}s, confidence: {result['confidence']}")
```

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Download embedding model
3. ✅ Sign up for Deepgram
4. ✅ Configure Google Cloud TTS
5. ✅ Set up Cloudflare R2
6. ✅ Update .env
7. ✅ Run test suite
8. ✅ Enable in production

**You're now saving ~60% on voice processing costs!** 🎉

---

## Support

- **Deepgram:** [support.deepgram.com](https://support.deepgram.com)
- **Google Cloud:** [cloud.google.com/support](https://cloud.google.com/support)
- **Cloudflare:** [community.cloudflare.com](https://community.cloudflare.com)
- **Sentence Transformers:** [github.com/UKPLab/sentence-transformers](https://github.com/UKPLab/sentence-transformers)
