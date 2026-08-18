import { cpSync } from 'node:fs';

// The dataset is loaded at runtime relative to the build output directory,
// so it must be copied into dist alongside the compiled JS (see src/data.ts).
cpSync('data', 'dist/data', { recursive: true });
