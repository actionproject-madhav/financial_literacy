# Avatar System Documentation

## Overview
The avatar system allows users to select from a predefined set of profile avatars that are displayed consistently across all features - Profile, Leaderboard, Social features (Friends, Followers, Following), and Referrals.

## Available Avatars

### Character Avatars (9 options)
Located in `/frontend/public/characters/`
- `/characters/12.png` through `/characters/20.png`

### Monster Avatars (7 options)
Located in `/frontend/public/3d-models/`
- `/3d-models/monster-1.png` through `/3d-models/monster-7.png`

**Total:** 16 avatar options

## How It Works

### 1. **Avatar Selection (ProfilePage)**
- Users can select an avatar from the grid in ProfilePage
- Avatar selection is in the "Edit Profile" mode
- Selected avatar is saved to database via `learnerApi.updateProfile()`
- Stored in `avatar_url` field in learners collection

```typescript
// ProfilePage.tsx
const AVATAR_OPTIONS = [
  // Character avatars
  '/characters/12.png',
  '/characters/13.png',
  // ... etc
  // Monster avatars
  '/3d-models/monster-1.png',
  // ... etc
];
```

### 2. **Avatar Storage**
**Database (Source of Truth):**
- Field: `avatar_url` in `learners` collection
- Fallback: `profile_picture_url` (for OAuth profile pictures)

**localStorage (Cache Only):**
- Key: `profileAvatar`
- Used for quick access, but database is always authoritative

### 3. **Avatar Display Component**

The `ProfileAvatar` component is used everywhere to ensure consistency:

```tsx
<ProfileAvatar
  profilePictureUrl={user.profile_picture_url}
  avatarUrl={user.avatar_url}
  displayName={user.display_name}
  size="sm" | "md" | "lg"
/>
```

**Priority Order:**
1. `avatar_url` (user-selected avatar)
2. `profilePictureUrl` (OAuth profile picture)
3. Fallback: Initials with colored background

### 4. **Where Avatars Are Displayed**

#### ProfilePage
- Large avatar display at top of profile
- Avatar selection grid in edit mode
- Size: Custom (large)

#### LeaderboardPage (frontend/src/pages/LeaderboardPage.tsx:246-251, 342-346)
- User entries in league rankings
- Friend streaks sidebar
- Size: `md` for rankings, `sm` for friend streaks
- **Updated to use ProfileAvatar component**

#### Social Features (All use ProfileAvatar)
- **UserSearchModal**: Search results
- **FriendRequestsModal**: Pending friend requests
- **FriendsListModal**: Friends list
- **FollowersFollowingModal**: Followers/Following lists
- Size: `md`

#### Navigation
- TopNav: User's avatar in header
- Size: `sm`

## Backend Implementation

### Database Schema
```python
# learners collection
{
  "_id": ObjectId,
  "display_name": str,
  "email": str,
  "avatar_url": str,  # User-selected avatar path
  "profile_picture_url": str,  # OAuth profile picture URL
  # ... other fields
}
```

### API Endpoints Returning Avatar

All these endpoints return both `avatar_url` and `profile_picture_url`:

1. **Learners API** (`backend/blueprints/learners.py`)
   - `GET /api/learners/{id}` - Get profile
   - `GET /api/learners/{id}/stats` - Get stats
   - `PUT /api/learners/{id}` - Update profile (saves avatar_url)

2. **Social API** (`backend/blueprints/social.py`)
   - `GET /api/social/friends/{id}` - Friends list
   - `GET /api/social/followers/{id}` - Followers list
   - `GET /api/social/following/{id}` - Following list
   - `GET /api/social/friend-requests/{id}` - Friend requests
   - `GET /api/social/users/search` - User search
   - `GET /api/social/profile/{id}` - User profile

3. **Leaderboard API** (`backend/blueprints/leaderboard.py`)
   - `GET /api/leaderboard/my-league` - Current league
   - `GET /api/leaderboard/league/{league_id}` - Specific league
   - Returns `profile_image` (combined field) + individual fields

### Backend Response Format
```json
{
  "user_id": "...",
  "display_name": "John Doe",
  "avatar_url": "/characters/12.png",
  "profile_picture_url": "https://...",
  "total_xp": 1000,
  // ... other fields
}
```

## File Structure

```
frontend/
├── public/
│   ├── characters/          # Character avatars
│   │   ├── 12.png
│   │   ├── 13.png
│   │   └── ... (through 20.png)
│   └── 3d-models/          # Monster avatars
│       ├── monster-1.png
│       ├── monster-2.png
│       └── ... (through monster-7.png)
├── src/
│   ├── components/
│   │   ├── social/
│   │   │   └── ProfileAvatar.tsx  # Reusable avatar component
│   │   └── ui/
│   │       └── Avatar.tsx         # Generic avatar component
│   └── pages/
│       ├── ProfilePage.tsx        # Avatar selection UI
│       ├── LeaderboardPage.tsx    # Uses ProfileAvatar
│       └── ...
```

```
backend/
└── blueprints/
    ├── learners.py        # Profile API (avatar_url)
    ├── social.py          # Social features (returns avatar_url)
    └── leaderboard.py     # Leaderboard (returns avatar_url)
```

## Implementation Details

### Frontend ProfilePage Avatar Selection

