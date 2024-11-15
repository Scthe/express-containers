import { loadVirtualFileSystem_zip } from 'virtual-fs/loaders';
import { createBundleOutput, buildBundle } from 'bundler-wasm/bundle';
import { vfsDebugTree } from 'virtual-fs';

const VFS_FILENAME = 'vfs.zip';
const OUTPUT_PATH = 'static/bundled-express.js';

globalThis.process = {
  cwd: () => '',
};

const ROLLUP_WASM_FILE = 'bindings_wasm_bg.wasm';
const orgURL = URL;
globalThis.URL = function () {
  const args = Array.from(arguments);
  // console.log('URL', arguments);
  if (args[0] === ROLLUP_WASM_FILE) {
    const url = new orgURL('bindings_wasm_bg.wasm', window.location.href);
    // console.log(url);
    // console.log(typeof url.href);
    // return url.href;
    return new Request(url.href);
  }
  return new orgURL(...args);
};

export async function main(outputFile: string) {
  console.log(`Loading virtual file system from '${VFS_FILENAME}'..`);
  const vfs = await loadVirtualFileSystem_zip(VFS_FILENAME);
  // vfsDebugTree(vfs);

  console.log('Running rollup to unify the code (handle CommonJS)..');
  const bundleOutputOpts = createBundleOutput(outputFile);
  const bundle = await buildBundle(vfs, bundleOutputOpts);
  const { output } = await bundle.generate(bundleOutputOpts);

  for (const chunkOrAsset of output) {
    if (chunkOrAsset.type === 'asset') {
      // For assets, this contains
      // {
      //   fileName: string,              // the asset file name
      //   source: string | Uint8Array    // the asset source
      //   type: 'asset'                  // signifies that this is an asset
      // }
      console.log('Asset', chunkOrAsset);
    } else {
      // For chunks, this contains
      // {
      //   code: string,                  // the generated JS code
      //   dynamicImports: string[],      // external modules imported dynamically by the chunk
      //   exports: string[],             // exported variable names
      //   facadeModuleId: string | null, // the id of a module that this chunk corresponds to
      //   fileName: string,              // the chunk file name
      //   implicitlyLoadedBefore: string[]; // entries that should only be loaded after this chunk
      //   imports: string[],             // external modules imported statically by the chunk
      //   importedBindings: {[imported: string]: string[]} // imported bindings per dependency
      //   isDynamicEntry: boolean,       // is this chunk a dynamic entry point
      //   isEntry: boolean,              // is this chunk a static entry point
      //   isImplicitEntry: boolean,      // should this chunk only be loaded after other chunks
      //   map: string | null,            // sourcemaps if present
      //   modules: {                     // information about the modules in this chunk
      //     [id: string]: {
      //       renderedExports: string[]; // exported variable names that were included
      //       removedExports: string[];  // exported variable names that were removed
      //       renderedLength: number;    // the length of the remaining code in this module
      //       originalLength: number;    // the original length of the code in this module
      //       code: string | null;       // remaining code in this module
      //     };
      //   },
      //   name: string                   // the name of this chunk as used in naming patterns
      //   preliminaryFileName: string    // the preliminary file name of this chunk with hash placeholders
      //   referencedFiles: string[]      // files referenced via import.meta.ROLLUP_FILE_URL_<id>
      //   type: 'chunk',                 // signifies that this is a chunk
      // }
      console.log('------ Result chunk ------');
      console.log('Chunk', chunkOrAsset.modules);
      console.log('------ Result code ------');
      // console.log(chunkOrAsset.code);
      console.log(chunkOrAsset);
    }
  }
}

main(OUTPUT_PATH);
