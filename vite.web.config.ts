import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config';
export default mergeConfig(base, defineConfig({ build: { emptyOutDir: false, rolldownOptions: { input: 'web.html' } } }));
