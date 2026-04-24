from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form, Header, Query, Depends
from fastapi.responses import Response as FastAPIResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import logging
import uuid
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Config
APP_NAME = os.environ.get('APP_NAME', 'rpg-codex')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
ADMIN_EMAILS = [e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()]
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Storage session key (lazy init)
storage_key: Optional[str] = None


def init_storage() -> Optional[str]:
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_LLM_KEY:
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logging.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ============== Models ==============
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_admin: bool = False


class Stats(BaseModel):
    attack: Optional[int] = None
    defense: Optional[int] = None
    hp: Optional[int] = None
    mana: Optional[int] = None
    speed: Optional[int] = None
    level: Optional[int] = None
    rarity: Optional[str] = None


class EntryCreate(BaseModel):
    category: str  # tutorials, characters, craft, items, orbs
    subcategory: str  # heroes, weapons, etc.
    title: str
    description: str = ""
    image_url: Optional[str] = None
    youtube_url: Optional[str] = None
    stats: Dict[str, Any] = Field(default_factory=dict)
    is_featured: bool = False
    duration: Optional[str] = None  # for videos (e.g. "12:34")


class EntryUpdate(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    youtube_url: Optional[str] = None
    stats: Optional[Dict[str, Any]] = None
    is_featured: Optional[bool] = None
    duration: Optional[str] = None


class Entry(BaseModel):
    id: str
    category: str
    subcategory: str
    title: str
    description: str
    image_url: Optional[str] = None
    youtube_url: Optional[str] = None
    stats: Dict[str, Any] = Field(default_factory=dict)
    is_featured: bool = False
    duration: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str
    updated_at: str


# ============== Auth helpers ==============
async def get_session_token(request: Request, authorization: Optional[str] = Header(None)) -> Optional[str]:
    # Prefer cookie, fallback to Authorization
    token = request.cookies.get("session_token")
    if token:
        return token
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


async def current_user(request: Request, authorization: Optional[str] = Header(None)) -> Optional[dict]:
    token = await get_session_token(request, authorization)
    if not token:
        return None
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        return None
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    return user


async def require_user(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    user = await current_user(request, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_admin(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    user = await require_user(request, authorization)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


# ============== Auth routes ==============
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    # Exchange with Emergent Auth
    try:
        r = requests.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id}, timeout=15)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logging.error(f"Emergent auth exchange failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid session_id")

    email = data.get("email")
    name = data.get("name", "")
    picture = data.get("picture")
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=401, detail="Invalid auth response")

    # Upsert user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        update = {"name": name, "picture": picture}
        await db.users.update_one({"user_id": user_id}, {"$set": update})
        is_admin = existing.get("is_admin", False)
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        # First user in DB -> admin; or email in allowlist -> admin
        user_count = await db.users.count_documents({})
        is_admin = (user_count == 0) or (email.lower() in ADMIN_EMAILS)
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "is_admin": is_admin,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {
            "session_token": session_token,
            "user_id": user_id,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    # Set cookie (7 days)
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )

    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "is_admin": is_admin,
    }


