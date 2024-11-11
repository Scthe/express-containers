import {
  QuickJSAsyncRuntime,
  QuickJSAsyncWASMModule,
} from 'quickjs-emscripten';
import { initQuickJs } from './init_quickjs';
import { createQuickJSContext } from './context';
import { VirtualFS } from 'virtual-fs';
import { moduleLoader, moduleNormalizer } from './module_loader2';
import { createDisposables } from 'utils/disposables';

class QuickJsVm {
  private readonly runtime: QuickJSAsyncRuntime;
  private readonly disposables = createDisposables();
  private vfs: VirtualFS | undefined = undefined;

  constructor(private readonly QuickJS: QuickJSAsyncWASMModule) {
    this.runtime = QuickJS.newRuntime();
    this.disposables.push(this.runtime);

    this.runtime.setModuleLoader(moduleLoader, moduleNormalizer);
  }

  shutdown() {
    // console.log('Memory dump:', rt.dumpMemoryUsage());
    this.disposables.dispose();
  }

  mountFileSystem(vfs: VirtualFS) {
    this.vfs = vfs;
  }

  createContext() {
    if (!this.vfs) {
      throw new Error('Tried to create QuickJSContext before any file system was mounted') // prettier-ignore
    }
    return createQuickJSContext(this.runtime, this.disposables, {
      vfs: this.vfs,
    });
  }
}

export const createQuickJsVm = async () => {
  const QuickJS = await initQuickJs();
  return new QuickJsVm(QuickJS);
};
