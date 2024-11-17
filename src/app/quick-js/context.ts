import {
  QuickJSAsyncRuntime,
  QuickJSAsyncContext,
  QuickJSContext,
} from 'quickjs-emscripten';
import { injectVM_Console } from './globals/console';
import { injectVM_Timer } from './globals/timer';
import { EventLoop } from './event_loop';
import { VirtualFS } from 'virtual-fs';
import { createDisposables, DisposablesList } from 'utils';
import { executeScriptFile } from './exec_script_file';
import { injectVM_serverListener } from './globals/serverListener';
import { injectVM_fs } from './globals/fs';

interface ContextExtras {
  vfs: VirtualFS;
  eventLoop: EventLoop;
  disposables: DisposablesList;
  serverPort: number | undefined;
}

export const MONKEY_PATCH_SCRIPT_FILE = '$__monkey_patch.js';

export async function createQuickJSContext(
  runtime: QuickJSAsyncRuntime,
  runtimeDisposables: DisposablesList,
  extras: Pick<ContextExtras, 'vfs'>
): Promise<QuickJSContext> {
  const context = runtime.newContext();
  const disposables = createDisposables();
  runtimeDisposables.push('context-related', disposables);
  disposables.push('context', context);

  // add extra data
  const eventLoop = new EventLoop();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (context as any).__myExtras = {
    ...extras,
    eventLoop,
    disposables,
    serverPort: undefined,
  } satisfies ContextExtras;

  // init context globals
  // TODO https://github.com/wasmerio/spiderfire/tree/ee79bb8d82c12ee83d12a9f851656ba135f4223e/runtime/src/globals
  injectVM_Console(context, disposables);
  injectVM_Timer(context, eventLoop);
  injectVM_serverListener(context);
  injectVM_fs(context, extras.vfs);

  await executeScriptFile(context, extras.vfs, MONKEY_PATCH_SCRIPT_FILE);

  return context;
}

export const quickJSContext_getExtras = (
  context: QuickJSAsyncContext | QuickJSContext
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ContextExtras => (context as any).__myExtras;

export const quickJSContext_Dispose = (
  context: QuickJSAsyncContext | QuickJSContext
) => {
  const { disposables } = quickJSContext_getExtras(context);
  disposables.dispose();
};