@api_router.get("/auth/me")
async def auth_me(request: Request, authorization: Optional[str] = Header(None)):
    user = await current_user(request, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "picture": user.get("picture"),
        "is_admin": user.get("is_admin", False),
    }


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, authorization: Optional[str] = Header(None)):
    token = await get_session_token(request, authorization)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ============== Upload / Files ==============
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    ext = (file.filename or "bin").split(".")[-1].lower() if "." in (file.filename or "") else "bin"
    file_id = uuid.uuid4().hex
    path = f"{APP_NAME}/uploads/{user['user_id']}/{file_id}.{ext}"
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    result = put_object(path, data, content_type)
    await db.files.insert_one({
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": user["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {
        "id": file_id,
        "path": result["path"],
        "url": f"/api/files/{result['path']}",
    }


@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = get_object(path)
    except Exception as e:
        logging.error(f"Storage get failed: {e}")
        raise HTTPException(status_code=404, detail="File not retrievable")
    return FastAPIResponse(content=data, media_type=record.get("content_type", content_type))


# ============== Entries (Codex) ==============
def _serialize_entry(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@api_router.get("/entries")
async def list_entries(
    category: Optional[str] = Query(None),
    subcategory: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    limit: int = Query(100, le=500),
):
    query: Dict[str, Any] = {}
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    if featured is not None:
        query["is_featured"] = featured
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.entries.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    return items


@api_router.get("/entries/featured")
async def get_featured():
    doc = await db.entries.find_one(
        {"is_featured": True, "category": "characters"},
        {"_id": 0},
        sort=[("created_at", -1)],
    )
    if not doc:
        # Any featured entry
        doc = await db.entries.find_one({"is_featured": True}, {"_id": 0}, sort=[("created_at", -1)])
    return doc


@api_router.get("/entries/{entry_id}")
async def get_entry(entry_id: str):
    doc = await db.entries.find_one({"id": entry_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Entry not found")
    return doc


@api_router.post("/entries")
async def create_entry(payload: EntryCreate, user: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": uuid.uuid4().hex,
        **payload.model_dump(),
        "created_by": user["user_id"],
        "created_at": now,
        "updated_at": now,
    }
    await db.entries.insert_one(doc)
    return _serialize_entry(doc)


@api_router.put("/entries/{entry_id}")
async def update_entry(entry_id: str, payload: EntryUpdate, user: dict = Depends(require_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.entries.update_one({"id": entry_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    doc = await db.entries.find_one({"id": entry_id}, {"_id": 0})
    return doc


@api_router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str, user: dict = Depends(require_admin)):
    result = await db.entries.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}


# Stats / counts per subcategory (for sidebar badges)
@api_router.get("/stats/counts")
async def get_counts():
    pipeline = [
        {"$group": {"_id": {"category": "$category", "subcategory": "$subcategory"}, "count": {"$sum": 1}}}
    ]
    cursor = db.entries.aggregate(pipeline)
    counts: Dict[str, Dict[str, int]] = {}
    async for row in cursor:
        cat = row["_id"]["category"]
        sub = row["_id"]["subcategory"]
        counts.setdefault(cat, {})[sub] = row["count"]
    return counts


# ============== Dynamic JSON Data Sources ==============
_NAME_RE = re.compile(r"^[a-z0-9_-]+$")


@api_router.get("/data/{name}")
async def get_data_json(name: str):
    """Serve a JSON data source (e.g. items, characters, craft).
    Any file placed at /app/backend/data/{name}.json is auto-exposed.
    """
    if not _NAME_RE.match(name):
        raise HTTPException(status_code=400, detail="invalid name")
    p = DATA_DIR / f"{name}.json"
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"{name} data not found")
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Failed to read {p}: {e}")
        raise HTTPException(status_code=500, detail="failed to read data file")


@api_router.get("/data")
async def list_data_sources():
    sources = []
    for p in DATA_DIR.glob("*.json"):
        try:
            sources.append({"name": p.stem, "size": p.stat().st_size})
        except Exception:
            pass
    return {"sources": sources}


@api_router.put("/data/{name}")
async def put_data_json(name: str, file: UploadFile = File(...), user: dict = Depends(require_admin)):
    """Admin-only: replace the JSON data source. Supports future character.json etc."""
    if not _NAME_RE.match(name):
        raise HTTPException(status_code=400, detail="invalid name")
    data = await file.read()
    try:
        parsed = json.loads(data.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="invalid JSON")
    p = DATA_DIR / f"{name}.json"
    with open(p, "w", encoding="utf-8") as f:
        json.dump(parsed, f, ensure_ascii=False)
    return {"ok": True, "name": name, "size": p.stat().st_size}


@api_router.get("/")
async def root():
    return {"message": "RPG Codex API", "status": "online"}


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else [],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed on startup: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
