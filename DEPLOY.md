# Deploy (Cloudflare Pages)

This project is configured as a **fully static Next.js export** (`next.config.ts` uses `output: "export"`).

## Cloudflare Pages settings

- **Source:** GitHub repository `werkgeist/bildung-in-bildern`
- **Framework preset:** *None* (or just treat as static)
- **Build command:** `pnpm build`
- **Build output directory:** `out`

Notes:
- `next/image` is configured with `images.unoptimized = true` so static export works.
- No environment variables are required.

## Local sanity checks

```bash
pnpm test
pnpm build
# then serve ./out
python3 -m http.server --directory out 3000
```
