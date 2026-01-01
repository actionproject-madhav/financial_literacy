"""
Social Features Blueprint

Handles:
- Friend requests (send, accept, reject, remove)
- Following/followers
- User search and discovery
- Referral system
- Social profile viewing
"""

from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime
import uuid
import random
import string
import sys
import os

# Add parent directory to path to import from learners blueprint
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

social_bp = Blueprint('social', __name__, url_prefix='/api/social')


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


def generate_referral_code():
    """Generate a unique 8-character referral code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


@social_bp.route('/friend-request/send', methods=['POST'])
def send_friend_request():
    """
    Send a friend request to another user.

    Request JSON:
    {
        "from_user_id": "507f...",
        "to_user_id": "507f..."
    }

    Response:
    {
        "success": true,
        "request_id": "507f...",
        "message": "Friend request sent"
    }
    """
    try:
        data = request.get_json()
        from_user_id = data.get('from_user_id')
        to_user_id = data.get('to_user_id')

        if not from_user_id or not to_user_id:
            return jsonify({'error': 'from_user_id and to_user_id required'}), 400

        if from_user_id == to_user_id:
            return jsonify({'error': 'Cannot send friend request to yourself'}), 400

        db = get_db()

        # Check if users exist
        from_user = db.collections.learners.find_one({'_id': ObjectId(from_user_id)})
        to_user = db.collections.learners.find_one({'_id': ObjectId(to_user_id)})

        if not from_user or not to_user:
            return jsonify({'error': 'User not found'}), 404

        # Check if already friends
        existing_friendship = db.collections.friendships.find_one({
            '$or': [
                {'user1_id': ObjectId(from_user_id), 'user2_id': ObjectId(to_user_id)},
                {'user1_id': ObjectId(to_user_id), 'user2_id': ObjectId(from_user_id)}
            ]
        })

        if existing_friendship:
            return jsonify({'error': 'Already friends'}), 400

        # Check if request already exists
        existing_request = db.collections.friend_requests.find_one({
            '$or': [
                {'from_user_id': ObjectId(from_user_id), 'to_user_id': ObjectId(to_user_id), 'status': 'pending'},
                {'from_user_id': ObjectId(to_user_id), 'to_user_id': ObjectId(from_user_id), 'status': 'pending'}
            ]
        })

        if existing_request:
            return jsonify({'error': 'Friend request already exists'}), 400

        # Create friend request
        friend_request = {
            'from_user_id': ObjectId(from_user_id),
            'to_user_id': ObjectId(to_user_id),
            'status': 'pending',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = db.collections.friend_requests.insert_one(friend_request)

        return jsonify({
            'success': True,
            'request_id': str(result.inserted_id),
            'message': 'Friend request sent'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/friend-request/accept', methods=['POST'])
def accept_friend_request():
    """
    Accept a friend request.

    Request JSON:
    {
        "request_id": "507f..."
    }

    Response:
    {
        "success": true,
        "friendship_id": "507f...",
        "message": "Friend request accepted"
    }
    """
    try:
        data = request.get_json()
        request_id = data.get('request_id')

        if not request_id:
            return jsonify({'error': 'request_id required'}), 400

        db = get_db()

        # Get friend request
        friend_request = db.collections.friend_requests.find_one({'_id': ObjectId(request_id)})

        if not friend_request:
            return jsonify({'error': 'Friend request not found'}), 404

        if friend_request['status'] != 'pending':
            return jsonify({'error': 'Friend request already processed'}), 400

        # Create friendship (store with smaller ID first for consistency)
        user1_id = min(friend_request['from_user_id'], friend_request['to_user_id'])
        user2_id = max(friend_request['from_user_id'], friend_request['to_user_id'])

        friendship = {
            'user1_id': user1_id,
            'user2_id': user2_id,
            'created_at': datetime.utcnow()
        }

        result = db.collections.friendships.insert_one(friendship)

        # Update friend request status
        db.collections.friend_requests.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {'status': 'accepted', 'updated_at': datetime.utcnow()}}
        )

        return jsonify({
            'success': True,
            'friendship_id': str(result.inserted_id),
            'message': 'Friend request accepted'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/friend-request/reject', methods=['POST'])
def reject_friend_request():
    """
    Reject a friend request.

    Request JSON:
    {
        "request_id": "507f..."
    }

    Response:
    {
        "success": true,
        "message": "Friend request rejected"
    }
    """
    try:
        data = request.get_json()
        request_id = data.get('request_id')

        if not request_id:
            return jsonify({'error': 'request_id required'}), 400

        db = get_db()

        # Update friend request status
        result = db.collections.friend_requests.update_one(
            {'_id': ObjectId(request_id), 'status': 'pending'},
            {'$set': {'status': 'rejected', 'updated_at': datetime.utcnow()}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Friend request not found or already processed'}), 404

        return jsonify({
            'success': True,
            'message': 'Friend request rejected'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/friend-requests/<learner_id>', methods=['GET'])
def get_friend_requests(learner_id):
    """
    Get all pending friend requests for a user.

    Query params:
    - type: 'received' or 'sent' (default: 'received')

    Response:
    {
        "requests": [
            {
                "request_id": "...",
                "from_user": {...},
                "to_user": {...},
                "created_at": "...",
                "status": "pending"
            }
        ]
    }
    """
    try:
        request_type = request.args.get('type', 'received')

        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Build query based on type
        if request_type == 'received':
            query = {'to_user_id': ObjectId(learner_id), 'status': 'pending'}
        else:  # sent
            query = {'from_user_id': ObjectId(learner_id), 'status': 'pending'}

        # Get friend requests
        requests = list(db.collections.friend_requests.find(query).sort('created_at', -1))

        results = []
        for req in requests:
            # Get user details
            from_user = db.collections.learners.find_one({'_id': req['from_user_id']})
            to_user = db.collections.learners.find_one({'_id': req['to_user_id']})

            results.append({
                'request_id': str(req['_id']),
                'from_user': {
                    'user_id': str(from_user['_id']),
                    'display_name': from_user.get('display_name', 'User'),
                    'total_xp': from_user.get('total_xp', 0),
                    'streak_count': from_user.get('streak_count', 0),
                    'profile_picture_url': from_user.get('profile_picture_url')
                } if from_user else None,
                'to_user': {
                    'user_id': str(to_user['_id']),
                    'display_name': to_user.get('display_name', 'User'),
                    'total_xp': to_user.get('total_xp', 0),
                    'streak_count': to_user.get('streak_count', 0),
                    'profile_picture_url': to_user.get('profile_picture_url')
                } if to_user else None,
                'created_at': req['created_at'].isoformat() if req.get('created_at') else None,
                'status': req.get('status', 'pending')
            })

        return jsonify({
            'requests': results,
            'count': len(results)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/friends/<learner_id>', methods=['GET'])
def get_friends(learner_id):
    """
    Get all friends for a user.

    Response:
    {
        "friends": [
            {
                "user_id": "...",
                "display_name": "...",
                "total_xp": 1000,
                "streak_count": 5,
                "profile_picture_url": "...",
                "friendship_since": "..."
            }
        ]
    }
    """
    try:
        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get friendships
        friendships = list(db.collections.friendships.find({
            '$or': [
                {'user1_id': ObjectId(learner_id)},
                {'user2_id': ObjectId(learner_id)}
            ]
        }))

        friends = []
        for friendship in friendships:
            # Get the friend's ID (the one that's not the current user)
            friend_id = friendship['user2_id'] if friendship['user1_id'] == ObjectId(learner_id) else friendship['user1_id']

            # Get friend details
            friend = db.collections.learners.find_one({'_id': friend_id})

            if friend:
                friends.append({
                    'user_id': str(friend['_id']),
                    'display_name': friend.get('display_name', 'User'),
                    'total_xp': friend.get('total_xp', 0),
                    'streak_count': friend.get('streak_count', 0),
                    'profile_picture_url': friend.get('profile_picture_url'),
                    'friendship_since': friendship['created_at'].isoformat() if friendship.get('created_at') else None
                })

        return jsonify({
            'friends': friends,
            'count': len(friends)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/friend/remove', methods=['POST'])
def remove_friend():
    """
    Remove a friend.

    Request JSON:
    {
        "user_id": "507f...",
        "friend_id": "507f..."
    }

    Response:
    {
        "success": true,
        "message": "Friend removed"
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        friend_id = data.get('friend_id')

        if not user_id or not friend_id:
            return jsonify({'error': 'user_id and friend_id required'}), 400

        db = get_db()

        # Remove friendship
        result = db.collections.friendships.delete_one({
            '$or': [
                {'user1_id': ObjectId(user_id), 'user2_id': ObjectId(friend_id)},
                {'user1_id': ObjectId(friend_id), 'user2_id': ObjectId(user_id)}
            ]
        })

        if result.deleted_count == 0:
            return jsonify({'error': 'Friendship not found'}), 404

        return jsonify({
            'success': True,
            'message': 'Friend removed'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/follow', methods=['POST'])
def follow_user():
    """
    Follow a user.

    Request JSON:
    {
        "follower_id": "507f...",
        "following_id": "507f..."
    }

    Response:
    {
        "success": true,
        "message": "Now following user"
    }
    """
    try:
        data = request.get_json()
        follower_id = data.get('follower_id')
        following_id = data.get('following_id')

        if not follower_id or not following_id:
            return jsonify({'error': 'follower_id and following_id required'}), 400

        if follower_id == following_id:
            return jsonify({'error': 'Cannot follow yourself'}), 400

        db = get_db()

        # Check if users exist
        follower = db.collections.learners.find_one({'_id': ObjectId(follower_id)})
        following = db.collections.learners.find_one({'_id': ObjectId(following_id)})

        if not follower or not following:
            return jsonify({'error': 'User not found'}), 404

        # Check if already following
        existing_follow = db.collections.follows.find_one({
            'follower_id': ObjectId(follower_id),
            'following_id': ObjectId(following_id)
        })

        if existing_follow:
            return jsonify({'error': 'Already following this user'}), 400

        # Create follow
        follow = {
            'follower_id': ObjectId(follower_id),
            'following_id': ObjectId(following_id),
            'created_at': datetime.utcnow()
        }

        db.collections.follows.insert_one(follow)

        return jsonify({
            'success': True,
            'message': 'Now following user'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/unfollow', methods=['POST'])
def unfollow_user():
    """
    Unfollow a user.

    Request JSON:
    {
        "follower_id": "507f...",
        "following_id": "507f..."
    }

    Response:
    {
        "success": true,
        "message": "Unfollowed user"
    }
    """
    try:
        data = request.get_json()
        follower_id = data.get('follower_id')
        following_id = data.get('following_id')

        if not follower_id or not following_id:
            return jsonify({'error': 'follower_id and following_id required'}), 400

        db = get_db()

        # Remove follow
        result = db.collections.follows.delete_one({
            'follower_id': ObjectId(follower_id),
            'following_id': ObjectId(following_id)
        })

        if result.deleted_count == 0:
            return jsonify({'error': 'Not following this user'}), 404

        return jsonify({
            'success': True,
            'message': 'Unfollowed user'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/followers/<learner_id>', methods=['GET'])
def get_followers(learner_id):
    """
    Get all followers for a user.

    Response:
    {
        "followers": [
            {
                "user_id": "...",
                "display_name": "...",
                "total_xp": 1000,
                "streak_count": 5,
                "profile_picture_url": "...",
                "following_since": "..."
            }
        ]
    }
    """
    try:
        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get followers
        follows = list(db.collections.follows.find({'following_id': ObjectId(learner_id)}))

        followers = []
        for follow in follows:
            # Get follower details
            follower = db.collections.learners.find_one({'_id': follow['follower_id']})

            if follower:
                followers.append({
                    'user_id': str(follower['_id']),
                    'display_name': follower.get('display_name', 'User'),
                    'total_xp': follower.get('total_xp', 0),
                    'streak_count': follower.get('streak_count', 0),
                    'profile_picture_url': follower.get('profile_picture_url'),
                    'following_since': follow['created_at'].isoformat() if follow.get('created_at') else None
                })

        return jsonify({
            'followers': followers,
            'count': len(followers)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/following/<learner_id>', methods=['GET'])
def get_following(learner_id):
    """
    Get all users that a user is following.

    Response:
    {
        "following": [
            {
                "user_id": "...",
                "display_name": "...",
                "total_xp": 1000,
                "streak_count": 5,
                "profile_picture_url": "...",
                "following_since": "..."
            }
        ]
    }
    """
    try:
        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get following
        follows = list(db.collections.follows.find({'follower_id': ObjectId(learner_id)}))

        following = []
        for follow in follows:
            # Get following user details
            user = db.collections.learners.find_one({'_id': follow['following_id']})

            if user:
                following.append({
                    'user_id': str(user['_id']),
                    'display_name': user.get('display_name', 'User'),
                    'total_xp': user.get('total_xp', 0),
                    'streak_count': user.get('streak_count', 0),
                    'profile_picture_url': user.get('profile_picture_url'),
                    'following_since': follow['created_at'].isoformat() if follow.get('created_at') else None
                })

        return jsonify({
            'following': following,
            'count': len(following)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/users/search', methods=['GET'])
def search_users():
    """
    Search for users by name or email.

    Query params:
    - q: Search query (minimum 2 characters)
    - limit: Max results (default 20)

    Response:
    {
        "users": [
            {
                "user_id": "...",
                "display_name": "...",
                "email": "...",
                "total_xp": 1000,
                "streak_count": 5,
                "profile_picture_url": "..."
            }
        ]
    }
    """
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 20))

        if len(query) < 2:
            return jsonify({'error': 'Search query must be at least 2 characters'}), 400

        db = get_db()

        # Search by display name or email (case-insensitive)
        users = list(db.collections.learners.find({
            '$or': [
                {'display_name': {'$regex': query, '$options': 'i'}},
                {'email': {'$regex': query, '$options': 'i'}}
            ]
        }).limit(limit))

        results = []
        for user in users:
            results.append({
                'user_id': str(user['_id']),
                'display_name': user.get('display_name', 'User'),
                'email': user.get('email', ''),
                'total_xp': user.get('total_xp', 0),
                'streak_count': user.get('streak_count', 0),
                'profile_picture_url': user.get('profile_picture_url')
            })

        return jsonify({
            'users': results,
            'count': len(results)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/profile/<learner_id>', methods=['GET'])
def get_user_profile(learner_id):
    """
    Get public profile of a user (for viewing other users' profiles).

    Query params:
    - viewer_id: ID of user viewing the profile (optional, for friend/follow status)

    Response:
    {
        "user_id": "...",
        "display_name": "...",
        "total_xp": 1000,
        "streak_count": 5,
        "profile_picture_url": "...",
        "level": 10,
        "lessons_completed": 25,
        "skills_mastered": 15,
        "friends_count": 10,
        "followers_count": 20,
        "following_count": 15,
        "is_friend": false,  // if viewer_id provided
        "is_following": false,  // if viewer_id provided
        "has_pending_request": false  // if viewer_id provided
    }
    """
    try:
        viewer_id = request.args.get('viewer_id')

        db = get_db()

        # Get user
        user = db.collections.learners.find_one({'_id': ObjectId(learner_id)})

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get stats from learner_stats endpoint logic
        total_xp = user.get('total_xp', 0)
        streak_count = user.get('streak_count', 0)
        lessons_completed = db.collections.learner_skill_states.count_documents({
            'learner_id': ObjectId(learner_id),
            'status': 'mastered'
        })

        # Calculate level (simplified inline version)
        def calculate_level_from_xp(total_xp):
            if total_xp <= 0:
                return {'level': 1}
            level = 1
            xp_required = 0
            while xp_required <= total_xp:
                level += 1
                xp_required = sum(100 * i for i in range(1, level))
            return {'level': level - 1}

        level_info = calculate_level_from_xp(total_xp)

        # Count friends
        friends_count = db.collections.friendships.count_documents({
            '$or': [
                {'user1_id': ObjectId(learner_id)},
                {'user2_id': ObjectId(learner_id)}
            ]
        })

        # Count followers
        followers_count = db.collections.follows.count_documents({
            'following_id': ObjectId(learner_id)
        })

        # Count following
        following_count = db.collections.follows.count_documents({
            'follower_id': ObjectId(learner_id)
        })

        profile = {
            'user_id': str(user['_id']),
            'display_name': user.get('display_name', 'User'),
            'total_xp': total_xp,
            'streak_count': streak_count,
            'profile_picture_url': user.get('profile_picture_url'),
            'level': level_info['level'],
            'lessons_completed': lessons_completed,
            'skills_mastered': lessons_completed,  # Same as lessons_completed
            'friends_count': friends_count,
            'followers_count': followers_count,
            'following_count': following_count
        }

        # If viewer_id provided, check relationship status
        if viewer_id and viewer_id != learner_id:
            # Check if friends
            is_friend = db.collections.friendships.find_one({
                '$or': [
                    {'user1_id': ObjectId(viewer_id), 'user2_id': ObjectId(learner_id)},
                    {'user1_id': ObjectId(learner_id), 'user2_id': ObjectId(viewer_id)}
                ]
            }) is not None

            # Check if following
            is_following = db.collections.follows.find_one({
                'follower_id': ObjectId(viewer_id),
                'following_id': ObjectId(learner_id)
            }) is not None

            # Check if has pending friend request
            has_pending_request = db.collections.friend_requests.find_one({
                '$or': [
                    {'from_user_id': ObjectId(viewer_id), 'to_user_id': ObjectId(learner_id), 'status': 'pending'},
                    {'from_user_id': ObjectId(learner_id), 'to_user_id': ObjectId(viewer_id), 'status': 'pending'}
                ]
            }) is not None

            profile['is_friend'] = is_friend
            profile['is_following'] = is_following
            profile['has_pending_request'] = has_pending_request

        return jsonify(profile), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/referral/code/<learner_id>', methods=['GET'])
def get_referral_code(learner_id):
    """
    Get or generate referral code for a user.

    Response:
    {
        "referral_code": "ABC12345",
        "referral_link": "https://app.com/signup?ref=ABC12345",
        "total_referrals": 5
    }
    """
    try:
        db = get_db()

        # Get user
        user = db.collections.learners.find_one({'_id': ObjectId(learner_id)})

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get or generate referral code
        referral_code = user.get('referral_code')

        if not referral_code:
            # Generate new referral code
            referral_code = generate_referral_code()

            # Ensure uniqueness
            while db.collections.learners.find_one({'referral_code': referral_code}):
                referral_code = generate_referral_code()

            # Update user
            db.collections.learners.update_one(
                {'_id': ObjectId(learner_id)},
                {'$set': {'referral_code': referral_code}}
            )

        # Count referrals
        total_referrals = db.collections.referrals.count_documents({
            'referrer_id': ObjectId(learner_id)
        })

        # Generate referral link (you can customize the base URL)
        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        referral_link = f"{base_url}/#/auth?ref={referral_code}"

        return jsonify({
            'referral_code': referral_code,
            'referral_link': referral_link,
            'total_referrals': total_referrals
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/referral/track', methods=['POST'])
def track_referral():
    """
    Track when a user signs up using a referral code.

    Request JSON:
    {
        "referral_code": "ABC12345",
        "referred_user_id": "507f..."
    }

    Response:
    {
        "success": true,
        "referrer_id": "507f...",
        "reward_xp": 100
    }
    """
    try:
        data = request.get_json()
        referral_code = data.get('referral_code')
        referred_user_id = data.get('referred_user_id')

        if not referral_code or not referred_user_id:
            return jsonify({'error': 'referral_code and referred_user_id required'}), 400

        db = get_db()

        # Find referrer
        referrer = db.collections.learners.find_one({'referral_code': referral_code})

        if not referrer:
            return jsonify({'error': 'Invalid referral code'}), 404

        # Check if already referred
        existing_referral = db.collections.referrals.find_one({
            'referred_id': ObjectId(referred_user_id)
        })

        if existing_referral:
            return jsonify({'error': 'User already referred'}), 400

        # Create referral record
        referral = {
            'referrer_id': referrer['_id'],
            'referred_id': ObjectId(referred_user_id),
            'referral_code': referral_code,
            'created_at': datetime.utcnow(),
            'reward_claimed': False
        }

        db.collections.referrals.insert_one(referral)

        # Award XP to referrer
        reward_xp = 100  # Customize as needed
        db.collections.learners.update_one(
            {'_id': referrer['_id']},
            {'$inc': {'total_xp': reward_xp}}
        )

        # Update daily progress for leaderboard tracking
        from datetime import date
        today = date.today()
        db.collections.update_daily_progress(
            learner_id=referrer_id,
            date_obj=today,
            xp_earned=reward_xp
        )

        return jsonify({
            'success': True,
            'referrer_id': str(referrer['_id']),
            'reward_xp': reward_xp
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@social_bp.route('/referrals/<learner_id>', methods=['GET'])
def get_referrals(learner_id):
    """
    Get all users referred by a user.

    Response:
    {
        "referrals": [
            {
                "user_id": "...",
                "display_name": "...",
                "total_xp": 500,
                "joined_at": "..."
            }
        ],
        "total_referrals": 5,
        "total_rewards_earned": 500
    }
    """
    try:
        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get referrals
        referrals = list(db.collections.referrals.find({'referrer_id': ObjectId(learner_id)}))

        results = []
        for referral in referrals:
            # Get referred user details
            user = db.collections.learners.find_one({'_id': referral['referred_id']})

            if user:
                results.append({
                    'user_id': str(user['_id']),
                    'display_name': user.get('display_name', 'User'),
                    'total_xp': user.get('total_xp', 0),
                    'joined_at': referral['created_at'].isoformat() if referral.get('created_at') else None
                })

        return jsonify({
            'referrals': results,
            'total_referrals': len(results),
            'total_rewards_earned': len(results) * 100  # 100 XP per referral
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Health check
@social_bp.route('/health', methods=['GET'])
def health_check():
    """Check if social service is healthy."""
    try:
        db = get_db()
        # Try a simple query
        db.collections.learners.find_one()

        return jsonify({
            'status': 'healthy',
            'service': 'social',
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500