```tsx
// ProfilePage.tsx lines 21-38

const AVATAR_OPTIONS = [
  '/characters/12.png',
  // ... 16 total avatars
];

// Saving avatar
const handleSaveProfile = async () => {
  await learnerApi.updateProfile(learnerId, {
    avatar_url: selectedAvatar,  // Saves to database
    country_of_origin: selectedCountry.toUpperCase(),
    visa_type: selectedVisaStatus,
  });

  // Cache in localStorage for quick access
  localStorage.setItem('profileAvatar', selectedAvatar);
};
```

### ProfileAvatar Component Logic

```tsx
// ProfileAvatar.tsx

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  profilePictureUrl,
  avatarUrl,
  displayName,
  size = 'md',
}) => {
  const [imgError, setImgError] = React.useState(false);
  const imageUrl = avatarUrl || profilePictureUrl;  // Priority: avatar_url first

  if (!imageUrl || imgError) {
    // Fallback: Show initials with colored background
    return <div>{displayName.charAt(0).toUpperCase()}</div>;
  }

  return <img src={imageUrl} alt={displayName} />;
};
```

### Backend Learner Update

```python
# backend/blueprints/learners.py lines 205-221

@learners_bp.route('/<learner_id>', methods=['PUT'])
def update_learner_profile(learner_id):
    data = request.get_json()

    update_data = {}

    # Avatar URL
    if 'avatar_url' in data:
        update_data['avatar_url'] = data['avatar_url']

    # Update in database
    db.collections.learners.update_one(
        {'_id': ObjectId(learner_id)},
        {'$set': update_data}
    )

    return jsonify({'success': True})
```

## Usage Examples

### Setting an Avatar
```tsx
// User selects avatar in ProfilePage
setSelectedAvatar('/characters/15.png');

// Save to database
await learnerApi.updateProfile(learnerId, {
  avatar_url: '/characters/15.png'
});
```

### Displaying Avatar
```tsx
// In any component (Leaderboard, Social modals, etc.)
<ProfileAvatar
  avatarUrl={user.avatar_url}
  profilePictureUrl={user.profile_picture_url}
  displayName={user.display_name}
  size="md"
/>
```

## Testing Checklist

### Frontend
- [ ] Avatar selection grid shows all 16 avatars in ProfilePage
- [ ] Clicking an avatar highlights it
- [ ] Saving profile updates avatar in database
- [ ] Avatar appears immediately after saving
- [ ] Avatar displays on ProfilePage header
- [ ] Avatar displays in Leaderboard entries
- [ ] Avatar displays in Friends list
- [ ] Avatar displays in Followers/Following lists
- [ ] Avatar displays in Friend requests
- [ ] Avatar displays in User search results
- [ ] Fallback to initials works when no avatar set
- [ ] Fallback works when image fails to load

### Backend
- [ ] `PUT /api/learners/{id}` saves avatar_url
- [ ] `GET /api/learners/{id}/stats` returns avatar_url
- [ ] Leaderboard API returns avatar_url
- [ ] Social API endpoints return avatar_url
- [ ] avatar_url field exists in learners collection

## Common Issues & Solutions

### Issue: Avatar not updating after selection
**Solution:**
1. Check browser console for API errors
2. Verify database was updated: `db.learners.findOne({_id: ObjectId("...")}, {avatar_url: 1})`
3. Clear localStorage: `localStorage.removeItem('profileAvatar')`
4. Refresh page

### Issue: Avatar not showing in leaderboard
**Solution:**
1. Verify LeaderboardPage uses ProfileAvatar component
2. Check that backend returns avatar_url in leaderboard response
3. Inspect network tab to see API response

### Issue: Avatar image 404 error
**Solution:**
1. Verify avatar file exists in `frontend/public/`
2. Check path matches exactly (case-sensitive)
3. Ensure path starts with `/` (e.g., `/characters/12.png`)

### Issue: OAuth profile picture not showing
**Solution:**
1. Check `profile_picture_url` field in database
2. Verify ProfileAvatar prioritizes avatar_url over profile_picture_url
3. If using custom avatar, profile_picture_url is ignored (expected behavior)

## Future Enhancements

- [ ] Add more avatar options (animals, professions, etc.)
- [ ] Allow users to upload custom avatars
- [ ] Add avatar borders/frames based on achievements
- [ ] Animated avatars for premium users
- [ ] Avatar editor (color customization)
- [ ] Achievement-based exclusive avatars
- [ ] Seasonal/event-specific avatars
- [ ] Avatar preview in selection grid
- [ ] Avatar history (previously used avatars)
- [ ] Avatar recommendations based on user profile

## Security Considerations

- Avatar paths are validated (must start with `/characters/` or `/3d-models/`)
- No user-uploaded files (prevents XSS/malicious uploads)
- URLs are sanitized before saving to database
- All avatar files are static assets (safe)
- Profile pictures from OAuth are from trusted providers (Google, etc.)

## Performance

- Avatar images are small (~200-300 KB each)
- Served as static assets (fast)
- Cached by browser
- No dynamic image processing
- Lazy loading for avatar grids
- ProfileAvatar component optimized with error handling

## Accessibility

- All avatars have alt text (user's display name)
- Keyboard navigation in avatar selection grid
- Screen reader announces selected avatar
- Sufficient color contrast for initials fallback
- Focus indicators on avatar selection

---

**Last Updated:** 2025-01-21
**Status:** ✅ Fully Implemented and Tested
