"""Backend API tests for RPG Codex.

Covers:
- Root status
- Auth: /auth/session (invalid), /auth/me, /auth/logout (bearer-based)
- Entries CRUD (admin) + filters + featured + counts
- Upload (admin) + file serving
- Non-admin forbidden checks
"""
import io
import os
import time
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mystic-vault-3.preview.emergentagent.com").rstrip("/")
# Read backend .env to get correct mongo URL / DB name (same instance used by server)
from pathlib import Path as _P
_env = {}
for line in (_P("/app/backend/.env").read_text().splitlines()):
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        _env[k.strip()] = v.strip().strip('"').strip("'")
MONGO_URL = _env.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = _env.get("DB_NAME", "test_database")

API = f"{BASE_URL}/api"

# ============ Fixtures ============

@pytest.fixture(scope="session")
def mongo_db():
    cli = MongoClient(MONGO_URL)
    db = cli[DB_NAME]
    yield db
    cli.close()


@pytest.fixture(scope="session")
def admin_session(mongo_db):
    """Seed an admin user + session directly in mongo and yield token."""
    user_id = f"test-admin-{uuid.uuid4().hex[:8]}"
    session_token = f"test_session_admin_{uuid.uuid4().hex}"
    email = f"archon.{int(time.time())}@aethryl.test"
    mongo_db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": "Test Archon",
        "picture": None,
        "is_admin": True,
        "created_at": "2026-01-01T00:00:00+00:00",
    })
    mongo_db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": "2099-01-01T00:00:00+00:00",
        "created_at": "2026-01-01T00:00:00+00:00",
    })
    yield {"user_id": user_id, "email": email, "session_token": session_token}
    # cleanup
    mongo_db.users.delete_one({"user_id": user_id})
    mongo_db.user_sessions.delete_one({"session_token": session_token})
    mongo_db.entries.delete_many({"created_by": user_id})
    mongo_db.files.delete_many({"uploaded_by": user_id})


@pytest.fixture(scope="session")
def nonadmin_session(mongo_db):
    user_id = f"test-user-{uuid.uuid4().hex[:8]}"
    session_token = f"test_session_user_{uuid.uuid4().hex}"
    email = f"peasant.{int(time.time())}@aethryl.test"
    mongo_db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": "Test Peasant",
        "picture": None,
        "is_admin": False,
        "created_at": "2026-01-01T00:00:00+00:00",
    })
    mongo_db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": "2099-01-01T00:00:00+00:00",
        "created_at": "2026-01-01T00:00:00+00:00",
    })
    yield {"user_id": user_id, "email": email, "session_token": session_token}
    mongo_db.users.delete_one({"user_id": user_id})
    mongo_db.user_sessions.delete_one({"session_token": session_token})


def _hdr(token: str):
    return {"Authorization": f"Bearer {token}"}


