# Self-hosted Supabase (OpenShip / homelab) — deployment runbook

Veritas SynapseCore is connected to the **OpenShip self-hosted Supabase stack** on the
homelab (`192.168.1.42`), not to a hosted Supabase project. This file documents how the
connection is wired so it can be re-applied after a stack rebuild.

## Endpoints

| Piece | Value |
|---|---|
| Supabase API (Kong) | `http://192.168.1.42:8000` |
| Postgres | `192.168.1.42:5433` (user `postgres`) |
| Studio | `http://192.168.1.42:3003` |
| Anon (publishable) key | Kong env `ANON_KEY`, also `kong.yml` → `consumers.anon` |
| Docker network | `openship-supabase` |
| Config root | `/var/lib/openship/app-config/proj_JQsSyX0Y7-PzvYEK` |

The frontend reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`, defaulting to the
values in `src/integrations/supabase/client.ts` (LAN URL + anon key baked in).

## Auth

GoTrue runs with `GOTRUE_MAILER_AUTOCONFIRM=true` — signups are confirmed instantly and
return a session immediately (no SMTP, no email verification).

## Database schema

`supabase/selfhost/schema.sql` is a fully **idempotent** script (safe to re-run): it creates
`ai_settings`, `ai_chat_sessions`, `ai_chat_messages`, `mcp_servers`, the `ai-chat-files`
storage bucket, and all RLS policies/triggers. Apply with:

```bash
cat supabase/selfhost/schema.sql | ssh root@192.168.1.42 \
  'docker exec -i openship-supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1'
```

`supabase/migrations/*.sql` are the original Lovable-era migrations (kept for provenance);
`schema.sql` is the reconciled source of truth for the homelab.

## AI gateway (`vv-ai` edge function)

Chat works **without any user API key** through `supabase/functions/vv-ai`, an OpenAI-style
chat proxy that keeps the provider key server-side. Deploy:

```bash
ssh root@192.168.1.42 'mkdir -p /var/lib/openship/app-config/proj_JQsSyX0Y7-PzvYEK/functions/vv-ai'
scp supabase/functions/vv-ai/index.ts \
  root@192.168.1.42:/var/lib/openship/app-config/proj_JQsSyX0Y7-PzvYEK/functions/vv-ai/index.ts
```

Test through Kong:

```bash
curl -X POST http://192.168.1.42:8000/functions/v1/vv-ai \
  -H "apikey: <ANON_KEY>" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Reply with exactly: OK"}],"max_tokens":8}'
```

Function env (set on `openship-supabase-functions`): `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`
(currently DeepSeek via the homelab gateway, model `deepseek-flash`).

The edge router resolves `/functions/v1/<name>` per request — a new function directory is
picked up without a container restart.

## Client-side AI routing

`src/services/aiProviderService.ts` sends requests direct to the provider when the user has
configured a key in AI Settings (OpenAI / OpenRouter / Gemini / Anthropic / DeepSeek /
Perplexity / Grok), and falls back to the `vv-ai` gateway when no key is set.

## Notes for outside-LAN access

External visitors cannot reach `http://192.168.1.42:8000`. If the app is exposed publicly,
Kong must also be tunneled and the app rebuilt with `VITE_SUPABASE_URL` set to that public
Supabase URL (one env var at build time).
