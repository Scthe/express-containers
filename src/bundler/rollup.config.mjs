import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
// import nodePolyfills from 'rollup-plugin-polyfill-node';
// import typescript from '@rollup/plugin-typescript';
import testPlugin from './rollup-plugin-polyfill-node/test.plugin.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  input: join(__dirname, 'my_bundler.js'),
  // input: join(__dirname, 'index.test.js'),
  // input: join(__dirname, 'test_express.js'),
  external: ['fs', 'fs/promises', 'tts', 'net'],
  output: {
    name: 'my_bundler',
    file: join(__dirname, 'my_bundler.out.js'),
    format: 'es', // "amd", "cjs", "system", !"es", "iife" or "umd"
  },
  plugins: [
    // typescript(),
    testPlugin(),
    json(),
    resolve({
      browser: true,
      preferBuiltins: false,
      modulePaths: [join(__dirname, '..', 'node-std-lib')],
    }),
    commonjs({ sourceMap: false }),
    /*
    nodePolyfills({
      include: [
        'events',
        'stream',
        'util',
        'path',
        'buffer',
        'querystring',
        'url',
        'http',
        'zlib',
        // "tty",
        'crypto',
      ],
      exclude: ['fs', 'tts', 'net'],
    }),*/
  ],
};
