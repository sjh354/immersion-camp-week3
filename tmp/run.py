from datetime import datetime
from flask import Flask, jsonify, request
import json

app = Flask(__name__)

with open("./top.json", "r", encoding="utf-8") as f:
    top = json.load(f)
with open("./bottom.json", "r", encoding="utf-8") as f:
    bottom = json.load(f)
with open("./outer.json", "r", encoding="utf-8") as f:
    outer = json.load(f)


def now_iso():
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"

@app.route("/api/test")
def index():
    return "Hello, World!"


@app.route("/api/v1/auth/google", methods=["POST"])
def auth_google():
    body = request.get_json(silent=True) or {}
    is_new = body.get("idToken", "").endswith("new")
    return jsonify(
        {
            "accessToken": "demo-access-token",
            "refreshToken": "demo-refresh-token",
            "isNewMember": is_new,
        }
    )


@app.route("/api/v1/auth/refresh", methods=["POST"])
def auth_refresh():
    return jsonify(
        {
            "accessToken": "demo-access-token-refreshed",
            "refreshToken": "demo-refresh-token-refreshed",
        }
    )


@app.route("/api/v1/members/check", methods=["GET"])
def members_check():
    nickname = request.args.get("nickname", "")
    return jsonify({"isAvailable": nickname != "멋쟁이토마토"})


@app.route("/api/v1/members/onboarding", methods=["POST"])
def members_onboarding():
    body = request.get_json(silent=True) or {}
    return jsonify(
        {"id": 1, "nickname": body.get("nickname", "demo"), "email": "demo@example.com"}
    )


@app.route("/api/v1/members/me", methods=["GET"])
def members_me():
    return jsonify(
        {
            "id": 1,
            "email": "demo@example.com",
            "nickname": "코디천재",
            "winCount": 3,
            "lossCount": 1,
            "deck": [
                {
                    "outfitId": 50,
                    "outfitName": "오늘의 힙합 룩",
                    "previewUrl": "https://replicate.delivery/yhqm/XWNoF6wUGFofQygUWpfp5XHnem3kt0o5caxfuAUCs9ofrfHgF/output.jpg",
                },
                {
                    "outfitId": 51,
                    "outfitName": "캐주얼 데일리",
                    "previewUrl": "https://replicate.delivery/yhqm/TEFH0dwwjH5gMphcOZfwIq60Xta7EyEn4ofotw9KtA7gefBYB/output.jpg",
                },
            ],
        }
    )


@app.route("/api/v1/members/me", methods=["PATCH"])
def members_update():
    body = request.get_json(silent=True) or {}
    return jsonify({"nickname": body.get("nickname", "demo"), "updatedAt": now_iso()})


@app.route("/api/v1/auth/logout", methods=["POST"])
def auth_logout():
    return jsonify({"message": "로그아웃 되었습니다."})


@app.route("/api/v1/clothes/categories", methods=["GET"])
def clothes_categories():
    return jsonify({"categories": ["TOP", "BOTTOM"]})


@app.route("/api/v1/clothes", methods=["GET"])
def clothes_list():
    page = request.args.get("page", 0, type=int)
    size = request.args.get("size", 20, type=int)
    category = request.args.get("category", "TOP")
    return top if category == "TOP" else bottom if category == "BOTTOM" else outer if category == "OUTER" else top + bottom + outer

@app.route("/api/v1/clothes/search", methods=["GET"])
def clothes_search():
    keyword = request.args.get("keyword", "").lower()
    category = request.args.get("category", "ALL")
    if category == "TOP":
        total_items = top
    elif category == "BOTTOM":
        total_items = bottom
    elif category == "OUTER":
        total_items = outer
    else:
        total_items = top + bottom + outer
    filtered_items = [item for item in total_items if keyword in item["name"].lower()]
    return filtered_items


@app.route("/api/v1/images/upload", methods=["POST"])
def images_upload():
    return jsonify(
        {"imageUrl": "https://example.com/temp/outfit_preview_123.png"}
    )

@app.route("/api/v1/outfits", methods=["POST"])
def outfits_create():
    return jsonify({"id": 50, "message": "코디가 성공적으로 저장되었습니다."})


@app.route("/api/v1/outfits", methods=["GET"])
def outfits_list():
    return jsonify(
        [
            {
                "id": 50,
                "name": "오늘의 힙합 룩",
                "previewUrl": "https://replicate.delivery/yhqm/XWNoF6wUGFofQygUWpfp5XHnem3kt0o5caxfuAUCs9ofrfHgF/output.jpg",
                "topId": 101,
                "bottomId": 202,
                "createdAt": "2026-01-24T13:30:00",
            },
            {
                "id": 51,
                "name": "캐주얼 데일리",
                "previewUrl": "https://replicate.delivery/yhqm/TEFH0dwwjH5gMphcOZfwIq60Xta7EyEn4ofotw9KtA7gefBYB/output.jpg",
                "topId": 102,
                "bottomId": 203,
                "createdAt": "2026-01-24T13:40:00",
            },
        ]
    )


