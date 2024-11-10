export const executeScriptFile = async (
  context: QuickJSAsyncContext,
  vfs: VirtualFS,
  path: string
) => {
  console.log(`Executing script file: '${path}'`);
  const scriptText = await getFileContent(vfs, path);
  if (!scriptText) {
    throw new Error(`Could not execute script '${path}'. File not found.`); // prettier-ignore
  }

  const result = await context.evalCodeAsync(scriptText, path);
  if (result.error) {
    const e = context.dump(result.error);
    const stack = '\n' + e.stack.split('\n').join('\n');
    console.error(`[Execution failed] ${e.name}: ${e.message}`, stack);
  }
  const resultHandle = limitStackTrace(
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

  const { pendingExternalTasks } = quickJSContext_getExtras(context);
  // console.log('await external tasks', pendingExternalTasks);
  await pendingExternalTasks.waitDonePromise;
  // console.log('await external tasks :: done', pendingExternalTasks);
};