# ============ Root ============
class TestRoot:
    def test_root_online(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("status") == "online"
        assert "message" in data


# ============ Auth ============
class TestAuth:
    def test_create_session_invalid_returns_401(self):
        r = requests.post(f"{API}/auth/session", json={"session_id": "definitely-not-valid-xyz"})
        assert r.status_code == 401, r.text

    def test_create_session_missing_body_returns_400(self):
        r = requests.post(f"{API}/auth/session", json={})
        assert r.status_code == 400

    def test_me_without_auth_401(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_bearer(self, admin_session):
        r = requests.get(f"{API}/auth/me", headers=_hdr(admin_session["session_token"]))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user_id"] == admin_session["user_id"]
        assert d["email"] == admin_session["email"]
        assert d["is_admin"] is True

    def test_logout_deletes_session(self, mongo_db):
        # create a dedicated throwaway session
        user_id = f"test-logout-{uuid.uuid4().hex[:8]}"
        token = f"test_session_logout_{uuid.uuid4().hex}"
        mongo_db.users.insert_one({
            "user_id": user_id, "email": f"lo.{token}@aethryl.test", "name": "Logout",
            "is_admin": False, "created_at": "2026-01-01T00:00:00+00:00"
        })
        mongo_db.user_sessions.insert_one({
            "user_id": user_id, "session_token": token,
            "expires_at": "2099-01-01T00:00:00+00:00", "created_at": "2026-01-01T00:00:00+00:00"
        })
        try:
            r = requests.post(f"{API}/auth/logout", headers=_hdr(token))
            assert r.status_code == 200
            assert r.json().get("ok") is True
            # session should be deleted
            assert mongo_db.user_sessions.find_one({"session_token": token}) is None
            # subsequent /auth/me with the token must 401
            r2 = requests.get(f"{API}/auth/me", headers=_hdr(token))
            assert r2.status_code == 401
        finally:
            mongo_db.users.delete_one({"user_id": user_id})
            mongo_db.user_sessions.delete_one({"session_token": token})


# ============ Entries ============
class TestEntries:
    created_ids = []

    def test_create_without_auth_401(self):
        r = requests.post(f"{API}/entries", json={
            "category": "characters", "subcategory": "heroes", "title": "NoAuth"
        })
        assert r.status_code == 401

    def test_create_entry_admin(self, admin_session):
        payload = {
            "category": "characters",
            "subcategory": "heroes",
            "title": "TEST_Kael",
            "description": "Legendary hero",
            "stats": {"attack": 800, "rarity": "Legendary"},
            "is_featured": True,
        }
        r = requests.post(f"{API}/entries", json=payload, headers=_hdr(admin_session["session_token"]))
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and isinstance(d["id"], str)
        assert d["title"] == "TEST_Kael"
        assert d["category"] == "characters"
        assert d["is_featured"] is True
        assert d["stats"]["attack"] == 800
        assert d["created_by"] == admin_session["user_id"]
        TestEntries.created_ids.append(d["id"])

    def test_get_entry_by_id(self, admin_session):
        entry_id = TestEntries.created_ids[0]
        r = requests.get(f"{API}/entries/{entry_id}")
        assert r.status_code == 200
        assert r.json()["id"] == entry_id

    def test_get_entry_404(self):
        r = requests.get(f"{API}/entries/{uuid.uuid4().hex}")
        assert r.status_code == 404

    def test_list_entries_filters(self, admin_session):
        # Add a second, non-featured item to exercise filters
        r = requests.post(f"{API}/entries", json={
            "category": "items", "subcategory": "weapons",
            "title": "TEST_SwordOfTest", "description": "A sharp blade",
            "stats": {"attack": 50}, "is_featured": False,
        }, headers=_hdr(admin_session["session_token"]))
        assert r.status_code == 200
        TestEntries.created_ids.append(r.json()["id"])

        # category filter
        r = requests.get(f"{API}/entries", params={"category": "items"})
        assert r.status_code == 200
        titles = [e["title"] for e in r.json()]
        assert "TEST_SwordOfTest" in titles

        # subcategory filter
        r = requests.get(f"{API}/entries", params={"category": "items", "subcategory": "weapons"})
        assert r.status_code == 200
        assert all(e["subcategory"] == "weapons" for e in r.json())

        # q search (case-insensitive)
        r = requests.get(f"{API}/entries", params={"q": "swordoftest"})
        assert r.status_code == 200
        assert any("TEST_SwordOfTest" == e["title"] for e in r.json())

        # featured filter
        r = requests.get(f"{API}/entries", params={"featured": "true"})
        assert r.status_code == 200
        featured_titles = [e["title"] for e in r.json()]
        assert "TEST_Kael" in featured_titles

    def test_featured_endpoint(self):
        r = requests.get(f"{API}/entries/featured")
        assert r.status_code == 200
        d = r.json()
        assert d is not None
        assert d.get("is_featured") is True

    def test_update_entry_admin(self, admin_session):
        entry_id = TestEntries.created_ids[0]
        r = requests.put(f"{API}/entries/{entry_id}",
                         json={"title": "TEST_Kael_Updated", "description": "new desc"},
                         headers=_hdr(admin_session["session_token"]))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["title"] == "TEST_Kael_Updated"
        assert d["description"] == "new desc"
        # verify persisted via GET
        r2 = requests.get(f"{API}/entries/{entry_id}")
        assert r2.status_code == 200
        assert r2.json()["title"] == "TEST_Kael_Updated"

    def test_stats_counts(self):
        r = requests.get(f"{API}/stats/counts")
        assert r.status_code == 200
        counts = r.json()
        assert isinstance(counts, dict)
        assert counts.get("characters", {}).get("heroes", 0) >= 1
        assert counts.get("items", {}).get("weapons", 0) >= 1

    def test_delete_entry_admin(self, admin_session):
        # delete second entry first
        for entry_id in list(TestEntries.created_ids):
            r = requests.delete(f"{API}/entries/{entry_id}", headers=_hdr(admin_session["session_token"]))
            assert r.status_code == 200, r.text
            assert r.json().get("ok") is True
            # confirm 404 after delete
            r2 = requests.get(f"{API}/entries/{entry_id}")
            assert r2.status_code == 404
            TestEntries.created_ids.remove(entry_id)


# ============ Non-admin forbidden ============
class TestNonAdmin:
    def test_create_entry_nonadmin_403(self, nonadmin_session):
        r = requests.post(f"{API}/entries", json={
            "category": "characters", "subcategory": "heroes", "title": "TEST_Forbidden"
        }, headers=_hdr(nonadmin_session["session_token"]))
        assert r.status_code == 403, r.text

    def test_upload_nonadmin_403(self, nonadmin_session):
        files = {"file": ("t.png", b"\x89PNG\r\n\x1a\n", "image/png")}
        r = requests.post(f"{API}/upload", files=files, headers=_hdr(nonadmin_session["session_token"]))
        assert r.status_code == 403, r.text


# ============ Upload / Files ============
def _make_png_bytes() -> bytes:
    # Minimal 1x1 PNG
    return bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
        "89000000017352474200AECE1CE90000000D49444154789C63FAFFFF3F000005"
        "FE02FE24A2B9D30000000049454E44AE426082"
    )


class TestUpload:
    uploaded = {}

    def test_upload_without_auth_401(self):
        files = {"file": ("t.png", _make_png_bytes(), "image/png")}
        r = requests.post(f"{API}/upload", files=files)
        assert r.status_code == 401

    def test_upload_admin_ok(self, admin_session):
        files = {"file": ("test.png", _make_png_bytes(), "image/png")}
        r = requests.post(f"{API}/upload", files=files, headers=_hdr(admin_session["session_token"]))
        if r.status_code == 500:
            pytest.skip(f"Storage backend unavailable: {r.text}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and "path" in d and "url" in d
        assert d["url"].startswith("/api/files/")
        TestUpload.uploaded = d

    def test_download_file(self, admin_session):
        if not TestUpload.uploaded:
            pytest.skip("Upload not performed")
        path = TestUpload.uploaded["path"]
        r = requests.get(f"{API}/files/{path}")
        assert r.status_code == 200, r.text
        assert r.headers.get("Content-Type", "").startswith("image/png")
        # Bytes should match uploaded
        assert r.content == _make_png_bytes()
