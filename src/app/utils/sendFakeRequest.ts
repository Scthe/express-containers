import { QuickJSContext } from 'quickjs-emscripten';
import { quickJSContext_getExtras } from '../quick-js/context';
import { withLimitedStackTrace } from 'utils';

// TODO service worker to intercept?
const VM_GLOBAL_REQUEST_HANDLER = '__portListeners';

export type InterceptedFetchResponse = {
  statusCode: number;
  headers: Record<string, string>;
  data: unknown;
};

export function sendFakeRequest(context: QuickJSContext, pathname: string) {
  const { serverPort } = quickJSContext_getExtras(context);
  if (serverPort === undefined) {
    console.error(
      `Tried to send request to '${pathname}', but no VM server was registered`
    );
    return;
  }

  return forwardRequestToVM(context, serverPort, pathname);
}

function forwardRequestToVM(
  context: QuickJSContext,
  port: number,
  pathname: string
) {
  // eslint-disable-next-line no-console
  console.log(`forwardRequestToVM (port='${port}', pathname='${pathname}')`);
  const portListeners = context.getProp(
    context.global,
    VM_GLOBAL_REQUEST_HANDLER
  );

  const portHandle = context.newNumber(port);
  const pathnameHandle = context.newString(pathname);
  const result = context.callMethod(portListeners, 'invoke', [
    portHandle,
    pathnameHandle,
  ]);
  pathnameHandle.dispose();
  portHandle.dispose();
  portListeners.dispose(); // TODO?

  // TODO share with exec_script_file.ts
  if (result.error) {
    const e = context.dump(result.error);
    const stack = e.stack ? e.stack.split('\n').join('\n') : ''; // yes, this is required
    console.error(`[Execution failed] ${e.name}: ${e.message}\n`, stack);
  }
  const resultHandle = withLimitedStackTrace(
    () => result.unwrap() // can throw on error!
  );

  console.log('--------- HOST RECEIVED RESPONSE --------');
  const resp = context.dump(resultHandle);
  console.log(resp);
  resultHandle.dispose();

  return resp as InterceptedFetchResponse;
}
