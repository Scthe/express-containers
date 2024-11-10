import { QuickJSAsyncRuntime, QuickJSContext } from 'quickjs-emscripten';
import { injectVM_Console } from './globals/console';
import { injectVM_Timer } from './globals/timer';
import { EventLoop } from './event_loop';
import { VirtualFS } from '../virtual-fs';
import { createDisposables, Disposables } from '../utils/disposables';
import { staticFiles, staticScriptPath } from '../utils';

interface ContextExtras {
  vfs: VirtualFS;
  eventLoop: EventLoop;
  disposables: Disposables;
}

export async function createQuickJSContext(
  runtime: QuickJSAsyncRuntime,
  runtimeDisposables: Disposables,
  extras: Pick<ContextExtras, 'vfs'>
): Promise<QuickJSContext> {
  const context = runtime.newContext();
  const disposables = createDisposables();
  runtimeDisposables.push(disposables);

  // add extra data
  const eventLoop = new EventLoop();
  (context as any).__myExtras = {
    ...extras,
    eventLoop,
    disposables,
  } satisfies ContextExtras;

  // init context globals
  // TODO https://github.com/wasmerio/spiderfire/tree/ee79bb8d82c12ee83d12a9f851656ba135f4223e/runtime/src/globals
  injectVM_Console(context, disposables);
  injectVM_Timer(context, eventLoop);
  // injectVM_Require(context, disposables);
  // injectVM_Process(context, disposables);

  execScriptFromStaticFile(context, '_monkey_patch.js');

  return context;
}

export const quickJSContext_getExtras = (
  context: QuickJSContext
): ContextExtras => (context as any).__myExtras;

export const quickJSContext_Dispose = (context: QuickJSContext) => {
  const { disposables } = quickJSContext_getExtras(context);
  disposables.dispose();
};

async function execScriptFromStaticFile(
  context: QuickJSContext,
  fileName: string
) {
  const monketPatchScriptText = await staticFiles.fetchFileText(
    staticScriptPath(fileName)
  );

  const res = context.evalCode(monketPatchScriptText, fileName, {
    // type: 'global',
  });
  res.unwrap();
}
