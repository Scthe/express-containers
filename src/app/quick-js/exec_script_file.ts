import { QuickJSAsyncContext } from 'quickjs-emscripten';
import { withLimitedStackTrace } from 'utils';
import { VirtualFS, getFileContent } from 'virtual-fs';
import { quickJSContext_getExtras } from './context';

export const executeScriptFile = async (
  context: QuickJSAsyncContext,
  vfs: VirtualFS,
  path: string
) => {
  console.log(`Executing script file: '${path}'`);
  const scriptText = getFileContent(vfs, path);
  if (scriptText.status !== 'ok') {
    throw new Error(`Could not execute script '${path}'. Error: ${scriptText.error}.`); // prettier-ignore
  }

  const result = await context.evalCodeAsync(scriptText.content, path);
  if (result.error) {
    const e = context.dump(result.error);
    const stack = e.stack ? e.stack.split('\n').join('\n') : ''; // yes, this is required
    console.error(`[Execution failed] ${e.name}: ${e.message}\n`, stack);
  }
  const resultHandle = withLimitedStackTrace(
    () => result.unwrap() // can throw on error!
  );
  // console.log('res.unwrap()', context.dump(resultHandle));

  // console.log({
  // hasPendingJob: context.runtime.hasPendingJob(),
  // resultHandle,
  // });
  context.runtime.executePendingJobs();
  const result2 = context.unwrapResult(
    context.getPromiseState(resultHandle) as any
  ) as any;
  result2.dispose();
  // console.log(result2.consume(context.dump));

  const { eventLoop } = quickJSContext_getExtras(context);
  // console.log('await external tasks', pendingExternalTasks);
  await eventLoop.drain();
  // console.log('await external tasks :: done', pendingExternalTasks);
};
