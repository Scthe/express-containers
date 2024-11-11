import {
  QuickJSAsyncRuntime,
  QuickJSAsyncContext,
  QuickJSContext,
} from 'quickjs-emscripten';
import { injectVM_Console } from './globals/console';
import { injectVM_Timer } from './globals/timer';
import { EventLoop } from './event_loop';
import { VirtualFS } from 'virtual-fs';
import { createDisposables, Disposables } from 'utils';
import { executeScriptFile } from './exec_script_file';

interface ContextExtras {
  vfs: VirtualFS;
  eventLoop: EventLoop;
  disposables: Disposables;
}

export const MONKEY_PATCH_SCRIPT_FILE = '$__monkey_patch.js';

export async function createQuickJSContext(
  runtime: QuickJSAsyncRuntime,
  runtimeDisposables: Disposables,
  extras: Pick<ContextExtras, 'vfs'>
): Promise<QuickJSAsyncContext> {
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

  await executeScriptFile(context, extras.vfs, MONKEY_PATCH_SCRIPT_FILE);

  return context;
}

export const quickJSContext_getExtras = (
  context: QuickJSAsyncContext | QuickJSContext
): ContextExtras => (context as any).__myExtras;

export const quickJSContext_Dispose = (
  context: QuickJSAsyncContext | QuickJSContext
) => {
  const { disposables } = quickJSContext_getExtras(context);
  disposables.dispose();
};
