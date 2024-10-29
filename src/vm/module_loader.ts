import { join, dirname } from 'pathe';
import {
  JSModuleLoader,
  JSModuleLoaderAsync,
  JSModuleNormalizer,
} from 'quickjs-emscripten';
import { quickJSContext_getExtras } from './context';
import { getDirent, getFileContent, VirtualFS } from './virtual_fs';

/*
TODO better import file name parsing
     https://github.com/wasmerio/spiderfire/blob/ee79bb8d82c12ee83d12a9f851656ba135f4223e/runtime/src/module/loader.rs
TODO add expected node modules like 'fs'
     https://github.com/wasmerio/spiderfire/tree/ee79bb8d82c12ee83d12a9f851656ba135f4223e/modules
*/

export const moduleLoader: JSModuleLoader = (moduleName, ctx) => {
  console.log(`[moduleLoader] '${moduleName}'`);
  const { vfs } = quickJSContext_getExtras(ctx);

  let name = moduleName.startsWith('.')
    ? moduleName
    : 'node_modules/' + moduleName;

  let scriptText = getRelativeFile(vfs, name);
  if (scriptText) return scriptText;

  // try as dir
  const asDir = getDirent(vfs, name);

  if (asDir?.type === 'directory') {
    // try "main" from package.json
    scriptText = getFileContent(vfs, name + '/package.json');
    const pckJson = JSON.parse(scriptText || '');
    if (pckJson['main'] && asDir.files[pckJson['main']]) {
      scriptText = getRelativeFile(
        vfs,
        name + '/' + asDir.files[pckJson['main']]
      );
      if (scriptText) return scriptText;
    }

    // try index.js
    scriptText = getRelativeFile(vfs, name + '/index.js');
    if (scriptText) return scriptText;

    // try main.js
    scriptText = getRelativeFile(vfs, name + '/main.js');
    if (scriptText) return scriptText;
  }

  throw new Error(`Could not import/require script '${moduleName}'. File not found.`); // prettier-ignore
};

function getRelativeFile(vfs: VirtualFS, filePath: string) {
  // console.log(`test '${filePath}'`);
  let scriptText = getFileContent(vfs, filePath);
  if (scriptText) return scriptText;

  // Try with '.js' extension
  if (!filePath.endsWith('.js')) {
    const scriptText2 = getFileContent(vfs, filePath + '.js');
    if (scriptText2) return scriptText2;
  }
  return undefined;
}

export const moduleNormalizer: JSModuleNormalizer = (
  baseModuleName,
  requestedName,
  _ctx
) => {
  console.log('[moduleNormalizer]', { baseModuleName, requestedName });
  let result = join(dirname(baseModuleName), requestedName);
  if (requestedName.startsWith('.')) {
    result =
      requestedName.substring(0, requestedName.indexOf('/') + 1) + result;
  }
  return result;
};
