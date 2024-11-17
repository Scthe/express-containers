import { QuickJSContext } from 'quickjs-emscripten';
import { registerGlobalFn } from '../utils';
import { getDirent, getFileContent, VirtualFS } from 'virtual-fs';

const VM_CALLBACK_NAMES = {
  stat: '__platform_fs_stat',
  createReadStream: '__platform_fs_createReadStream',
};

export function injectVM_fs(context: QuickJSContext, vfs: VirtualFS) {
  registerGlobalFn(context, VM_CALLBACK_NAMES.stat, (filepathHandle) => {
    const filepath = context.dump(filepathHandle);
    const maybeDirent = getDirent(vfs, filepath);

    let status = 'not-found';
    if (maybeDirent.status === 'ok') {
      status = maybeDirent.dirent.type === 'directory' ? 'directory' : 'file';
    }
    return context.newString(status);
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
      return context.newString(maybeDirent.content);
    }
  );
}
