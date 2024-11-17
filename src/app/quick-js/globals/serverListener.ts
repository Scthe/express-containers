import { QuickJSContext } from 'quickjs-emscripten';
import { registerGlobalFn } from '../utils';
import { quickJSContext_getExtras } from '../context';

const VM_CALLBACK_NAME = '__platform_registerPortListener';

export function injectVM_serverListener(context: QuickJSContext) {
  const ctxtExtras = quickJSContext_getExtras(context);

  registerGlobalFn(context, VM_CALLBACK_NAME, (portHandle) => {
    const port = context.dump(portHandle);
    // eslint-disable-next-line no-console
    console.log(`Host received server notification on port=${port}`);

    ctxtExtras.serverPort = port;

    ctxtExtras.eventLoop.addPerpetual();
  });
}
