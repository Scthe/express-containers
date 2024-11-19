import { QuickJSContext } from 'quickjs-emscripten';
import { registerGlobalFn } from '../utils';
import { getDirent, getFileContent, VirtualFS } from 'virtual-fs';
import { quickJSContext_getExtras } from '../context';

const VM_CALLBACK_NAMES = {
  stat: '__platform_fs_stat',
  createReadStream: '__platform_fs_createReadStream',
};

export function injectVM_fs(context: QuickJSContext, vfs: VirtualFS) {
  // TODO [MEDIUM] memory leak
  // To handle requests we have to allocate memory for file stats.
  // Can be deallocated once response was send.
  // ATM. this is not handled, we deallocate on context shutdown.
  // It's a memory leak
  const { disposables } = quickJSContext_getExtras(context);

  registerGlobalFn(context, VM_CALLBACK_NAMES.stat, (filepathHandle) => {
    const filepath = context.dump(filepathHandle);
    const maybeDirent = getDirent(vfs, filepath);

    let status = 'not-found';
    if (maybeDirent.status === 'ok') {
      status = maybeDirent.dirent.type === 'directory' ? 'directory' : 'file';
    }
    const str = context.newString(status);
    disposables.push('fs::stat result', str);
    return str;
  });

  registerGlobalFn(
    context,
    VM_CALLBACK_NAMES.createReadStream,
    (filepathHandle) => {
      const filepath = context.dump(filepathHandle);
      const maybeDirent = getFileContent(vfs, filepath);

      if (maybeDirent.status === 'error') {
        return context.undefined;
      }

      const str = context.newString(maybeDirent.content);
      disposables.push('fs::createReadStream result', str);
      return str;
    }
  );
}
