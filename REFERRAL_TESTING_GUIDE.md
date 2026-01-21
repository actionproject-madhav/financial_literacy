# Referral System Testing Guide

## Overview
The referral system allows users to invite friends and earn 100 XP for each successful referral. Both the referrer and referee receive 100 XP.

## How It Works

### 1. **Referral Code Generation**
- Each user gets a unique 8-character referral code (e.g., `61L85SYH`)
- Code is automatically generated when first accessed
- Stored in the `learners` collection under `referral_code` field

### 2. **Referral Link Format**
```
http://localhost:5173/#/auth?ref=61L85SYH
```

### 3. **Flow**
1. User A opens Profile → "Invite friends" → Gets referral code and link
2. User A shares the link with User B
3. User B clicks the link → Lands on AuthPage → Referral code stored in localStorage
4. User B signs up with Google (or demo)
5. User B completes onboarding
6. System tracks referral and awards 100 XP to both users
7. Referral code cleared from localStorage

## Testing End-to-End

### Backend API Test (Automated)

```bash
cd backend
python test_referral_system.py
```

The test will prompt you for:
- User A's learner_id (referrer)
- User B's learner_id (referee)

### Manual Frontend Test

#### Step 1: Setup User A (Referrer)
1. Navigate to http://localhost:5173
2. Sign in as User A
3. Complete onboarding if needed
4. Go to Profile page
5. Click "Invite friends"
6. Copy the referral link (e.g., `http://localhost:5173/#/auth?ref=ABC12345`)
7. Note User A's current XP

#### Step 2: Create User B (Referee)
1. Open a new incognito/private window
2. Paste the referral link from Step 1
3. Verify the URL has `?ref=ABC12345` parameter
4. Sign up with a different Google account (or use demo mode with different email)
5. Complete onboarding
6. Note User B's initial XP

#### Step 3: Verify Results
1. Check User B's XP - should have +100 XP
2. Switch back to User A's window
3. Refresh the page
4. Check User A's XP - should have +100 XP
5. Open "Invite friends" modal
6. Verify "Total Referrals" count increased by 1
7. Verify "XP Earned" shows correct total (referrals × 100)

### Browser Console Verification

Open DevTools → Console to see:
```
Referral code stored: 61L85SYH
Referral tracked successfully
```

### Database Verification

```javascript
// MongoDB queries

// 1. Check User A's referral code
db.learners.findOne({ _id: ObjectId("USER_A_ID") }, { referral_code: 1, total_xp: 1 })

// 2. Check referral record
db.referrals.find({ referral_code: "ABC12345" })

// 3. Check both users' XP
db.learners.find(
  { _id: { $in: [ObjectId("USER_A_ID"), ObjectId("USER_B_ID")] } },
  { display_name: 1, total_xp: 1 }
)
```

## Expected Behavior

### ✅ Success Cases
- [x] User A gets unique referral code
- [x] Referral link contains code in URL parameter
- [x] User B signs up with referral link
- [x] Both users receive 100 XP immediately
- [x] Referral count increases for User A
- [x] Referral appears in User A's referral list
- [x] Referral code cleared from localStorage after tracking

### ❌ Error Cases (Should Fail Gracefully)
- [ ] Invalid referral code → Error message, signup continues
- [ ] User already referred → Error message, no duplicate XP
- [ ] Self-referral → Prevented (can't use own code)
- [ ] Expired/deleted referrer → Error message, signup continues

## Common Issues & Solutions

### Issue: "Referral code not stored"
**Solution:** Check browser console for localStorage permissions. Try without ad blockers.

### Issue: "User already referred" error
**Solution:** This user was already referred by someone else. Each user can only be referred once.

### Issue: XP not awarded
**Solution:**
1. Check backend logs for errors
2. Verify both users exist in database
3. Check referrals collection for the record
4. Run the automated test script to diagnose

### Issue: Referral count not updating
**Solution:** Refresh the Profile page to fetch latest data from API.

## API Endpoints

### Get Referral Code
```bash
GET /api/social/referral/code/{learner_id}

Response:
{
  "referral_code": "ABC12345",
  "referral_link": "http://localhost:5173/#/auth?ref=ABC12345",
  "total_referrals": 5
}
```

### Track Referral
```bash
POST /api/social/referral/track
Content-Type: application/json

{
  "referral_code": "ABC12345",
  "referred_user_id": "507f1f77bcf86cd799439011"
}

Response:
{
  "success": true,
  "referrer_id": "507f1f77bcf86cd799439012",
  "reward_xp": 100,
  "message": "Both users awarded 100 XP!"
}
```

### Get Referral List
```bash
GET /api/social/referrals/{learner_id}

Response:
{
  "referrals": [
    {
      "user_id": "507f...",
      "display_name": "John Doe",
      "total_xp": 350,
      "joined_at": "2024-01-15T10:30:00"
    }
  ],
  "total_referrals": 5,
  "total_rewards_earned": 500
}
```

## Files Modified

### Frontend
- `frontend/src/pages/AuthPage.tsx` - Extract and store referral code from URL
- `frontend/src/pages/OnboardingPage.tsx` - Track referral after signup
- `frontend/src/components/social/ReferralModal.tsx` - Display referral UI

### Backend
- `backend/blueprints/social.py` - Track referral, award XP to both users
- `backend/test_referral_system.py` - Automated test script

## Production Checklist

Before deploying to production:

- [ ] Test with real Google OAuth flow
- [ ] Test with different browsers (Chrome, Safari, Firefox)
- [ ] Test with mobile devices
- [ ] Verify CORS settings for production domain
- [ ] Update `FRONTEND_URL` in backend config
- [ ] Test referral links with production URL
- [ ] Set up monitoring for referral tracking failures
- [ ] Add rate limiting to prevent abuse
- [ ] Consider adding fraud detection (multiple accounts from same IP)

## Future Enhancements

- [ ] Email notifications when someone uses your referral
- [ ] Tiered rewards (10 referrals = bonus XP)
- [ ] Referral leaderboard
- [ ] Social sharing buttons (Twitter, Facebook, WhatsApp)
- [ ] Referral analytics dashboard
- [ ] Custom referral codes (instead of random)
- [ ] Referral campaigns with time limits
- [ ] A/B testing different reward amounts

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Run the automated test script
4. Review this guide
5. Check the MongoDB collections directly
6. Contact the development team
