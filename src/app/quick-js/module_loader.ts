import { join, dirname } from 'pathe';
import { JSModuleLoader, JSModuleNormalizer } from 'quickjs-emscripten';
import { quickJSContext_getExtras } from './context';
import { DirNode, getDirent, getFileContent, VirtualFS } from 'virtual-fs';

/*
TODO remove?

TODO better import file name parsing
     https://github.com/wasmerio/spiderfire/blob/ee79bb8d82c12ee83d12a9f851656ba135f4223e/runtime/src/module/loader.rs
TODO add expected node modules like 'fs'
     https://github.com/wasmerio/spiderfire/tree/ee79bb8d82c12ee83d12a9f851656ba135f4223e/modules
*/

export const moduleLoader: JSModuleLoader = (moduleName, ctx) => {
  console.log(`[moduleLoader] '${moduleName}'`);
  const { vfs } = quickJSContext_getExtras(ctx);

  const asNodeStrLib = tryGetAsNodeStdLib(moduleName);
  if (asNodeStrLib) return asNodeStrLib;

  let name = moduleName.startsWith('.')
    ? moduleName
    : 'node_modules/' + moduleName;

  let scriptText = getRelativeFile(vfs, name);
  if (scriptText) return scriptText;

  // try as dir
  const fileNode = getDirent(vfs, name);
  if (fileNode.status === 'ok' && fileNode.dirent.type === 'directory') {
    const scriptText = loadFileAsDir(vfs, fileNode.dirent, name);
    if (scriptText) return scriptText;
  }

  throw new Error(`Could not import/require script '${moduleName}'. File not found.`); // prettier-ignore
};

function loadFileAsDir(vfs: VirtualFS, dir: DirNode, name: string) {
  // try "main" from package.json
  let packageJson = getFileContent(vfs, name + '/package.json');
  if (packageJson.status === 'ok') {
    const pckJson = JSON.parse(packageJson.content || '');
    if (pckJson['main'] && dir.files[pckJson['main']]) {
      const scriptText = getRelativeFile(
        vfs,
        name + '/' + dir.files[pckJson['main']]
      );
      if (scriptText) return scriptText;
    }
  }

  // try index.js
  const text0 = getRelativeFile(vfs, name + '/index.js');
  if (text0) return text0;

  // try main.js
  const text1 = getRelativeFile(vfs, name + '/main.js');
  if (text1) return text1;

  return undefined;
}

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
