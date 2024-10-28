import { isProductionBuild } from './utils';
import {
  newQuickJSAsyncWASMModuleFromVariant,
  newQuickJSWASMModuleFromVariant,
  QuickJSContext,
} from 'quickjs-emscripten-core';
import { loadVirtualFileSystem } from './vm/virtual_fs';
import { moduleLoader, moduleNormalizer } from './vm/module_loader';
import { createQuickJSContext, executeScriptFile } from './vm/context';
import { createPendingExternalTasks } from './vm/globals/timer';

// https://github.com/justjake/quickjs-emscripten/issues/151
// just pick right option from:
// https://github.com/justjake/quickjs-emscripten/blob/main/doc/quickjs-emscripten-core/README.md
// import releaseVariant from '@jitl/quickjs-singlefile-browser-release-sync';
import releaseVariant from '@jitl/quickjs-singlefile-browser-release-asyncify';

// esbuild hot reload
(function () {
  if (!isProductionBuild()) {
    // eslint-disable-next-line no-console
    console.log('Starting esbuild live reload');
    new EventSource('/esbuild').addEventListener('change', () =>
      location.reload()
    );
  }
})();

///////////////////////
// main fn
async function main() {
  const disposables: Disposable[] = [];

  const vfs = await loadVirtualFileSystem('init-fs.json');
  console.log('Loaded init virtual fs', vfs);

  // const QuickJS = await newQuickJSWASMModuleFromVariant(releaseVariant);
  const QuickJS = await newQuickJSAsyncWASMModuleFromVariant(releaseVariant);
  const rt = QuickJS.newRuntime();
  disposables.push(rt);
  rt.setModuleLoader(moduleLoader, moduleNormalizer);
  const context = createQuickJSContext(rt, disposables, {
    vfs,
    pendingExternalTasks: createPendingExternalTasks(),
  });

  // test
  // testSimpleScript(context);
  await executeScriptFile(context, vfs, 'index.js');

  console.log('Script finished. Disposing of the references');
  // console.log('Memory dump:', rt.dumpMemoryUsage());
  for (const disposable of disposables.reverse()) {
    (disposable as any).dispose();
  }
  console.log('--- DONE ---');
}

main();

function testSimpleScript(context: QuickJSContext) {
  const world = context.newString('world');
  context.setProp(context.global, 'NAME', world);
  world.dispose();

  // const result = context.evalCode(`"Hello " + NAME + "!"`);
  const result = context.evalCode(`
    import fooName from './tmp/foo.js'
    globalThis.result = fooName;
    console.log('Inside VM!');
    "Hello " + NAME + "!"
    `);
  if (result.error) {
    console.log('Execution failed:', context.dump(result.error));
    result.error.dispose();
  } else {
    console.log('Success:', {
      result,
      lastStmt: context.dump(result.value),
      globalVar: context
        .getProp(context.global, 'result')
        .consume(context.dump),
    });
    result.value.dispose();
  }
}
