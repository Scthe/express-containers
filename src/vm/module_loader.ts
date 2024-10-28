import { join, dirname } from 'pathe';
import { JSModuleLoader, JSModuleNormalizer } from 'quickjs-emscripten';
import { quickJSContext_getExtras } from './context';
import { getFileContent } from './virtual_fs';

/*
TODO better import file name parsing
     https://github.com/wasmerio/spiderfire/blob/ee79bb8d82c12ee83d12a9f851656ba135f4223e/runtime/src/module/loader.rs
TODO add expected node modules like 'fs'
     https://github.com/wasmerio/spiderfire/tree/ee79bb8d82c12ee83d12a9f851656ba135f4223e/modules
*/

export const moduleLoader: JSModuleLoader = (moduleName, ctx) => {
  console.log(`[moduleLoader] '${moduleName}'`);

  const { vfs } = quickJSContext_getExtras(ctx);
  const scriptText = getFileContent(vfs, moduleName);
  if (!scriptText) {
    throw new Error(`Could not import/require script '${moduleName}'. File not found.`); // prettier-ignore
  }

  // return `export default '${moduleName}'`;
  return scriptText;
};

export const moduleNormalizer: JSModuleNormalizer = (
  baseModuleName,
  requestedName,
  _ctx
) => {
  console.log('[moduleNormalizer]', { baseModuleName, requestedName });
  return join(dirname(baseModuleName), requestedName);
};
