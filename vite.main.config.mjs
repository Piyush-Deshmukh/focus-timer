import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js environments
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext']
  }
});