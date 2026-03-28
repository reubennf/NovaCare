from fastapi import APIRouter, HTTPException, Header
from app.schemas.missions import UserMissionResponse, PointsResponse, ItemResponse, PurchaseRequest, StreakResponse
from app.services.mission_service import (
    assign_daily_missions, complete_mission,
    get_user_points, award_points
)
from app.core.db import supabase
from datetime import date

router = APIRouter(prefix="/missions", tags=["missions"])

def get_user_id(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user.user.id

@router.get("/today", response_model=list[UserMissionResponse])
def get_todays_missions(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    # Auto-assign if not already done
    assign_daily_missions(user_id)
    result = supabase.table("user_missions")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("scheduled_for", str(date.today()))\
        .execute()
    return result.data

@router.post("/{mission_id}/complete")
def complete_user_mission(mission_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = complete_mission(mission_id, user_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/points", response_model=PointsResponse)
def get_points(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    total = get_user_points(user_id)
    transactions = supabase.table("points_ledger")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(20)\
        .execute()
    return {"total_points": total, "transactions": transactions.data}

@router.get("/streak", response_model=StreakResponse)
def get_streak(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("daily_streaks")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()
    if not result.data:
        return {"current_streak": 0, "longest_streak": 0, "last_completed_date": None}
    return result.data[0]

@router.get("/shop", response_model=list[ItemResponse])
def get_shop(authorization: str = Header(...)):
    get_user_id(authorization)
    result = supabase.table("item_catalog")\
        .select("*")\
        .eq("active", True)\
        .execute()
    return result.data

@router.post("/shop/purchase")
def purchase_item(payload: PurchaseRequest, authorization: str = Header(...)):
    user_id = get_user_id(authorization)

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
def get_inventory(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("user_items")\
        .select("*, item_catalog(*)")\
        .eq("user_id", user_id)\
        .execute()
    return result.data