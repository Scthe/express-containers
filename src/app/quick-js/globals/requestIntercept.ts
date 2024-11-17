import { QuickJSContext } from 'quickjs-emscripten';
import { registerGlobalFn } from '../utils';
import { quickJSContext_getExtras } from '../context';
import { withLimitedStackTrace } from 'utils';

const VM_CALLBACK_NAME = '__platform_registerPortListener';

export type RequestInterceptor = ReturnType<typeof createRequestInterceptor>;

export const createRequestInterceptor = (context: QuickJSContext) => {
  const ports = new Set<number>(); // TODO list of intercept filters
  return {
    addInterceptor: (port: number) => ports.add(port),
    tryIntercept: (port: number): boolean => {
      if (!ports.has(port)) return false;

      forwardRequestToVM(context, port);
      return true;
    },
  };
};

export function injectVM_requestIntercepter(context: QuickJSContext) {
  const { eventLoop, requestInterceptor } = quickJSContext_getExtras(context);

  registerGlobalFn(context, VM_CALLBACK_NAME, (portHandle) => {
    const port = context.dump(portHandle);
    console.log(`Host: adding interceptor for port ${port}`);
    requestInterceptor.addInterceptor(port);

    eventLoop.addPerpetual();
  });
}

function forwardRequestToVM(context: QuickJSContext, port: number) {
  console.log('forwardRequestToVM port=', port);
  const portListeners = context.getProp(context.global, '__portListeners');

  const portHandle = context.newNumber(port);
  const result = context.callMethod(portListeners, 'invoke', [portHandle]);
  portHandle.dispose();
  portListeners.dispose();

  // TODO share with exec_script_file.ts
  if (result.error) {
    const e = context.dump(result.error);
    const stack = e.stack ? e.stack.split('\n').join('\n') : ''; // yes, this is required
    console.error(`[Execution failed] ${e.name}: ${e.message}\n`, stack);
  }
  const resultHandle = withLimitedStackTrace(
    () => result.unwrap() // can throw on error!
  );
}
