# 🚀 Quick Start: Nepali Language Support

## TL;DR

Your app **ALREADY supports Nepali voice**! I just added **content translation**. Here's how to test:

## 1. Restart Backend

```bash
cd /Users/madhav/Desktop/finlit/financial_literacy/backend
python3 app.py
```

The new `/api/translate/content` endpoint is now active.

## 2. Hard Refresh Frontend

Open your browser and press:
- **Mac:** `Cmd + Shift + R`
- **Windows/Linux:** `Ctrl + Shift + R`

This clears the cache and loads the new translation features.

## 3. Select Nepali

1. Click the language selector (flag icon in top-right or settings)
2. Select **"नेपाली 🇳🇵"**
3. Watch everything translate!

## 4. Test Voice Features

### Test Speech-to-Text (STT)
1. Go to any lesson
2. Click the **"RECORD"** button
3. Speak in Nepali (e.g., "बैंकिङ मूल बातें")
4. Should transcribe correctly ✅

### Test Text-to-Speech (TTS)
1. In a lesson, click the **speaker icon** 🔊
2. Should read the question in Nepali ✅

### Test Voice Answer
1. Answer a question by speaking in Nepali
2. Should evaluate your answer correctly ✅

## 5. Verify Translation

### UI Translation (Instant)
- Navigation: "Learn" → "सिक्नुहोस्"
- Buttons: "Continue" → "जारी राख्नुहोस्"
- Settings: "Settings" → "सेटिङहरू"

### Content Translation (1-2 seconds first time)
- Course descriptions
- Lesson content
- Shop items
- Quest descriptions

## 6. Run Tests (Optional)

```bash
cd /Users/madhav/Desktop/finlit/financial_literacy/backend
python3 scripts/test_nepali_voice.py
```

Expected output:
```
🎉 ALL TESTS PASSED! Nepali voice support is working!
```

## What's Supported

| Feature | Status | Notes |
|---------|--------|-------|
| Voice Recognition (STT) | ✅ Working | ElevenLabs Scribe |
| Text-to-Speech (TTS) | ✅ Working | ElevenLabs TTS |
| UI Translation | ✅ Working | Pre-translated |
| Content Translation | ✅ Working | GPT-4o-mini |
| Semantic Matching | ✅ Working | OpenAI Embeddings |
| Language Selector | ✅ Working | Global state |

## Troubleshooting

### Issue: UI not translating

**Fix:** Hard refresh (Cmd+Shift+R) to clear cache

### Issue: Content not translating

**Fix:** Check backend is running and `/api/translate/content` is accessible

```bash
curl -X POST http://localhost:5173/api/translate/content \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","target_language":"ne"}'
```

Expected response:
```json
{"translated_text":"नमस्ते"}
```

### Issue: Voice not working

**Fix:** Check ElevenLabs API key is set

```bash
cd backend
grep ELEVENLABS_API_KEY .env
```

Should show: `ELEVENLABS_API_KEY=sk_...`

## Cost Monitoring

### Translation API Calls
Check console for cache hits:
```
✅ Translation cache hit: "Hello" → "नमस्ते"
🔄 Translation API call: "New text" → "नयाँ पाठ"
```

### Voice API Calls
Check backend logs:
```
🎤 STT: 2.5s audio → "बैंकिङ मूल बातें" (confidence: 0.95)
🔊 TTS: "नमस्ते" → 3.2KB audio
```

## Next Steps

1. **Test thoroughly** with native Nepali speakers
2. **Review translations** for accuracy
3. **Monitor costs** (should be ~$5-10/month for MVP)
4. **Consider pre-translation** for production (eliminates runtime API calls)

## Support

- **Voice Documentation:** `backend/docs/NEPALI_VOICE_SUPPORT.md`
- **Full Summary:** `NEPALI_SUPPORT_SUMMARY.md`
- **Test Suite:** `backend/scripts/test_nepali_voice.py`

---

**Ready to test!** 🇳🇵✨

