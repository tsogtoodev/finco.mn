# Phase 1 — Collections, roles, and the news proof-of-concept

Click-through guide for the Directus admin at `https://cms.finco.design`, matching
Sections 5–6 of `../directus-cms-replacement-plan.md`. Do these in order; each step
builds on the previous one.

> **Automated path:** `setup-phase1.mjs` performs §1–§4 via the Directus API
> (idempotent, safe to re-run). Run it, then use this document as the reference
> for what was created — and run §5 (the permission gate) and §6 (snapshot)
> manually; those cannot be skipped.
>
> ```bash
> DIRECTUS_URL=https://cms.finco.design \
> DIRECTUS_TOKEN=<admin static token> \
> node directus/setup-phase1.mjs --with-test-users
> ```

Directus version: 11.x (UI paths below match the pinned image in docker-compose.yml).

---

## 1. `languages` collection

**Settings → Data Model → Create Collection** (the `+`):

- Name: `languages`
- Primary key: **Manually entered string**, field name `code`
- Skip all optional system fields (no status/sort/dates needed) → Save

Add one field:

- `name` — Input, required. (Skip direction/flags — not needed.)

Then **Content → languages → Create Item** twice:

| code | name    |
|------|---------|
| `mn` | Монгол  |
| `en` | English |

`mn` is the site default; keep these two only.

## 2. `news` collection

**Settings → Data Model → Create Collection**:

- Name: `news`
- Primary key: **Generated UUID** (`id`)
- Optional system fields — check ALL of:
  - **Status** (draft/published/archived) — this also wires archive behavior
  - **Created On**, **Created By**, **Updated On**, **Updated By**
  - (skip Sort — news orders by date, not manual sort)

Add fields (Create Field):

| Field | Interface | Settings |
|---|---|---|
| `slug` | Input | Required. Options → turn on **Slugify**. Validation: unique. Note: "Shared across languages. Never change after publish — it is the public URL." |
| `published_at` | Datetime | Required. Display as date. |
| `image` | Image | Single file. Note: "Card/hero image. Uploads go to R2." |
| `external_url` | Input | Optional. Validation: URL. Note: "If set, the card links out instead of a detail page." |
| `translations` | **Translations** | Languages collection: `languages`, language indicator field: `code`. Accept the auto-created junction collection **`news_translations`**. |

The Translations interface creates `news_translations` (with `news_id` + `languages_code`)
automatically — that is collection #3 of the plan's 17-collection budget.

### 2a. Fields on `news_translations`

