# msa-annual-eval

Morning Star Post Acute — Annual Performance Evaluation frontend.
Static HTML + Supabase. No build step. Deploys to GitHub Pages.

## Pages

| Path | Audience | Auth | Purpose |
|---|---|---|---|
| `/index.html` | Anyone | None | Landing page |
| `/r.html?t=TOKEN` | Department head (reviewer) | Token in URL | Submit feedback for a review cycle |
| `/thanks.html` | Reviewer | None | Post-submit confirmation |
| `/login.html` | Administrator | Email + password | Manager sign-in |
| `/admin.html` | Administrator | Session | Create cycles, invite reviewers, generate QR codes |
| `/m.html?c=CYCLE_ID` | Administrator | Session | Per-cycle dashboard: reviewer submissions, manager inputs, Claude consolidation package |

## Backend

Supabase project `pmnudshutxwidxdtouqj`, schema `hr_eval`.
Migrations live at `../migrations/` (one directory up from this folder).

Key RPCs:
- `lookup_invite(token)` — anonymous, returns subject info for the reviewer form
- `submit_feedback(...)` — anonymous, writes one `reviewer_feedback` row
- `create_cycle(...)` — manager only
- `invite_reviewer(...)` — manager only, returns token
- `generate_package(cycle_id)` — manager only, returns the Claude-ready markdown blob

Wage fields are **never** exposed through RPCs used by reviewers and are excluded from
`generate_package` by design.

## First-time setup

1. **Apply migrations** to Supabase (if not already done):
   - `../migrations/001_hr_eval_schema.sql`
   - `../migrations/002_hr_eval_rls_and_rpcs.sql`
   - `../migrations/003_hr_eval_seed.sql`
2. **Create an admin user** in Supabase → Authentication → Users. The email must match
   a row in `hr_eval.managers` (currently `stephen.badger@jerichocare.com`).
3. **Deploy** the contents of this folder to GitHub Pages:
   - `git init && git add . && git commit -m "Initial commit"`
   - Push to `https://github.com/<your-user>/msa-annual-eval`
   - In Settings → Pages, enable Pages from `main` branch / root
4. **Verify** — open `https://<user>.github.io/msa-annual-eval/` and sign in.

## Local development

No build needed. Any static file server works:

```sh
# Python
python3 -m http.server 8000

# Node (if you have npx)
npx serve .
```

Then open `http://localhost:8000/`.

## Config

Supabase URL and anon key are hard-coded in `assets/supabase.js`. The anon key is
public-safe — RLS and SECURITY DEFINER functions are what protect data. Never put the
service_role key in this repo.

## Security model

- Anonymous (reviewer) role can only call `lookup_invite` and `submit_feedback`. Both
  require a valid, unexpired, unused token. No other tables are readable without auth.
- Authenticated manager role (JWT email must be in `hr_eval.managers.active`) can access
  everything via RLS policies.
- Wage columns live in `hr_eval.manager_inputs`, never surfaced via any reviewer-facing
  function. Compensation is not included in the Claude consolidation package.
- Every state-changing action is written to `hr_eval.eval_audit_log`.
