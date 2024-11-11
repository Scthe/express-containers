import { join, dirname } from 'pathe';
import { JSModuleLoader, JSModuleNormalizer } from 'quickjs-emscripten';
import { quickJSContext_getExtras } from './context';
import { getFileContent, VirtualFS } from 'virtual-fs';

/**
 * Stage 1 - given info about included file, resolve the path
 */
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

/**
 * Stage 2 - return file's text for provided moduleName
 */
export const moduleLoader: JSModuleLoader = (moduleName, ctx) => {
  console.log(`[moduleLoader] '${moduleName}'`);
  const { vfs } = quickJSContext_getExtras(ctx);

  let scriptText = getRelativeFile(vfs, moduleName);
  if (scriptText) return scriptText;

  throw new Error(`Could not import/require script '${moduleName}'. File not found.`); // prettier-ignore
};

function getRelativeFile(vfs: VirtualFS, filePath: string): string | undefined {
  // console.log(`test '${filePath}'`);
  let scriptText = getFileContent(vfs, filePath);
  if (scriptText.status === 'ok') return scriptText.content;

  // Try with '.js' extension
  if (!filePath.endsWith('.js')) {
    return getRelativeFile(vfs, filePath + '.js');
  }
  return undefined;
}
