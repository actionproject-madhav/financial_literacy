"""
Leaderboard API Blueprint

Provides endpoints for:
- Getting weekly leaderboard rankings
- Getting user's league and position
- League promotions/demotions
"""

from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timedelta

leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/api/leaderboard')


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


# League definitions - Duolingo-style colors
LEAGUES = [
    {'id': 'bronze', 'name': 'Bronze', 'min_xp': 0, 'color': '#CD7F32', 'icon': 'bronze'},
    {'id': 'silver', 'name': 'Silver', 'min_xp': 500, 'color': '#9CA3AF', 'icon': 'silver'},
    {'id': 'gold', 'name': 'Gold', 'min_xp': 1500, 'color': '#FCD34D', 'icon': 'gold'},
    {'id': 'emerald', 'name': 'Emerald', 'min_xp': 3000, 'color': '#34D399', 'icon': 'emerald'},
    {'id': 'diamond', 'name': 'Diamond', 'min_xp': 5000, 'color': '#60A5FA', 'icon': 'diamond'},
    {'id': 'master', 'name': 'Master', 'min_xp': 10000, 'color': '#9B59B6', 'icon': 'master'},
]


def get_start_of_week():
    """Get the start of current week (Monday midnight UTC)"""
    now = datetime.utcnow()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    days_since_monday = now.weekday()
    return start_of_day - timedelta(days=days_since_monday)


def get_league_for_xp(total_xp):
    """Determine league based on total XP"""
    current_league = LEAGUES[0]
    for league in LEAGUES:
        if total_xp >= league['min_xp']:
            current_league = league
    return current_league


def get_weekly_xp(db, learner_id):
    """Get XP earned this week for a learner"""
    try:
        week_start = get_start_of_week()
        pipeline = [
            {'$match': {
                'learner_id': ObjectId(learner_id),
                'date': {'$gte': week_start}
            }},
            {'$group': {'_id': None, 'total': {'$sum': '$xp_earned'}}}
        ]
        result = list(db.collections.daily_progress.aggregate(pipeline))
        return result[0]['total'] if result and result[0].get('total') is not None else 0
    except Exception as e:
        current_app.logger.error(f"Error getting weekly XP for {learner_id}: {e}")
        return 0


def get_user_initials(display_name):
    """Extract initials from display name"""
    if not display_name:
        return '?'
    parts = display_name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return display_name[0].upper() if display_name else '?'


def get_time_remaining():
    """Get days and hours remaining until week end"""
    now = datetime.utcnow()
    week_start = get_start_of_week()
    week_end = week_start + timedelta(days=7)
    delta = week_end - now
    
    days = delta.days
    hours = int(delta.seconds / 3600)
    
    return {
        'days': max(0, days),
        'hours': max(0, hours),
        'total_seconds': int(delta.total_seconds())
    }


