<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Versioning

Every release commit bumps `version` in package.json by 0.0.1, carrying at 10
(1.1.9 → 1.2.0, 1.9.9 → 2.0.0). One commit = one change = one bump. The UI
shows it via `lib/version.ts` (sidebar + marketing footer) — never hard-code
the version anywhere else.
