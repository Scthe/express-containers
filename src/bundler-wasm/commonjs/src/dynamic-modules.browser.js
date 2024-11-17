// import * as org from './dynamic-modules';
// export * from './dynamic-modules';

export const COMMONJS_REQUIRE_EXPORT = 'commonjsRequire';
export const CREATE_COMMONJS_REQUIRE_EXPORT = 'createCommonjsRequire';

const FAILED_REQUIRE_ERROR = `throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');`;

export function getDynamicModuleRegistry(
  isDynamicRequireModulesEnabled,
  dynamicRequireModules,
  commonDir,
  ignoreDynamicRequires
) {
  /*console.log('getDynamicModuleRegistry', {
    isDynamicRequireModulesEnabled,
    dynamicRequireModules,
    commonDir,
    ignoreDynamicRequires,
  });*/

  // throw new Error(
  // `CommonJS plugin: Dynamic modules are not supported. Called getDynamicModuleRegistry()`
  // );

  // check original impl
  // const result = org.getDynamicModuleRegistry(
  // isDynamicRequireModulesEnabled,
  // dynamicRequireModules,
  // commonDir,
  // ignoreDynamicRequires
  // );
  // console.log('[RESULT]', result);
  // return result;

  return `export function ${COMMONJS_REQUIRE_EXPORT}(path) {
    ${FAILED_REQUIRE_ERROR}
  }`;
}

export function getDynamicRequireModules(patterns, dynamicRequireRoot) {
  /*console.log('getDynamicRequireModules', {
    patterns,
    dynamicRequireRoot,
  });*/

  // throw new Error(
  // `CommonJS plugin: Dynamic modules are not supported. Called getDynamicRequireModules()`
  // );

  // check original impl
  // const result = org.getDynamicRequireModules(patterns, dynamicRequireRoot);
  // console.log('[RESULT]', result);
  // return result;

  return { commonDir: null, dynamicRequireModules: new Map() };
}
