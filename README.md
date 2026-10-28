# AlphaWave — Astro theme with Strapi CMS

AlphaWave is a recruitment and hiring agency theme for [Astro](https://astro.build). Blog posts, jobs (with their companies) and services are managed in [Strapi](https://strapi.io), which is included in the `strapi/` folder with demo content.

- 12 pages: Home, About, Services, Jobs, Blogs, Contact, Style Guide, Licenses, Changelog, Instructions, Password and 404
- Detail pages generated from Strapi: `/blog/[slug]`, `/job/[slug]`, `/service/[slug]`
- Page-load, scroll and hover animations (GSAP), smooth scrolling (Lenis), sliders, FAQ accordions and a mobile menu
- Static output: no server needed in production, the site is rebuilt when content changes

## Requirements

- Node.js 22.23.4 or newer (Strapi supports Node 20 to 26)
- npm (any package manager works; the scripts below use npm)

## Quick start

```bash
# 1. Install the theme and the CMS
npm install
npm run cms:install

# 2. Load the demo content into Strapi (blog posts, companies, jobs, services and media)
npm run cms:seed

# 3. Start Strapi on http://localhost:1337 (create your admin user at /admin)
npm run cms:dev

# 4. In a second terminal: configure and start Astro on http://localhost:4321
cp .env.example .env
npm run dev
```

`npm run build` writes the static site to `dist/`. The content is fetched from Strapi at build time, so Strapi must be reachable while building.

### Demo mode (no Strapi)

When `STRAPI_URL` is not set, the site is built from the demo content bundled in `strapi/data/seed.json` (the same data `npm run cms:seed` imports), and its images are served from `/cms-demo/`. This is how the live demo is deployed, and it lets you preview the theme with just `npm install && npm run build`. Set `STRAPI_URL` to switch to your Strapi content.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `STRAPI_URL` | yes, for your own content | Base URL of the Strapi server, e.g. `http://localhost:1337`. Leave it unset to build with the demo content. |
| `STRAPI_TOKEN` | no | Read-only API token. Leave empty if the Public role can read the content (the seed script allows `find` and `findOne`). |
| `PUBLIC_FORM_ENDPOINT` | no | URL that receives form submissions (Formspree, Basin, Getform or your own API). Without it, forms show their success message but send nothing. |

The Strapi server has its own `strapi/.env` (secrets, database, `MCP_ENABLED`); see `strapi/.env.example`.

## Project structure

```text
├── public/
│   ├── images/            # theme images, icons and favicons
│   ├── documents/         # Lottie animations
│   └── js/                # interaction runtime (webflow.js) and jQuery
├── integrations/          # serves the demo content images (demo mode)
├── src/
│   ├── components/
│   │   ├── cards/         # BlogCard, JobCard, ServiceCard, EmptyState
│   │   ├── layout/        # Header, Footer
│   │   ├── sections/      # page sections, one folder per page (+ shared)
│   │   ├── ui/            # buttons, social icons
│   │   └── SeoMeta.astro
│   ├── config/            # config.json, menu.json, social.json
│   ├── layouts/           # BaseLayout
│   ├── lib/               # Strapi client, content queries, rich text renderer
│   ├── pages/             # routes, including blog/, job/ and service/ [slug] pages
│   ├── scripts/           # animations and forms (client side)
│   ├── styles/            # theme CSS
│   └── content.config.ts  # Strapi-backed content collections
└── strapi/                # Strapi 5 project (content types, seed data and script)
```

## Content model (Strapi)

| Collection | Main fields | Used on |
| --- | --- | --- |
| **Blog Post** | title, slug, excerpt, published date, category, featured, main image, author (name, role, photo), body, gallery, body continued | Home, About and Services sliders; Blogs page; article pages |
| **Job** | title, slug, **company** (relation), location, job type, work mode, department, experience, salaries, posted date, featured on home, show in related, summary, description blocks, contact email and phone | Home; Jobs page; job pages |
| **Company** | name, slug, type, logo, website, industry, employees, location, jobs | Job cards and job pages |
| **Service** | name, slug, card title, sort order, short description, icon, images, offerings, price, author, overview, stats | Home slider; Services page; service pages |

Rich text fields use Strapi's Blocks editor and are rendered with the theme's rich text styles (`src/lib/blocks.ts`).

Which entries appear where:

- Home, About and Services sliders: the 6 latest blog posts
- Blogs page: featured posts (top) and all other posts (grid); articles show the featured posts below the text
- Home: jobs with "Featured on home" (3, newest first); Jobs page: the 12 latest jobs; job pages: jobs with "Show in related" (4)
- Services: all services by "Sort order"; service pages show the first two

The queries live in `src/lib/content.ts`.

### Publishing changes

The site is static, so published changes appear after the next build. In production, add a webhook in Strapi (Settings > Webhooks) that calls your host's deploy hook on entry publish/unpublish.

### Strapi MCP server

The [Strapi MCP server](https://docs.strapi.io/cms/features/strapi-mcp-server) is enabled in `strapi/config/server.ts`, so AI assistants can list, create, update and publish entries and manage media. Create an admin token in the Strapi admin, then connect, for example with Claude Code:

```bash
claude mcp add strapi-mcp --transport http http://localhost:1337/mcp -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Set `MCP_ENABLED=false` in `strapi/.env` to turn it off.

## Customization

- **Site settings, SEO defaults, footer text**: `src/config/config.json`
- **Navigation**: `src/config/menu.json`; **social links**: `src/config/social.json`
- **Page titles and descriptions**: the `BaseLayout` props in each file in `src/pages`
- **Colors, spacing and typography**: the CSS variables at the top of `src/styles/alphawave.css`
- **Fonts**: `fonts` in `astro.config.mjs` (self-hosted by Astro)
- **Forms**: set `PUBLIC_FORM_ENDPOINT`; the handler is `src/scripts/forms.ts`

### Animations

Animations are attached with attributes such as `page-load-1`, `hero-title`, `section-title` and `Reveal-anim-2`. They are played by the interaction runtime in `public/js/webflow.js`, which also runs the sliders, dropdowns, lightbox, mobile menu and Lottie animations. Each page passes its `wfPage` id to `BaseLayout`; keep it when you edit a page, because the runtime uses it to load that page's animations.

## Deployment

Build with `npm run build` and deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages...). Set `STRAPI_URL` (and `STRAPI_TOKEN` if used) in the host's build settings, and set `site.base_url` in `src/config/config.json` to your domain.

Deploy Strapi separately (Strapi Cloud, a VPS or a container), with a production database such as PostgreSQL; see `strapi/config/database.ts`.

## Credits

Designed by [Ink Studio](https://www.inks.studio/). Fonts, photos and icons are listed on the Licenses page.

## Troubleshooting

- **Build fails with "Could not reach Strapi"**: start Strapi (`npm run cms:dev`) or check `STRAPI_URL` in `.env`.
- **Build fails with a 401/403 from Strapi**: run `npm run cms:seed` (it allows public read access) or set `STRAPI_TOKEN`.
- **Strapi problems on Windows** (sharp / Smart App Control, admin login limits): see `strapi/README.md`.
