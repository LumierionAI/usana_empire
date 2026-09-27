import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/usana_empire/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        product: resolve(__dirname, 'product/index.html'),
        business: resolve(__dirname, 'business/index.html'),
        tools: resolve(__dirname, 'tools/index.html'),
        genealogy: resolve(__dirname, 'tools/genealogy/index.html'),
        guidance: resolve(__dirname, 'tools/guidance/index.html'),
        receipts: resolve(__dirname, 'tools/receipts/index.html'),
        ledger: resolve(__dirname, 'tools/ledger/index.html'),
        prospects: resolve(__dirname, 'tools/prospects/index.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.js'],
  },
});