@leaderboard_bp.route('/', methods=['GET'])
def get_leaderboard():
    """
    Get the current week's leaderboard for a specific league.

    Query params:
    - limit: Number of users to return (default 50)
    - league: Filter by league (required for league-specific leaderboard)
    - learner_id: Get leaderboard for learner's league (alternative to league param)

    Response:
    {
        "rankings": [...],
        "week_start": "2024-01-01T00:00:00Z",
        "week_end": "2024-01-07T23:59:59Z",
        "total_participants": 100,
        "league": {...},
        "time_remaining": {...}
    }
    """
    try:
        db = get_db()
        limit = min(int(request.args.get('limit', 50)), 100)
        league_filter = request.args.get('league')
        learner_id_param = request.args.get('learner_id')

        week_start = get_start_of_week()
        week_end = week_start + timedelta(days=7) - timedelta(seconds=1)

        # If learner_id provided, get their league
        if learner_id_param and not league_filter:
            try:
                learner_oid = ObjectId(learner_id_param)
                learner = db.collections.learners.find_one({'_id': learner_oid})
                if learner:
                    total_xp = learner.get('total_xp', 0)
                    league_filter = get_league_for_xp(total_xp)['id']
            except:
                pass

        # Get all learners with their total XP to determine leagues
        # Exclude mock/test users in production
        all_learners = list(db.collections.learners.find(
            {'is_mock': {'$ne': True}},  # Exclude mock users
            {'total_xp': 1, 'display_name': 1, 'streak_count': 1, 'profile_picture_url': 1, 'avatar_url': 1}
        ))
        learner_xp_map = {str(l['_id']): l.get('total_xp', 0) for l in all_learners}
        learner_info_map = {str(l['_id']): l for l in all_learners}

        # Aggregate weekly XP for all learners
        pipeline = [
            {'$match': {
                'date': {'$gte': week_start}
            }},
            {'$group': {
                '_id': '$learner_id',
                'weekly_xp': {'$sum': '$xp_earned'}
            }},
            {'$sort': {'weekly_xp': -1}}
        ]

        weekly_results = list(db.collections.daily_progress.aggregate(pipeline))
        weekly_xp_map = {str(r['_id']): r['weekly_xp'] for r in weekly_results}

        # Filter by league if specified
        league_rankings = []
        seen_learner_ids = set()
        
        # Include all learners in the league, even if they have 0 weekly XP
        for learner_obj in all_learners:
            lid = str(learner_obj['_id'])
            l_xp = learner_obj.get('total_xp', 0)
            l_league = get_league_for_xp(l_xp)
            
            if league_filter and l_league['id'] != league_filter:
                continue
            
            weekly_xp = weekly_xp_map.get(lid, 0)
            learner_info = learner_info_map.get(lid, {})
            display_name = learner_info.get('display_name', 'Anonymous')
            
            # Get profile picture (prefer avatar_url, fallback to profile_picture_url)
            avatar_url = learner_info.get('avatar_url') or learner_info.get('profile_picture_url') or ''
            
            league_rankings.append({
                'learner_id': lid,
                'weekly_xp': weekly_xp,
                'total_xp': l_xp,
                'display_name': display_name,
                'initials': get_user_initials(display_name),
                'profile_picture_url': learner_info.get('profile_picture_url', ''),
                'avatar_url': learner_info.get('avatar_url', ''),
                'profile_image': avatar_url,  # Combined field for easy frontend use
                'league': l_league,
                'streak': learner_info.get('streak_count', 0)
            })
            seen_learner_ids.add(lid)

        # Sort by weekly XP and assign ranks
        league_rankings.sort(key=lambda x: x['weekly_xp'], reverse=True)
        for i, ranking in enumerate(league_rankings):
            ranking['rank'] = i + 1

        # Limit results (but ensure we return at least some data even if empty)
        limited_rankings = league_rankings[:limit] if league_rankings else []

        # Get current league info
        current_league = None
        if league_filter:
            current_league = next((l for l in LEAGUES if l['id'] == league_filter), None)

        return jsonify({
            'rankings': limited_rankings,
            'week_start': week_start.isoformat() + 'Z',
            'week_end': week_end.isoformat() + 'Z',
            'total_participants': len(league_rankings),
            'league': current_league,
            'time_remaining': get_time_remaining()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@leaderboard_bp.route('/<learner_id>', methods=['GET'])
def get_learner_ranking(learner_id):
    """
    Get a specific learner's ranking and league info.

    Response:
    {
        "rank": 15,
        "weekly_xp": 350,
        "total_xp": 1250,
        "league": {...},
        "next_league": {...},
        "xp_to_next_league": 250,
        "promotion_zone": false,
        "demotion_zone": false
    }
    """
    try:
        db = get_db()
        learner_oid = ObjectId(learner_id)

        # Get learner
        learner = db.collections.learners.find_one({'_id': learner_oid})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        total_xp = learner.get('total_xp', 0)
        weekly_xp = get_weekly_xp(db, learner_id)

        # Get current league
        current_league = get_league_for_xp(total_xp)

        # Find next league
        next_league = None
        xp_to_next = 0
        current_league_index = next((i for i, l in enumerate(LEAGUES) if l['id'] == current_league['id']), 0)
        if current_league_index < len(LEAGUES) - 1:
            next_league = LEAGUES[current_league_index + 1]
            xp_to_next = next_league['min_xp'] - total_xp

        # Calculate rank
        week_start = get_start_of_week()
        pipeline = [
            {'$match': {
                'date': {'$gte': week_start}
            }},
            {'$group': {
                '_id': '$learner_id',
                'weekly_xp': {'$sum': '$xp_earned'}
            }},
            {'$match': {'weekly_xp': {'$gt': weekly_xp}}},
            {'$count': 'ahead'}
        ]
        result = list(db.collections.daily_progress.aggregate(pipeline))
        rank = (result[0]['ahead'] if result else 0) + 1

        # Get all learners in the same league for promotion zone calculation
        all_learners = list(db.collections.learners.find({'is_mock': {'$ne': True}}, {'total_xp': 1}))
        league_learners = []
        for l in all_learners:
            l_xp = l.get('total_xp', 0)
            l_league = get_league_for_xp(l_xp)
            if l_league['id'] == current_league['id']:
                league_learners.append(str(l['_id']))

        # Get weekly XP for all learners in this league
        league_weekly_xp = {}
        for lid in league_learners:
            league_weekly_xp[lid] = get_weekly_xp(db, lid)

        # Sort by weekly XP to find rank in league
        sorted_league = sorted(league_weekly_xp.items(), key=lambda x: x[1], reverse=True)
        league_rank = next((i + 1 for i, (lid, _) in enumerate(sorted_league) if lid == learner_id), len(sorted_league))

        # Promotion zone is top 10 in the league
        promotion_threshold = 10
        total_in_league = len(sorted_league)

        return jsonify({
            'rank': league_rank,
            'weekly_xp': weekly_xp,
            'total_xp': total_xp,
            'league': current_league,
            'next_league': next_league,
            'xp_to_next_league': max(0, xp_to_next),
            'promotion_zone': league_rank <= promotion_threshold and total_in_league >= 10,
            'demotion_zone': False,  # Simplified - no demotion for now
            'streak': learner.get('streak_count', 0),
            'display_name': learner.get('display_name', 'Anonymous'),
            'initials': get_user_initials(learner.get('display_name', 'Anonymous')),
            'time_remaining': get_time_remaining()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@leaderboard_bp.route('/leagues', methods=['GET'])
def get_leagues():
    """
    Get all league definitions.

    Response:
    {
        "leagues": [...]
    }
    """
    return jsonify({'leagues': LEAGUES}), 200


@leaderboard_bp.route('/around/<learner_id>', methods=['GET'])
def get_rankings_around_learner(learner_id):
    """
    Get rankings around a specific learner (3 above and 3 below).

    Response:
    {
        "rankings": [...],
        "learner_rank": 15
    }
    """
    try:
        db = get_db()
        learner_oid = ObjectId(learner_id)

        week_start = get_start_of_week()

        # Get all weekly XP rankings
        pipeline = [
            {'$match': {'date': {'$gte': week_start}}},
            {'$group': {
                '_id': '$learner_id',
                'weekly_xp': {'$sum': '$xp_earned'}
            }},
            {'$sort': {'weekly_xp': -1}}
        ]

        all_rankings = list(db.collections.daily_progress.aggregate(pipeline))

        # Find learner's position
        learner_index = -1
        for i, r in enumerate(all_rankings):
            if r['_id'] == learner_oid:
                learner_index = i
                break

        if learner_index == -1:
            # Learner hasn't earned XP this week, put them at the end
            learner_index = len(all_rankings)
            all_rankings.append({'_id': learner_oid, 'weekly_xp': 0})

        # Get 3 above and 3 below
        start_index = max(0, learner_index - 3)
        end_index = min(len(all_rankings), learner_index + 4)

        nearby_rankings = all_rankings[start_index:end_index]

        # Get learner details (exclude mock users)
        learner_ids = [r['_id'] for r in nearby_rankings]
        learners = list(db.collections.learners.find({
            '_id': {'$in': learner_ids},
            'is_mock': {'$ne': True}
        }))
        learner_map = {str(l['_id']): l for l in learners}

        rankings = []
        for i, result in enumerate(nearby_rankings):
            lid = str(result['_id'])
            learner = learner_map.get(lid, {})
            total_xp = learner.get('total_xp', 0)

            rankings.append({
                'rank': start_index + i + 1,
                'learner_id': lid,
                'display_name': learner.get('display_name', 'Anonymous'),
                'weekly_xp': result['weekly_xp'],
                'total_xp': total_xp,
                'league': get_league_for_xp(total_xp),
                'is_current_user': lid == learner_id
            })

        return jsonify({
            'rankings': rankings,
            'learner_rank': learner_index + 1
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@leaderboard_bp.route('/my-league/<learner_id>', methods=['GET'])
def get_my_league(learner_id):
    """
    Get the current user's league leaderboard with all relevant info.
    
    Response:
    {
        "league": {...},
        "rankings": [...],
        "my_rank": 5,
        "my_ranking": {...},
        "promotion_zone": true,
        "time_remaining": {...},
        "week_start": "...",
        "week_end": "..."
    }
    """
    try:
        db = get_db()
        learner_oid = ObjectId(learner_id)

        # Get learner
        learner = db.collections.learners.find_one({'_id': learner_oid})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Ensure learner has required fields (backward compatibility)
        if 'total_xp' not in learner:
            db.collections.learners.update_one(
                {'_id': learner_oid},
                {'$set': {'total_xp': 0}}
            )
            learner['total_xp'] = 0
        
        if 'streak_count' not in learner:
            db.collections.learners.update_one(
                {'_id': learner_oid},
                {'$set': {'streak_count': 0}}
            )
            learner['streak_count'] = 0

        total_xp = learner.get('total_xp', 0)
        current_league = get_league_for_xp(total_xp)

        # Get leaderboard for this league
        week_start = get_start_of_week()
        week_end = week_start + timedelta(days=7) - timedelta(seconds=1)

        # Get all learners and filter by league (exclude mock users)
        all_learners = list(db.collections.learners.find(
            {'is_mock': {'$ne': True}},
            {'total_xp': 1, 'display_name': 1, 'streak_count': 1, 'profile_picture_url': 1, 'avatar_url': 1}
        ))
        learner_xp_map = {str(l['_id']): l.get('total_xp', 0) for l in all_learners}
        learner_info_map = {str(l['_id']): l for l in all_learners}

        # Aggregate weekly XP
        pipeline = [
            {'$match': {'date': {'$gte': week_start}}},
            {'$group': {
                '_id': '$learner_id',
                'weekly_xp': {'$sum': '$xp_earned'}
            }},
            {'$sort': {'weekly_xp': -1}}
        ]
        weekly_results = list(db.collections.daily_progress.aggregate(pipeline))
        weekly_xp_map = {str(r['_id']): r['weekly_xp'] for r in weekly_results}

        # Build league rankings
        league_rankings = []
        for learner_obj in all_learners:
            lid = str(learner_obj['_id'])
            l_xp = learner_obj.get('total_xp', 0)
            l_league = get_league_for_xp(l_xp)

            if l_league['id'] != current_league['id']:
                continue

            learner_info = learner_info_map.get(lid, {})
            display_name = learner_info.get('display_name', 'Anonymous')
            weekly_xp = weekly_xp_map.get(lid, 0)
            
            # Get profile picture (prefer avatar_url, fallback to profile_picture_url)
            avatar_url = learner_info.get('avatar_url') or learner_info.get('profile_picture_url') or ''

            league_rankings.append({
                'learner_id': lid,
                'display_name': display_name,
                'initials': get_user_initials(display_name),
                'weekly_xp': weekly_xp,
                'total_xp': l_xp,
                'streak': learner_info.get('streak_count', 0),
                'profile_picture_url': learner_info.get('profile_picture_url', ''),
                'avatar_url': learner_info.get('avatar_url', ''),
                'profile_image': avatar_url,  # Combined field for easy frontend use
                'is_current_user': lid == learner_id
            })

        # Sort by weekly XP and assign ranks
        league_rankings.sort(key=lambda x: x['weekly_xp'], reverse=True)
        my_rank = None
        my_ranking = None

        for i, ranking in enumerate(league_rankings):
            ranking['rank'] = i + 1
            if ranking['is_current_user'] or ranking['learner_id'] == learner_id:
                my_rank = i + 1
                my_ranking = ranking
                ranking['is_current_user'] = True

        # If user not found in league rankings (shouldn't happen, but handle edge case)
        if my_rank is None:
            my_rank = len(league_rankings) + 1
            learner_info = learner_info_map.get(learner_id, {})
            # Get profile picture
            avatar_url = learner.get('avatar_url') or learner.get('profile_picture_url') or ''
            my_ranking = {
                'learner_id': learner_id,
                'display_name': learner.get('display_name', 'Anonymous'),
                'initials': get_user_initials(learner.get('display_name', 'Anonymous')),
                'weekly_xp': 0,
                'total_xp': total_xp,
                'streak': learner.get('streak_count', 0),
                'profile_picture_url': learner.get('profile_picture_url', ''),
                'avatar_url': learner.get('avatar_url', ''),
                'profile_image': avatar_url,
                'rank': my_rank,
                'is_current_user': True
            }
            league_rankings.append(my_ranking)

        promotion_zone = my_rank <= 10 and len(league_rankings) >= 10

        # Ensure we always return at least the current user
        if not league_rankings:
            league_rankings = [my_ranking] if my_ranking else []

        return jsonify({
            'league': current_league,
            'rankings': league_rankings,
            'my_rank': my_rank or 1,
            'my_ranking': my_ranking,
            'promotion_zone': promotion_zone,
            'time_remaining': get_time_remaining(),
            'week_start': week_start.isoformat() + 'Z',
            'week_end': week_end.isoformat() + 'Z',
            'total_participants': max(1, len(league_rankings))
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@leaderboard_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200
