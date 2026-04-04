from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.schemas.missions import UserMissionResponse, PointsResponse, ItemResponse, PurchaseRequest, StreakResponse
from app.services.mission_service import (
    assign_daily_missions, complete_mission,
    get_user_points, award_points
)
from app.core.db import supabase
from datetime import date
from app.core.auth import get_current_user_id

router = APIRouter(prefix="/missions", tags=["missions"])


@router.get("/today", response_model=list[UserMissionResponse])
def get_todays_missions(user_id: str = Depends(get_current_user_id)):
    # Auto-assign if not already done
    assign_daily_missions(user_id)
    result = supabase.table("user_missions")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("scheduled_for", str(date.today()))\
        .execute()
    return result.data

@router.post("/{mission_id}/complete")
def complete_user_mission(mission_id: str, user_id: str = Depends(get_current_user_id)):
    result = complete_mission(mission_id, user_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/points", response_model=PointsResponse)
def get_points(user_id: str = Depends(get_current_user_id)):
    total = get_user_points(user_id)
    transactions = supabase.table("points_ledger")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(20)\
        .execute()
    return {"total_points": total, "transactions": transactions.data}

@router.get("/streak", response_model=StreakResponse)
def get_streak(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("daily_streaks")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()
    if not result.data:
        return {"current_streak": 0, "longest_streak": 0, "last_completed_date": None}
    return result.data[0]

@router.get("/shop", response_model=list[ItemResponse])
def get_shop(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("item_catalog")\
        .select("*")\
        .eq("active", True)\
        .execute()
    return result.data

@router.post("/shop/purchase")
def purchase_item(payload: PurchaseRequest, user_id: str = Depends(get_current_user_id)):

    # Get item
    item = supabase.table("item_catalog")\
        .select("*")\
        .eq("id", payload.item_id)\
        .single()\
        .execute()
    if not item.data:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check points balance
    total_points = get_user_points(user_id)
    if total_points < item.data["point_cost"]:
        raise HTTPException(status_code=400, detail=f"Not enough points. Need {item.data['point_cost']}, have {total_points}")

    # Deduct points
    award_points(
        user_id=user_id,
        points=-item.data["point_cost"],
        source_type="reward",
        source_id=item.data["id"],
        note=f"Purchased: {item.data['name']}"
    )

    # Add to inventory
    existing = supabase.table("user_items")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("item_id", payload.item_id)\
        .execute()

    if existing.data:
        supabase.table("user_items").update({
            "quantity": existing.data[0]["quantity"] + 1
        }).eq("id", existing.data[0]["id"]).execute()
    else:
        supabase.table("user_items").insert({
            "user_id": user_id,
            "item_id": payload.item_id,
            "quantity": 1
        }).execute()

    return {
        "message": f"Purchased {item.data['name']}!",
        "points_spent": item.data["point_cost"],
        "points_remaining": total_points - item.data["point_cost"]
    }

@router.get("/inventory")
def get_inventory(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("user_items")\
        .select("*, item_catalog(*)")\
        .eq("user_id", user_id)\
        .execute()
    return result.data

class BonusPoints(BaseModel):
    points: int

@router.post("/award-bonus")
def award_bonus_points(payload: BonusPoints, user_id: str = Depends(get_current_user_id)):
    award_points(
        user_id=user_id,
        points=payload.points,
        source_type="mission",
        note="Mission completion bonus reward"
    )
    return {"message": f"Awarded {payload.points} bonus points"}

@router.get("/leaderboard")
def get_leaderboard(user_id: str = Depends(get_current_user_id)):
    """Get points leaderboard for all users."""
    # Get all profiles
    profiles = supabase.table("profiles")\
        .select("id, preferred_name, full_name, avatar_url")\
        .execute()

    if not profiles.data:
        return {"leaderboard": [], "user_rank": 0, "league": "Bronze"}

    # Get points for each user
    leaderboard = []
    for profile in profiles.data:
        pid = profile["id"]
        points_res = supabase.table("points_ledger")\
            .select("points_delta")\
            .eq("user_id", pid)\
            .execute()
        total = sum(r["points_delta"] for r in (points_res.data or []))
        if total > 0:
            leaderboard.append({
                "user_id": pid,
                "name": profile.get("preferred_name") or profile.get("full_name") or "User",
                "avatar_url": profile.get("avatar_url"),
                "points": total
            })

    # Sort by points
    leaderboard.sort(key=lambda x: x["points"], reverse=True)

    # Add ranks
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    # Find current user rank
    user_rank = next((e["rank"] for e in leaderboard if e["user_id"] == user_id), 0)
    user_points = next((e["points"] for e in leaderboard if e["user_id"] == user_id), 0)

    # Determine league based on points
    if user_points >= 1000:
        league = "Ruby"
    elif user_points >= 500:
        league = "Gold"
    elif user_points >= 200:
        league = "Silver"
    else:
        league = "Bronze"

    return {
        "leaderboard": leaderboard,
        "user_rank": user_rank,
        "league": league,
        "user_points": user_points
    }