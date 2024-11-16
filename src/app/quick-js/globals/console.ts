/* eslint-disable no-console */
import { QuickJSContext } from 'quickjs-emscripten';
import { DisposablesList } from 'utils';

export const QUICK_JS_CONSOLE_TAG = '[QuickJS vm]';

/** https://github.com/justjake/quickjs-emscripten/blob/aa48b619983f02c5691d989c0771a3421178ce4b/packages/quickjs-for-quickjs/src/index.mts#L22 */
export function injectVM_Console(
  context: QuickJSContext,
  disposables: DisposablesList
) {
  const consoleHandle = context.newObject();
  const logHandle = context.newFunction('console.log', (...args) => {
    const message = args.map(context.dump);
    console.log(QUICK_JS_CONSOLE_TAG, ...message);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const depth: number = (console as any)['depth'] ?? 0;
  const depthHandle = context.newNumber(1 + depth);

  context.setProp(consoleHandle, 'log', logHandle);
  context.setProp(consoleHandle, 'error', logHandle);
  context.setProp(consoleHandle, 'depth', depthHandle);
  context.setProp(context.global, 'console', consoleHandle);

  disposables.push('console object', consoleHandle);
  disposables.push('console.log', logHandle);
  disposables.push('console.depth', depthHandle);
}
