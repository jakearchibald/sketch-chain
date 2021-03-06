/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import del from 'del';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

import simpleTS from './lib/simple-ts';
import clientBundlePlugin from './lib/client-bundle-plugin';
import nodeExternalPlugin from './lib/node-external-plugin';
import cssPlugin from './lib/css-plugin';
import assetPlugin from './lib/asset-plugin';
import constsPlugin from './lib/consts-plugin';
import resolveDirsPlugin from './lib/resolve-dirs-plugin';
import compressPlugin from './lib/compress-plugin';

const isGlitch = 'PROJECT_DOMAIN' in process.env;
const nullPlugin = {};
/**
 * This will generate brotli-compressed assets. You don't need to do this
 * if you're using a CDN which does this automatically (eg, Cloudflare).
 */
const compressAssets = isGlitch;

function resolveFileUrl({ fileName }) {
  return JSON.stringify('/' + fileName);
}

export default async function ({ watch }) {
  await del('.data/dist');

  const tsPluginInstance = simpleTS('server', { watch });
  const commonPlugins = () => [
    tsPluginInstance,
    resolveDirsPlugin(['client', 'server', 'shared']),
    assetPlugin(),
    commonjs(),
  ];

  return {
    input: 'server/index.ts',
    output: {
      dir: '.data/dist/',
      format: 'cjs',
      assetFileNames: 'assets/[name]-[hash][extname]',
      exports: 'named',
    },
    // Don't watch the ts files. Instead we watch the output from the ts compiler.
    watch: { clearScreen: false, exclude: ['**/*.ts', '**/*.tsx'] },
    preserveModules: true,
    preserveSymlinks: true,
    plugins: [
      { resolveFileUrl },
      clientBundlePlugin(
        {
          plugins: [
            { resolveFileUrl },
            constsPlugin({ isServer: false }),
            ...commonPlugins(),
            resolve(),
            terser({ module: true, mangle: true }),
          ],
        },
        {
          dir: '.data/dist/',
          format: 'esm',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
        resolveFileUrl,
      ),
      cssPlugin(),
      constsPlugin({ isServer: true }),
      ...commonPlugins(),
      nodeExternalPlugin(),
      compressAssets ? compressPlugin() : nullPlugin,
    ],
  };
}
