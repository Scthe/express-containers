import { newQuickJSAsyncWASMModuleFromVariant } from 'quickjs-emscripten';

// https://github.com/justjake/quickjs-emscripten/issues/151
// just pick right option from:
// https://github.com/justjake/quickjs-emscripten/blob/main/doc/quickjs-emscripten-core/README.md
// import releaseVariant from '@jitl/quickjs-singlefile-browser-release-sync';
// import releaseVariant from '@jitl/quickjs-singlefile-browser-release-asyncify';
import releaseVariant from '#my-quickjs-variant';

export const initQuickJs = () =>
  newQuickJSAsyncWASMModuleFromVariant(releaseVariant);
