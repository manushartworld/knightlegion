# Aethryl Codex — PRD

## Original Problem Statement
Full-stack RPG Codex / Wiki website with a fantasy MMORPG-style interface (Knight Online / Diablo aesthetic). Dark theme with gold/blue/purple accents, cinematic fog background, RPG UI frames with corner ornaments, glow hover effects, collapsible left sidebar, top nav (News/Forums/Library/Account), main hero with search, 4 category cards, Featured Hero with stats, Video Tutorials grid (YouTube embed). Admin can CRUD entries (title, image, description, stats). Data in MongoDB.

## User Choices (2026-02-24)
- Auth: **Emergent Google social login** (first signed-in user auto-admin; `ADMIN_EMAILS` env allowlist)
- Seeding: **Empty** — admin inscribes all content
- Video: **YouTube embed only**
- Images: **Full upload via Emergent Object Storage**
- Aesthetic: Knight Online MMORPG + Diablo gothic

## Architecture
- **Backend**: FastAPI (`/api` prefix) + Motor (Mongo). Emergent Auth session exchange, cookie + Bearer support. Emergent Object Storage (lazy init) for uploads; files served via `/api/files/{path:path}`.
- **Frontend**: React 19 + React Router. `AuthProvider` global context, `AppRouter` intercepts `session_id=` URL fragment → `AuthCallback`. Layout with TopNav + collapsible Sidebar + outlet. `Home`, `Category`, `EntryDetail`, `Admin`, `Login`, `News/Forums/Library/Account` placeholders.
- **Styling**: Tailwind + custom CSS `rpg-frame` class with corner pseudo-elements, ember particles (pure CSS keyframes), Cinzel (headings) + Outfit (body) Google Fonts, `.rune-btn`, `.stat-bar-*`.

## Data Model
- `users`: `user_id`, `email`, `name`, `picture`, `is_admin`, `created_at`
- `user_sessions`: `user_id`, `session_token`, `expires_at` (7d)
- `entries`: `id`, `category`, `subcategory`, `title`, `description`, `image_url`, `youtube_url`, `duration`, `stats{}`, `is_featured`, `created_by`, timestamps
- `files`: `id`, `storage_path`, `original_filename`, `content_type`, `size`, `uploaded_by`, `is_deleted`

## API Endpoints
Auth: `POST /api/auth/session`, `GET /api/auth/me`, `POST /api/auth/logout`
Entries: `GET/POST /api/entries`, `GET /api/entries/featured`, `GET/PUT/DELETE /api/entries/{id}`, `GET /api/stats/counts`
Files: `POST /api/upload` (admin), `GET /api/files/{path:path}`

## Implemented (2026-02-24)
- Dark MMORPG theme with RPG UI frames, embers, cinematic castle hero
- Collapsible left sidebar with 5 category groups and 12 subcategory routes
- Global search with live debounced dropdown
- Featured Hero panel with animated stat bars
- Video Tutorials grid with YouTube modal embed
- Category listing pages with filters (name + rarity) and responsive grid
- Entry Detail page with stats, video embed, admin Edit/Delete
- Admin panel (table + create/edit form with image upload)
- Emergent Google Auth end-to-end (session exchange → cookie + DB session)
- Object storage uploads admin-only
- Backend test suite: 20/20 passed (100%)

## P1 Backlog
- News / Forums / Library real pages (now placeholders)
- Entry pagination + infinite scroll when >100 entries
- Admin: bulk delete, filter by subcategory/rarity, import CSV
- Account page: show user's inscribed entries, activity log
- Comments & reactions per entry (community layer)
- Replace polling with SWR/React Query
- Category enum validation on backend

## P2 Backlog
- Particles via tsparticles for richer embers
- Tome flip-page transition on entry navigation
- Realm map / lore timeline
- Dark gothic sound effects (hover/click)
- OG share cards for entries (social hook)

## Next Action Items
- Invite user to sign in with Google to auto-claim Archon (admin) rank
- Seed first few heroes/weapons/videos from admin panel
- Wire up News/Forums once content cadence is defined

## Update — 2026-02-24 · JSON-driven Items + Bordeaux theme
- **Theme**: Full palette shift to dark fantasy bordeaux. `--bordeaux #6b1f2b`, `--bordeaux-bright #a83246`, bg `#0b0b10`. All purple (#8B5CF6) and arcane-blue (#3B82F6) references removed from every component and CSS file. Gold (#D4AF37) kept as the ornamental accent.
- **Dynamic data layer**: Added `GET /api/data/{name}`, `GET /api/data`, `PUT /api/data/{name}` (admin multipart). Drop any JSON at `/app/backend/data/{name}.json` and it's auto-exposed. `items.json` (3.1 MB, 656 groups) pre-seeded from the user's upload.
- **Items system**: `/c/items/:sub` now routes to `ItemsCategory.jsx` which fetches `/api/data/items` via `useJsonData` hook, flattens the grouped structure, and renders one card per base item. Filters: search, grade, type, permitted class — options auto-derived from the JSON. Click → `ItemDetailModal` shows every field (including zeros) plus all enchantment tiers side-by-side. Fully data-driven: add a new key to items.json and it appears.
- **Subcategory mapping** (items.json top keys → sidebar subs): weapons←weaponItems, armors←armorItems+shieldItems, accessories←WebAccessoriesEnchants, skins←skinItems, materials←generalItems.
- **Ready for future**: `useJsonData('characters')` / `useJsonData('craft')` already works — just drop the file in `/app/backend/data/`.
- **Stylised icon tiles**: `ItemIconTile` picks a Lucide icon by type regex and tints by grade (gold=Unique, bordeaux=Legendary, etc.). No external art required.
