import { QuickJSContext, QuickJSRuntime } from 'quickjs-emscripten';
import { injectVM_Console } from './globals/console';
import { getFileContent, VirtualFS } from './virtual_fs';
import { injectVM_Timer, PendingExternalTasks } from './globals/timer';

interface ContextExtras {
  vfs: VirtualFS;
  pendingExternalTasks: PendingExternalTasks;
}

export function createQuickJSContext(
  runtime: QuickJSRuntime,
  disposables: Disposable[],
  extras: ContextExtras
) {
  const context = runtime.newContext();
  disposables.push(context);
  (context as any).__myExtras = extras;

  // init context globals
  // TODO https://github.com/wasmerio/spiderfire/tree/ee79bb8d82c12ee83d12a9f851656ba135f4223e/runtime/src/globals
  injectVM_Console(context, disposables);
  injectVM_Timer(context, disposables);

  return context;
}

export const quickJSContext_getExtras = (
  context: QuickJSContext
): ContextExtras => (context as any).__myExtras;

export const executeScriptFile = async (
  context: QuickJSContext,
  vfs: VirtualFS,
  path: string
) => {
  console.log(`Executing script file: '${path}'`);
  const scriptText = getFileContent(vfs, path);
  if (!scriptText) {
    throw new Error(`Could not execute script '${path}'. File not found.`); // prettier-ignore
  }

  const result = context.evalCode(scriptText, path);
  const resultHandle = result.unwrap(); // can throw on error!
  // console.log('res.unwrap()', context.dump(resultHandle));

  console.log({
    hasPendingJob: context.runtime.hasPendingJob(),
    resultHandle,
  });
  context.runtime.executePendingJobs();
  const result2 = context.unwrapResult(
    context.getPromiseState(resultHandle) as any
  ) as any;
  result2.dispose();
  // console.log(result2.consume(context.dump));

  const { pendingExternalTasks } = quickJSContext_getExtras(context);
  // console.log('await external tasks', pendingExternalTasks);
  await pendingExternalTasks.waitDonePromise;
  // console.log('await external tasks :: done', pendingExternalTasks);
};
