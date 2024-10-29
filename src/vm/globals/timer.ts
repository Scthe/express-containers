import { QuickJSContext } from 'quickjs-emscripten';
import { quickJSContext_getExtras } from '../context';

/**
 * Sometimes the QuickJS script finishes, but there are still tasks for
 * it to execute. E.g. `setTimeout()`'s callback:
 *
 * 1. QuickJS VM executes `setTimeout()` instruction.
 * 2. Browser VM schedules `setTimeout()` on it's own event loop.
 * 3. QuickJS VM finishes it script. It does not know about
 *    Browser VM event loop, so thinks it's done.
 * 4. QuickJS VM closes down. It complains about not disposed stuff
 *    related to `setTimeout()`.
 * 5. Browser VM executes `setTimeout()` callback and calls
 *    `quickJS_Context.callFunction()` after QuickJS VM tried to close.
 *
 * Solution: hold QuickJS VM pending Browser VM's event loop.
 *
 * TODO use `executePendingJobs()` with promises instead.
 */
export interface PendingExternalTasks {
  timeoutIds: number[];
  intervalIds: number[];
  waitDonePromise: Promise<undefined>;
  resolveDone: () => void;
}

export const createPendingExternalTasks = () => {
  const result: PendingExternalTasks = {
    timeoutIds: [],
    intervalIds: [],
    waitDonePromise: undefined!,
    resolveDone: undefined!,
  };
  result.waitDonePromise = new Promise((res, _rej) => {
    result.resolveDone = () => res(undefined);
  });
  return result;
};

/** https://github.com/justjake/quickjs-emscripten/issues/73#issuecomment-1348771980 */
export function injectVM_Timer(
  context: QuickJSContext,
  disposables: Disposable[]
) {
  const { pendingExternalTasks } = quickJSContext_getExtras(context);

  const markDone = (type: 'timeout' | 'interval', id: number) => {
    if (type === 'timeout') {
      pendingExternalTasks.timeoutIds = pendingExternalTasks.timeoutIds.filter(
        (e) => e !== id
      );
    } else {
      pendingExternalTasks.intervalIds =
        pendingExternalTasks.intervalIds.filter((e) => e !== id);
    }

    if (
      pendingExternalTasks.timeoutIds.length === 0 &&
      pendingExternalTasks.intervalIds.length === 0
    ) {
      pendingExternalTasks.resolveDone();
    }
  };

  const _setTimeout = context.newFunction(
    'setTimeout',
    (functionRefHandle, delayHandle, ...paramHandles) => {
      // Make a copy because otherwise vmFnHandle does not live long enough to call after the timeout
      const vmFnHandleCopy = functionRefHandle.dup();
      const timeout = context.dump(delayHandle);
      // const paramsCopy = paramHandles.map((e) => e.dup());

      // QuickJS does not know about this!
      const timeoutId = setTimeout(() => {
        // console.log('setTimeout::inside', arguments);
        markDone('timeout', timeoutId);
        // callFunction(vmFnHandleCopy) will call the vm function
        // in the context of the vm
        // we pass vm.undefined because we need to pass something for the "this" argument
        const result = context.callFunction(
          vmFnHandleCopy,
          context.undefined
          //  paramsCopy
        );

        vmFnHandleCopy.dispose();
        // paramsCopy.forEach((e) => e.dispose());

        result.unwrap(); // can throw on error!
      }, timeout);

      pendingExternalTasks.timeoutIds.push(timeoutId);
      return context.newNumber(timeoutId);
    }
  );
  context.setProp(context.global, 'setTimeout', _setTimeout);
  _setTimeout.dispose();

  /*
  const _clearTimeout = context.newFunction('clearTimeout', (timerIdHandle) => {
    const timerId = context.dump(timerIdHandle);
    clearTimeout(timerId);
    markDone();
  });
  context.setProp(context.global, 'clearTimeout', _clearTimeout);
  _clearTimeout.dispose();
  */
}
