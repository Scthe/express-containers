import { QuickJSContext } from 'quickjs-emscripten';
import { EventLoop } from '../event_loop';

/** https://github.com/justjake/quickjs-emscripten/issues/73#issuecomment-1348771980 */
export function injectVM_Timer(context: QuickJSContext, eventLoop: EventLoop) {
  // TODO use registerGlobalFn
  const _setTimeout = context.newFunction(
    'setTimeout',
    (functionRefHandle, delayHandle, ...paramHandles) => {
      // Make a copy because otherwise vmFnHandle does not live long enough to call after the timeout
      const vmFnHandleCopy = functionRefHandle.dup();
      const timeout = context.dump(delayHandle);
      // const paramsCopy = paramHandles.map((e) => e.dup());

      // QuickJS does not know about this!
      const timeoutId = eventLoop.addTimeout(() => {
        // callFunction(vmFnHandleCopy) will call the vm function
        // in the context of the vm
        const result = context.callFunction(
          vmFnHandleCopy,
          context.undefined // value for '$this'
          //  paramsCopy
        );

        vmFnHandleCopy.dispose();
        // paramsCopy.forEach((e) => e.dispose());

        result.unwrap(); // can throw on error!
      }, timeout);

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
