import { staticFiles } from 'utils';
import { promises as fs } from 'fs';
import { OutputOptions, rollup } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { loadVirtualFileSystem_zip, VirtualFS } from 'virtual-fs';
import json from '@rollup/plugin-json';
import { vfsPlugin } from './vfs-plugin';

staticFiles.fetchFileText = async (path: string) => {
  // console.log('fetchFileText', path);
  return fs.readFile(`./static/${path}`, { encoding: 'utf8' });
};

staticFiles.fetchFileBlob = async (path: string) => {
  // console.log('fetchFileBlob', path);
  // throw new Error('On node, fetchFileBlob() is not implemented');
  // return '?' as any;
  return fs.readFile(`./static/${path}`);
};

main('static/bundled-express.js');

export async function main(outputFile: string) {
  // const vfs = await loadVirtualFileSystem_json('init-fs.json');
  // const vfs = await loadVirtualFileSystem_json('init-fs-express-bundle.json');
  const vfs = await loadVirtualFileSystem_zip('vfs.zip');
  console.log('Loaded init virtual fs');
  // vfsDebugTree(vfs);

  await build(vfs, outputFile);

  // stats
  const outStats = await fs.stat(outputFile);
  const sizeMb = outStats.size / 1024 / 1024;
  console.log(
    `Written bundled app to '${outputFile}' (${sizeMb.toFixed(1)}MB).` // prettier-ignore
  );
}

async function build(vfs: VirtualFS, outputPath: string) {
  const output: OutputOptions = {
    name: 'my-app',
    file: outputPath,
    format: 'es',
  };

  let bundle = await rollup({
    input: 'index.js',
    external: ['fs', 'tts', 'net'],
    output,
    plugins: [
      vfsPlugin(vfs),
      commonjs({
        sourceMap: false,
        // transformMixedEsModules: true,
      }),
      json(),
    ],
  });
  // console.log(bundle.cache?.modules);
  // await generateOutputs(bundle, output);

  const _output = await bundle.write(output);
}

/*
async function generateOutputs(bundle: RollupBuild, outputOpts: OutputOptions) {
  // console.log('------------ pre generateOutputs ------------');
  // console.log(output2);
  // replace bundle.generate with bundle.write to directly write to disk
  const { output } = await bundle.generate(outputOpts);

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
*/
