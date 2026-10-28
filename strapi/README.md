# AlphaWave CMS (Strapi 5)

The content backend of the AlphaWave Astro theme. It stores blog posts, jobs, companies and services; the Astro site reads them through the REST API at build time.

## Setup

```bash
npm install
cp .env.example .env   # then replace every "tobemodified" value with a random secret
npm run seed           # demo content + public read access
npm run develop        # http://localhost:1337/admin
```

`npm run seed` only runs on an empty database. Use `npm run seed -- --force` to delete the four collections and import the demo content again.

## Content types

| Type | API | Notes |
| --- | --- | --- |
| Blog Post | `/api/blog-posts` | author is a `shared.person` component; body fields use the Blocks editor |
| Job | `/api/jobs` | many-to-one relation to Company |
| Company | `/api/companies` | one-to-many relation to Jobs |
| Service | `/api/services` | offerings (`shared.list-item`) and stats (`shared.stat`) are repeatable components |

Schemas live in `src/api/*/content-types/*/schema.json` and `src/components/shared`. All types use Draft & Publish; the site only shows published entries.

## Demo data

`data/seed.json` and `data/uploads/` hold the demo content. Each image is uploaded with its own alternative text, which the theme uses as the `alt` attribute.

## MCP server

The Strapi MCP server is enabled (`config/server.ts`, `MCP_ENABLED` in `.env`). It listens on `POST /mcp` and authenticates with an admin token (Settings > Admin tokens). It exposes tools to list, read, create, update, publish and delete entries of each content type and to manage media. Content types themselves are edited in the Content-Type Builder or in the schema files, not through MCP.

```bash
claude mcp add strapi-mcp --transport http http://localhost:1337/mcp -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

The tools available to a client follow the token's permissions: give the token `read`, `update` and `publish` on the four content types for editorial work. The `update_*` tools validate the whole entry, so an update must include the type's required fields (for example `title`, `slug`, `excerpt`, `publishedDate`, `featured`, `mainImage` and `author` for a blog post), not only the field being changed.

## Troubleshooting

- **`Could not load the "sharp" module` / `An Application Control policy has blocked this file` on Windows**: Windows Smart App Control is blocking the native image library that Strapi's Media Library uses. Run Strapi in Docker or WSL, or install sharp's WebAssembly build (`npm install --no-save @img/sharp-wasm32`, repeat after each `npm install`), which runs without native binaries.
- **`Too many requests` on admin login**: Strapi rate-limits admin logins; wait a few minutes or restart the server.

## Production

- Use PostgreSQL or MySQL instead of SQLite (`config/database.ts`, `DATABASE_*` variables).
- Run `npm run build` then `npm run start`.
- Add a webhook (Settings > Webhooks) that triggers a rebuild of the Astro site when entries are published or unpublished.
- If you prefer not to expose the API publicly, remove the Public role's `find`/`findOne` permissions and give the site a read-only API token (`STRAPI_TOKEN`).
- SVG uploads are allowed because the demo logos and icons are SVG files (`config/plugins.ts`); only admins can upload media.
