import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import excerpt from './scripts/remark-excerpt.mjs';

export default defineConfig({
  site: 'https://darknoon.com',
  output: 'static',
  trailingSlash: 'always',
  image: { layout: 'constrained', breakpoints: [100, 240, 480, 960, 1920] },
  integrations: [mdx()],
  markdown: {
    processor: unified({ remarkPlugins: [excerpt], smartypants: false }),
    syntaxHighlight: false,
  },
  devToolbar: { enabled: false },
});
