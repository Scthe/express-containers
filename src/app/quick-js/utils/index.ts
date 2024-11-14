import {
  QuickJSContext,
  VmFunctionImplementation,
  QuickJSHandle,
} from 'quickjs-emscripten';

export const registerGlobalFn = (
  context: QuickJSContext,
  name: string,
  fn: VmFunctionImplementation<QuickJSHandle>
) => {
  const fnImpl = context.newFunction(name, fn);
  context.setProp(context.global, name, fnImpl);
  fnImpl.dispose();
};