@app.route("/api/v1/outfits/<int:outfit_id>", methods=["DELETE"])
def outfits_delete(outfit_id):
    return jsonify({"message": "코디가 성공적으로 삭제되었습니다."})


@app.route("/api/v1/battle/match/start", methods=["POST"])
def battle_match_start():
    return jsonify({"status": "MATCHING", "queuedAt": "2026-01-24T13:40:00"})


@app.route("/api/v1/battle/match/cancel", methods=["POST"])
def battle_match_cancel():
    return jsonify({"message": "매칭이 취소되었습니다."})


@app.route("/api/v1/battle/match/status", methods=["GET"])
def battle_match_status():
    return jsonify({"status": "MATCHED", "sessionId": 505})


@app.route("/api/v1/battle/<int:session_id>", methods=["GET"])
def battle_session(session_id):
    return jsonify(
        {
            "sessionId": session_id,
            "opponent": {"id": 2, "nickname": "코디왕", "winCount": 15},
            "status": "ROUND1",
            "currentRound": 1,
            "hostOutfitA": {"id": 10, "previewUrl": "https://example.com/hostA.png"},
            "guestOutfitA": {"id": 20, "previewUrl": "https://example.com/guestA.png"},
        }
    )


@app.route("/api/v1/battle/round/submit", methods=["POST"])
def battle_round_submit():
    return jsonify(
        {
            "message": "멘트가 정상적으로 제출되었습니다.",
            "submittedAt": "2026-01-24T13:42:00",
        }
    )


@app.route("/api/v1/battle/result/<int:session_id>", methods=["GET"])
def battle_result(session_id):
    return jsonify(
        {
            "winnerId": 1,
            "roundResults": [
                {
                    "roundNum": 1,
                    "aiJudgement": "두 분 다 패션 감각이 파격적이네요. 특히...",
                    "isSuccess": False,
                }
            ],
        }
    )


@app.route("/api/v1/chat/<int:session_id>", methods=["GET"])
def chat_history(session_id):
    return jsonify(
        [
            {
                "id": 1001,
                "senderId": 1,
                "senderNickname": "패션피플",
                "content": "이 옷 어때요? 제가 제일 아끼는 거예요!",
                "type": "TALK",
                "sentAt": "2026-01-24T13:45:00",
            },
            {
                "id": 1002,
                "senderId": None,
                "senderNickname": "SYSTEM",
                "content": "AI 심사가 시작되었습니다. 잠시만 기다려주세요.",
                "type": "NOTICE",
                "sentAt": "2026-01-24T13:46:10",
            },
        ]
    )


@app.route("/api/v1/posts", methods=["POST"])
def posts_create():
    return jsonify({"postId": 101, "message": "게시글이 성공적으로 등록되었습니다."})


@app.route("/api/v1/posts", methods=["GET"])
def posts_feed():
    return jsonify(
        [
            {
                "postId": 101,
                "nickname": "코디천재",
                "previewUrl": "https://example.com/preview1.png",
                "content": "이 코디 정말 추천해요!",
                "likeCount": 15,
                "commentCount": 3,
                "isLiked": True,
                "createdAt": "2026-01-24T13:40:00",
            }
        ]
    )


@app.route("/api/v1/posts/me", methods=["GET"])
def posts_me():
    return posts_feed()


@app.route("/api/v1/posts/<int:post_id>", methods=["GET"])
def posts_detail(post_id):
    return jsonify(
        {
            "postId": post_id,
            "nickname": "코디천재",
            "content": "이 코디 정말 추천해요!",
            "outfitDetail": {
                "id": 50,
                "previewUrl": "https://example.com/preview1.png",
                "topName": "화이트 셔츠",
            },
            "comments": [
                {
                    "commentId": 1,
                    "nickname": "패션비평가",
                    "content": "셔츠 정보 좀 부탁드려요!",
                    "createdAt": "2026-01-24T13:45:00",
                }
            ],
        }
    )


@app.route("/api/v1/posts/<int:post_id>/like", methods=["POST"])
def posts_like(post_id):
    return jsonify({"isLiked": True, "totalLikeCount": 16})


@app.route("/api/v1/posts/<int:post_id>/comments", methods=["POST"])
def posts_comment(post_id):
    return jsonify(
        {"commentId": 5, "nickname": "현유저", "content": "정말 멋지네요!"}
    )


if __name__ == "__main__":
    app.run(debug=True)
