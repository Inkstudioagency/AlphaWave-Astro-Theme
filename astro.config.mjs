// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import config from './src/config/config.json';
import strapiDemoMedia from './integrations/strapi-demo-media.mjs';

// https://astro.build/config
export default defineConfig({
  site: config.site.base_url,
  trailingSlash: config.site.trailing_slash ? 'always' : 'ignore',
  integrations: [strapiDemoMedia()],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [300, 400, 500, 600, 700, 800, 900],
      styles: ['normal'],
    },
    {
      provider: fontProviders.google(),
      name: 'Literata',
      cssVariable: '--font-literata',
      weights: [200, 300, 400, 500, 600, 700, 800, 900],
      styles: ['normal'],
    },
  ],
  vite: {
    // pre-bundle the animation libraries so the first dev page load registers
    // GSAP plugins before the interaction runtime (public/js/webflow.js) starts
    optimizeDeps: {
      include: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'lenis'],
    },
    server: {
      // the bundled Strapi backend lives in ./strapi and has its own toolchain
      watch: { ignored: ['**/strapi/**'] },
    },
  },
});
