# Voice Input & Semantic Analysis System

Complete documentation for the voice-powered learning features with semantic answer matching and misconception detection.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Usage Examples](#usage-examples)
7. [Frontend Integration](#frontend-integration)
8. [Cost Optimization](#cost-optimization)
9. [Analytics & Insights](#analytics--insights)

---

## Overview

The voice system enables learners to:
- 🎤 **Answer questions by speaking** instead of clicking multiple choice
- 🔊 **Listen to questions** in their preferred language
- 📊 **Get deeper learning analytics** from voice confidence signals
- 🎯 **Receive targeted remediation** when misconceptions are detected

### Key Features

- **Speech-to-Text**: OpenAI Whisper transcription with multi-language support
- **Text-to-Speech**: Generate audio for questions on-demand
- **Semantic Matching**: Match spoken answers to multiple choice options using embeddings
- **Misconception Detection**: Identify and track learning patterns
- **Audio Analysis**: Detect hesitation, filler words, speech pace
- **Accessibility**: Support for learners with reading difficulties

---

## Architecture

```
User speaks answer
    ↓
VoiceService.transcribe() → Whisper API
    ↓
SemanticMatcher.match_answer() → OpenAI Embeddings
    ↓
MisconceptionDetector.detect() → LLM Analysis
    ↓
LearningEngine.submit_answer() → Update BKT/FSRS
    ↓
Store in voice_responses collection
```

### Services

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| **VoiceService** | STT, TTS, audio analysis | OpenAI Whisper, TTS API |
| **SemanticMatcher** | Embedding-based answer matching | OpenAI Embeddings |
| **MisconceptionDetector** | Pattern detection & remediation | MongoDB, OpenAI |

---

## Installation

### 1. Install Dependencies

```bash
cd financial_literacy/backend
pip install -r requirements.txt
```

New dependencies added:
- `openai>=1.0.0` - Whisper, TTS, Embeddings
- `pydub>=0.25.0` - Audio processing
- `scipy>=1.11.0` - Similarity calculations
- `scikit-learn>=1.3.0` - Clustering algorithms

### 2. Configure Environment Variables

```bash
# In .env file
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### 3. Create Database Indexes

```python
from database import Database

db = Database()
db.initialize_indexes()  # Creates indexes for voice_responses, misconceptions, etc.
```

---

## API Endpoints

### Voice Input

#### POST `/api/adaptive/voice/transcribe`

Transcribe audio to text.

**Request:**
```json
{
  "audio_base64": "data:audio/webm;base64,GkXf...",
  "language_hint": "en"
}
```

**Response:**
```json
{
  "transcription": "I think it's a credit card",
  "confidence": 0.95,
  "detected_language": "en",
  "duration_ms": 2500
}
```

---

#### POST `/api/adaptive/interactions/voice`

Submit a voice answer with full semantic analysis.

**Request:**
```json
{
  "learner_id": "507f1f77bcf86cd799439011",
  "item_id": "507f1f77bcf86cd799439022",
  "session_id": "uuid-session-id",
  "audio_base64": "data:audio/webm;base64,GkXf...",
  "question_type": "definition"
}
```

**Response:**
```json
{
  "success": true,
  "is_correct": true,
  "transcription": "A credit score is a number that shows how trustworthy you are with borrowing money",
  "matched_choice": "a",
  "similarity_scores": {
    "a": 0.92,
    "b": 0.31,
    "c": 0.24,
    "d": 0.18
  },
  "confidence": {
    "transcription": 0.95,
    "semantic_match": 0.92,
    "voice": 0.85
  },
  "audio_analysis": {
    "hesitation_ms": 500,
    "speech_pace_wpm": 145,
    "filler_words": 1
  },
  "misconception": null,
  "skill_state": {
    "kc_id": "...",
    "p_mastery": 0.82,
    "mastery_change": 0.15,
    "status": "in_progress",
    "next_review_at": "2025-01-15T10:00:00Z"
  },
  "xp_earned": 20,
  "achievements": [],
  "feedback": "Matched to choice a with 0.92 similarity"
}
```

**Ambiguous Response Example:**
```json
{
  "success": false,
  "ambiguous": true,
  "transcription": "something about interest rates",
  "clarification_prompt": "Did you mean 'APR - Annual Percentage Rate' or 'Interest - cost of borrowing'?",
  "similar_choices": ["a", "c"],
  "similarity_scores": {
    "a": 0.78,
    "b": 0.25,
    "c": 0.75,
    "d": 0.20
  }
}
```

---

### Text-to-Speech

#### POST `/api/adaptive/voice/tts`

Generate audio for text.

**Request:**
```json
{
  "text": "What is a credit score?",
  "language": "en",
  "voice": "alloy"
}
```

**Response:**
```json
{
  "audio_base64": "data:audio/mp3;base64,//uQx..."
}
```

---

#### GET `/api/adaptive/voice/tts/<item_id>?language=en`

Get TTS audio for a learning item.

**Response:**
```json
{
  "audio_base64": "data:audio/mp3;base64,//uQx...",
  "cached": false
}
```

---

### Misconceptions

#### GET `/api/adaptive/learner/<learner_id>/misconceptions?resolved=false`

Get learner's detected misconceptions.

**Response:**
```json
{
  "misconceptions": [
    {
      "misconception_id": "507f...",
      "kc_id": "507f...",
      "pattern_type": "confusion",
      "description": "Confuses APR (Annual Percentage Rate) with APY (Annual Percentage Yield)",
      "times_detected": 3,
      "first_detected_at": "2025-01-10T14:23:00Z",
      "last_detected_at": "2025-01-15T09:15:00Z",
      "resolved": false,
      "remediation": {
        "content": "APR is the yearly cost of borrowing, while APY includes compound interest. Review how compound interest works.",
        "review_skills": ["apr-basics", "compound-interest"]
      }
    }
  ],
  "count": 1
}
```

---

#### POST `/api/adaptive/learner/<learner_id>/misconceptions/<misconception_id>/resolve`

Mark a misconception as resolved.

**Response:**
```json
{
  "success": true,
  "message": "Misconception marked as resolved"
}
```

---

## Database Schema

### voice_responses

Stores all voice interactions with detailed analytics.

```javascript
{
  _id: ObjectId,
  learner_id: ObjectId,
  kc_id: ObjectId,
  interaction_id: ObjectId,

  // Audio data
  audio_url: String,  // Optional: S3 URL if stored
  duration_ms: Number,

  // Transcription
  transcription: String,
  transcription_confidence: Number,  // 0-1
  detected_language: String,

  // Semantic matching
  semantic_similarity: Number,  // Best match score
  matched_choice: String,  // 'a', 'b', 'c', 'd', or null
  similarity_scores: {
    a: Number,
    b: Number,
    c: Number,
    d: Number
  },

  // Audio analysis
  hesitation_ms: Number,
  speech_pace_wpm: Number,
  confidence_score: Number,  // 0-1
  filler_words_count: Number,
  false_starts: Number,

  // Result
  is_correct: Boolean,

  created_at: Date
}
```

### misconceptions

Library of known misconception patterns.

```javascript
{
  _id: ObjectId,
  kc_id: ObjectId,

  pattern_type: String,  // 'confusion', 'partial_understanding', 'foreign_concept_transfer'
  description: String,
  example_responses: [String],

  remediation_content: {
    content: String,
    review_skills: [String]
  },

  occurrence_count: Number,
  countries_affected: [String],

  created_at: Date,
  last_detected_at: Date
}
```

### learner_misconceptions

Tracks which learners have which misconceptions.

```javascript
{
  learner_id: ObjectId,
  misconception_id: ObjectId,

  times_detected: Number,
  first_detected_at: Date,
  last_detected_at: Date,

  resolved: Boolean,
  resolved_at: Date
}
```

---

## Usage Examples

### Example 1: Basic Voice Answer Flow

```python
# Frontend sends audio
POST /api/adaptive/interactions/voice
{
  "learner_id": "507f...",
  "item_id": "507f...",
  "audio_base64": "data:audio/webm;base64,..."
}

# Backend processes:
# 1. Transcribes: "I think it's when you pay back more than you borrowed"
# 2. Matches to choices using embeddings
# 3. Finds best match: choice "b" (interest) with 0.89 similarity
# 4. Updates learner's BKT state
# 5. Stores voice_response record
# 6. Returns result
```

### Example 2: Detecting Misconceptions

```python
# Learner answers incorrectly
# Transcription: "APR and APY are the same thing"

# MisconceptionDetector analyzes:
# - Compares to known misconceptions for this KC
# - Matches pattern: "apr_apy_confusion"
# - Returns remediation suggestion
# - Logs learner_misconception record

# Response includes:
{
  "misconception": {
    "misconception_type": "confusion",
    "description": "Confuses APR with APY",
    "remediation": {
      "content": "While similar, APR is simple interest while APY includes compounding..."
    }
  }
}
```

### Example 3: Question Audio Playback

```javascript
// Frontend requests TTS
GET /api/adaptive/voice/tts/507f1f77bcf86cd799439022?language=en

// Backend:
// 1. Fetches item
// 2. Generates TTS for question text
// 3. Returns base64 audio

// Frontend plays audio
<audio src={audioBase64} autoplay />
```

---

## Frontend Integration

### React Hook: Voice Recording

```typescript
// hooks/useVoiceInput.ts
import { useState, useRef } from 'react';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
    };

    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
  };

  const getBase64 = async (): Promise<string> => {
    if (!audioBlob) return '';
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(audioBlob);
    });
  };

  return { isRecording, startRecording, stopRecording, audioBlob, getBase64 };
};
```

### Component: Voice Answer Button

```typescript
// components/VoiceAnswerButton.tsx
import { useVoiceInput } from '../hooks/useVoiceInput';

