import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ command }) => ({
  // Use the subpath only during the GitHub Actions build, otherwise use root
  base: command === 'build' ? '/usana_empire/' : '/',
  
build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        product: resolve(__dirname, 'app/product/index.html'),
        business: resolve(__dirname, 'app/business/index.html'),
        tools: resolve(__dirname, 'app/tools/index.html'),
        genealogy: resolve(__dirname, 'app/tools/genealogy/index.html'),
        guidance: resolve(__dirname, 'app/tools/guidance/index.html'),
        receipts: resolve(__dirname, 'app/tools/receipts/index.html'),
        ledger: resolve(__dirname, 'app/tools/ledger/index.html'),
        prospects: resolve(__dirname, 'app/tools/prospects/index.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.js'],
  },
}));