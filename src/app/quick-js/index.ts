import {
  QuickJSAsyncRuntime,
  QuickJSAsyncWASMModule,
} from 'quickjs-emscripten';
import { initQuickJs } from './init_quickjs';
import { createQuickJSContext } from './context';
import { VirtualFS } from 'virtual-fs';
import { moduleLoader, moduleNormalizer } from './module_loader2';
import { createDisposables } from 'utils/disposables';

export class QuickJsVm {
  private readonly runtime: QuickJSAsyncRuntime;
  private readonly disposables = createDisposables();
  private vfs: VirtualFS | undefined = undefined;

  private constructor(private readonly QuickJS: QuickJSAsyncWASMModule) {
    this.runtime = QuickJS.newRuntime();
    this.disposables.push('QuickJS_runtime', this.runtime);

    this.runtime.setModuleLoader(moduleLoader, moduleNormalizer);
  }

  static async create() {
    const QuickJS = await initQuickJs();
    return new QuickJsVm(QuickJS);
  }

  shutdown() {
    // console.log('Memory dump:', this.runtime.dumpMemoryUsage());
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