**Settings → Data Model → news_translations** (it's visible under news or via "show hidden"):

| Field | Interface | Settings |
|---|---|---|
| `title` | Input | Required |
| `summary` | Textarea | Required. Note: "Shown on cards and in meta description." |
| `body` | **Markdown** | Required. (Markdown, NOT WYSIWYG — the frontend renders Markdown.) |

### 2b. Enable content versioning

**Settings → Data Model → news → (collection settings, gear/edit) → enable "Content Versioning"** → Save.
This is what lets editors change published items via named versions without touching the live record.

### 2c. Display niceties (optional but do them)

- news collection → Display Template: `{{translations}}` or `{{slug}}`
- news_translations → Display Template: `{{title}}`

> **Preview URL:** leave unset for now. It points at a Nuxt preview endpoint that gets
> built in Phase 3 (`/api/cms/preview`). Configure it then.

## 3. Access policies

Directus 11 separates **policies** (permission bundles) from **roles** (what users hold).
Build two policies, then two roles.

**Settings → Access Policies → Create Policy**

### Policy: `Editor Policy`

- App Access: **ON**. Admin Access: OFF.
- Permissions (Add Collection):

| Collection | Create | Read | Update | Delete |
|---|---|---|---|---|
| `news` | ✅ Custom — **field permissions: all fields EXCEPT `status`** | ✅ All | ✅ Custom — item rule **`status equals draft`** AND field permissions exclude `status` | ❌ |
| `news_translations` | ✅ All | ✅ All | ✅ Custom — no item rule needed if parent rule holds, but mirror it if editors bypass via API: rule `news_id.status equals draft` | ❌ |
| `languages` | ❌ | ✅ All | ❌ | ❌ |
| `directus_files` | ✅ (upload) | ✅ All | ✅ own uploads only (rule: `uploaded_by equals $CURRENT_USER`) | ❌ |
| `directus_versions` | ✅ | ✅ | ✅ Custom — rule `user_created equals $CURRENT_USER` | ❌ |

Net effect: Editor drafts freely, edits only drafts directly, changes published items
ONLY through content versions, and can never write `status` (so can never publish),
never deletes anything.

### Policy: `Publisher Policy`

- App Access: **ON**. Admin Access: OFF.
- Permissions:

| Collection | Create | Read | Update | Delete |
|---|---|---|---|---|
| `news` | ✅ All | ✅ All | ✅ All fields **including `status`** | ❌ (archive via status instead — plan default) |
| `news_translations` | ✅ All | ✅ All | ✅ All | ❌ |
| `languages` | ❌ | ✅ | ❌ | ❌ |
| `directus_files` | ✅ | ✅ All | ✅ All | ✅ |
| `directus_versions` | ✅ | ✅ All | ✅ All | ✅ |

Publisher promotes versions (promotion applies the version to the main record using
their `news` update permission — which includes `status` and published items).

## 4. Roles

**Settings → User Roles → Create Role**:

1. Role `Editor` → attach `Editor Policy`
2. Role `Publisher` → attach `Publisher Policy`

(Administrator role already exists — that's your account. 3 accounts total = the Core seat limit.)

Create the two real user accounts later, at UAT (Phase 4). For testing now, you can
make throwaway `editor-test` / `publisher-test` users — but DELETE them before adding
real editors, or you'll exceed the 3-seat limit.

## 5. The proof-of-concept test (the plan's Gate 4)

Create a test article as Admin: slug `test-article`, a date, both `mn` and `en`
translations, status **draft**. Then, logged in as a test Editor account, verify EVERY
row of this table — this is the gate the whole migration hinges on:

| # | Action as Editor | Expected |
|---|---|---|
| 1 | Create a new news item | Works; status is `draft` and the status field is not editable |
| 2 | Edit the draft's translations | Works |
| 3 | Try to set status → published (UI or API) | **Denied / field not writable** |
| 4 | Ask Publisher (2nd test login) to publish it | Works; status → published |
| 5 | As Editor, edit the now-published item directly | **Denied** (item rule `status = draft`) |
| 6 | As Editor, create a content **version** on it, edit, save | Works; public/main record unchanged |
| 7 | As Editor, try to **promote** the version | **Denied** |
| 8 | As Publisher, compare + promote the version | Works; main record updates |
| 9 | As Editor, try to delete anything | **Denied** |
| 10 | Unauthenticated API call `GET https://cms.finco.design/items/news` | **403** — no public read (public role has no permissions) |

If row 3, 5, 7, or 10 fails, STOP and fix the policy before building any more schema —
per the plan (§6): do not weaken the publishing boundary to make a test pass.

## 6. Snapshot the schema (do this after the gate passes)

On the VPS:

```bash
cd /home/finco/directus
docker compose exec directus npx directus schema snapshot /directus/database/schema.yaml --yes
sudo mv database/schema.yaml ./schema.yaml && sudo chown finco:finco schema.yaml
```

Then copy `schema.yaml` back into the repo's `directus/` folder (rsync it down) and commit.
From now on, every approved schema change gets a fresh snapshot + a reviewed diff —
`schema.yaml` is the authoritative schema record (plan §14).

---

**Exit criteria (plan Phase 1):** all 10 test rows pass, snapshot committed.
**Next (Phase 2):** remaining 14 collections + the seed script that imports the 70 content files.
