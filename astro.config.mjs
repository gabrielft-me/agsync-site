// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://agsync.dev',
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep the page a single file: past the default 4 KB, Astro emits the
      // component script as its own request. Fonts must stay files — inlined
      // they are base64, which does not compress and is far larger than the
      // request it saves.
      assetsInlineLimit: (file) =>
        !/\.(woff2?|ttf|otf|eot|png|jpe?g|gif|webp|avif)$/i.test(file),
    },
  },
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
});