export const VoiceAnswerButton = ({ onSubmit }) => {
  const { isRecording, startRecording, stopRecording, getBase64 } = useVoiceInput();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    stopRecording();
    setIsProcessing(true);

    const audioBase64 = await getBase64();

    try {
      const response = await fetch('/api/adaptive/interactions/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learner_id: learnerId,
          item_id: itemId,
          session_id: sessionId,
          audio_base64: audioBase64
        })
      });

      const result = await response.json();
      onSubmit(result);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="voice-answer">
      {!isRecording ? (
        <button onClick={startRecording} disabled={isProcessing}>
          🎤 Speak Your Answer
        </button>
      ) : (
        <button onClick={handleSubmit} className="recording">
          ⏹️ Submit Answer
        </button>
      )}
      {isProcessing && <div>Processing...</div>}
    </div>
  );
};
```

### Component: Question TTS Player

```typescript
// components/QuestionAudio.tsx
export const QuestionAudio = ({ itemId, language = 'en' }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadAudio = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/adaptive/voice/tts/${itemId}?language=${language}`
      );
      const data = await response.json();
      setAudioUrl(data.audio_base64);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={loadAudio} disabled={isLoading}>
        🔊 {isLoading ? 'Loading...' : 'Listen to Question'}
      </button>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          autoPlay
          onEnded={() => setAudioUrl(null)}
        />
      )}
    </div>
  );
};
```

---

## Cost Optimization

### API Costs (as of 2025)

| Service | Cost | Usage |
|---------|------|-------|
| Whisper STT | $0.006/min | Per voice answer (~2-5s each) |
| TTS | $0.015/1K chars | Per question audio generation |
| Embeddings | $0.0001/1K tokens | Per answer + choices (4-5 tokens avg) |
| GPT-4o-mini | $0.15/$0.60 per 1M tokens | Misconception analysis (only on wrong answers) |

### Optimization Strategies

1. **Cache TTS Audio**
   ```python
   # Store generated audio in MongoDB or S3
   # Only generate once per question
   if item.audio_url:
       return item.audio_url
   else:
       audio = generate_tts(question_text)
       item.update({'audio_url': audio})
   ```

2. **Pre-compute Embeddings**
   ```python
   # Batch embed all choice texts on content creation
   # Store in learning_items collection
   matcher = SemanticMatcher()
   embeddings = matcher.batch_embed_choices(items)
   ```

3. **Lazy Misconception Analysis**
   ```python
   # Only use LLM for new/unrecognized patterns
   # Check cache first
   known = check_known_misconceptions(kc_id, answer)
   if not known:
       # Then use LLM
       analysis = llm_analyze_misconception(...)
   ```

4. **Self-Hosted Whisper (Future)**
   ```python
   # For high volume, run Whisper locally
   import whisper
   model = whisper.load_model("base")
   result = model.transcribe(audio_path)
   ```

---

## Analytics & Insights

### Metrics You Can Track

1. **Voice Confidence Correlation**
   ```python
   # Do learners who speak confidently (low hesitation, few fillers)
   # actually perform better?

   SELECT
     AVG(confidence_score) as avg_confidence,
     AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) as accuracy
   FROM voice_responses
   GROUP BY learner_id
   ```

2. **Reading Difficulty Detection**
   ```python
   # Automatically suggest voice mode if:
   # - User skips text-heavy questions
   # - Takes 3x longer on reading comprehension
   # - Switches to voice mode frequently

   if user.avg_text_time > 3 * user.avg_voice_time:
       suggest_voice_mode()
   ```

3. **Misconception Prevalence by Country**
   ```python
   # Which misconceptions are common for which countries?

   SELECT
     misconception_id,
     country_code,
     COUNT(*) as occurrences
   FROM learner_misconceptions lm
   JOIN learners l ON lm.learner_id = l._id
   GROUP BY misconception_id, l.country_of_origin
   ```

4. **Semantic Matching Accuracy**
   ```python
   # How often does semantic matching get the right answer?

   SELECT
     AVG(CASE
       WHEN matched_choice = correct_answer THEN 1
       ELSE 0
     END) as match_accuracy
   FROM voice_responses
   WHERE matched_choice IS NOT NULL
   ```

---

## Next Steps

### Immediate Improvements

1. **Audio Caching**: Store TTS audio in S3 or MongoDB GridFS
2. **Batch Processing**: Pre-generate audio for all questions
3. **Voice Profile**: Detect learner's accent/dialect for better transcription
4. **Feedback Loop**: Let learners correct wrong transcriptions

### Future Enhancements

1. **Conversational Mode**: "Explain this concept in your own words"
2. **Voice Onboarding**: Complete signup flow via voice
3. **Pronunciation Training**: Help learners say financial terms correctly
4. **Multi-turn Dialogue**: "Why did you choose that answer?"
5. **Real-time Feedback**: Show transcription as they speak

---

## Troubleshooting

### Common Issues

**Audio not recording:**
- Check browser permissions for microphone
- Ensure HTTPS (required for `getUserMedia`)
- Test with `navigator.mediaDevices.enumerateDevices()`

**Transcription failures:**
- Verify `OPENAI_API_KEY` is set
- Check audio format (webm recommended)
- Ensure audio file < 25MB

**Low semantic similarity scores:**
- Adjust thresholds in `SemanticMatcher.THRESHOLDS`
- Use question type parameter for dynamic thresholds
- Review embedding quality for your domain

**Misconceptions not detected:**
- Seed initial misconception library
- Run batch analysis: `MisconceptionDetector.analyze_patterns(kc_id)`
- Lower clustering thresholds in DBSCAN

---

## Support

For questions or issues:
- GitHub Issues: [your-repo/issues]
- Documentation: `/docs`
- API Reference: `/api/adaptive/health`
