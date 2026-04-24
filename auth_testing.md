# Auth-Gated App Testing Playbook (Emergent Google Auth)

## Step 1 — Create Test User & Session in Mongo
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'archon.' + Date.now() + '@aethryl.test',
  name: 'Test Archon',
  picture: 'https://via.placeholder.com/150',
  is_admin: true,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('USER_ID=' + userId);
print('SESSION_TOKEN=' + sessionToken);
"
```

## Step 2 — Backend API with Bearer
```bash
curl -s -X GET "$REACT_APP_BACKEND_URL/api/auth/me" -H "Authorization: Bearer $SESSION_TOKEN"
curl -s -X POST "$REACT_APP_BACKEND_URL/api/entries" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"characters","subcategory":"heroes","title":"Kael","description":"","stats":{"attack":800,"rarity":"Legendary"},"is_featured":true}'
curl -s "$REACT_APP_BACKEND_URL/api/entries?category=characters"
```

## Step 3 — Browser with cookie (playwright)
```python
await context.add_cookies([{
    "name": "session_token",
    "value": SESSION_TOKEN,
    "domain": "mystic-vault-3.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto(REACT_APP_BACKEND_URL)
```

## Cleanup
```bash
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /@aethryl\.test/});
db.user_sessions.deleteMany({session_token: /test_session/});
db.entries.deleteMany({title: 'Kael'});
"
```

## Endpoints Summary
- POST `/api/auth/session` — body `{session_id}` — returns user & sets cookie
- GET `/api/auth/me` — current user from cookie/bearer (401 if not authed)
- POST `/api/auth/logout`
- POST `/api/upload` — multipart, admin-only
- GET `/api/files/{path:path}`
- GET `/api/entries?category=&subcategory=&q=&featured=&limit=`
- GET `/api/entries/featured`
- GET `/api/entries/{id}`
- POST `/api/entries` (admin)
- PUT `/api/entries/{id}` (admin)
- DELETE `/api/entries/{id}` (admin)
- GET `/api/stats/counts`

## Admin rule
First user to log in via Google = auto-admin. `ADMIN_EMAILS` env allowlist also grants admin.
