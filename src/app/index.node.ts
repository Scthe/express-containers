import { ensureSuffix, IS_NODE, removeSuffix, staticFiles } from 'utils';
import { promises as fs } from 'fs';
import { join } from 'path';
import { InputPluginOption, OutputOptions, rollup, RollupBuild } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { createQuickJsVm } from 'quick-js';
import { quickJSContext_Dispose } from 'quick-js/context';
import { executeScriptFile } from 'quick-js/exec_script_file';
import {
  getFileContent,
  loadVirtualFileSystem_zip,
  vfsDebugTree,
  VirtualFS,
} from 'virtual-fs';
import json from '@rollup/plugin-json';

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

main();

export async function main() {
  // await initNodeStdLib();
  // const vfs = await loadVirtualFileSystem_json('init-fs.json');
  // const vfs = await loadVirtualFileSystem_json('init-fs-express-bundle.json');
  const vfs = await loadVirtualFileSystem_zip('vfs.zip');
  // console.log(vfs.basePath, Object.keys(vfs.files));
  console.log('Loaded init virtual fs');
  // vfsDebugTree(vfs);

  await build(vfs, 'static/bundled-express.js');

  /*const quickJsVm = await createQuickJsVm();
  // quickJsVm.mountFileSystem();
  const context = await quickJsVm.createContext();

  // test
  // testSimpleScript(context);
  // await executeScriptFile(context, vfs, 'index.js');
  // await executeScriptFile(context, vfs, 'express-bundle.js');

  console.log('Script finished. Disposing of the references');
  quickJSContext_Dispose(context);
  quickJsVm.shutdown();
  console.log('--- DONE ---');*/
}

async function build(vfs: VirtualFS, outputPath: string) {
  const NODE_STD_LIB = '$__node-std-lib';
  const PREFIX = `\0polyfill-node.`;
  const PREFIX_LENGTH = PREFIX.length;

  const output: OutputOptions = {
    name: 'my-app',
    file: outputPath,
    format: 'es',
  };
  const plugin: InputPluginOption = {
    name: 'loader',
    resolveId(source: string, importer: string | undefined) {
      if (importer && source.startsWith('.')) {
        source = join(removeSuffix(importer, '.js'), '..', source);
        source = source.endsWith('.json')
          ? source
          : ensureSuffix(source, '.js');
        source = source.replaceAll('\\', '/');
      }
      if (importer && source.endsWith('/.js')) {
        source = removeSuffix(source, '/.js');
      }
      source = removeSuffix(source, '/'); // remove trailing '/'
      // console.log('\nresolveId', { source, importer });

      // if (modules.hasOwnProperty(source)) {
      // return source;
      // }

      // if (importer && importer.startsWith(PREFIX) && source.startsWith('.')) {
      // const val = importer.substr(PREFIX_LENGTH).replace('.js', '');
      // source = PREFIX + join(val, '..', source) + '.js';
      // }
      // if (source.startsWith(PREFIX)) {
      // source = source.substr(PREFIX_LENGTH);
      // }
      // if (
      // mods.has(source) ||
      // (POLYFILLS as any)[source.replace('.js', '') + '.js']
      // ) {
      // const id = PREFIX + source;
      // return { id };
      // return id;
      // return source;
      // return (importer ? importer + '>' : '') + source;
      // }
      // return null;

      // node_modules\@rollup\plugin-commonjs\dist\cjs\index.js
      // node_modules\@rollup\pluginutils\dist\cjs\index.js
      const tryLoadFromDirectory = (dir: string) => {
        const source2 = removeSuffix(source, '.js');
        const modulePath = source2.startsWith(dir)
          ? source2
          : `${dir}/${source2}`;
        const mainFile = getPackageJsonMain(vfs, modulePath) || '';

        const checkFile = (fileName: string) => {
          const f = `${modulePath}${fileName}`;
          // console.log(`checkFile '${f}'`);
          const maybeText = getFileContent(vfs, f);
          return maybeText.status === 'ok' ? f : undefined;
        };
        return (
          checkFile('/' + mainFile) ||
          checkFile('/index.js') ||
          checkFile('/main.js') ||
          checkFile('.js')
        );
      };

      let subdirPath = tryLoadFromDirectory(NODE_STD_LIB);
      if (subdirPath) {
        // console.log(`Found in node-std-lib '${subdirPath}'`);
        return subdirPath;
      }
      subdirPath = tryLoadFromDirectory('node_modules');
      if (subdirPath) {
        // console.log(`Found in node_modules '${subdirPath}'`);
        return subdirPath;
      }

      return source;
    },
    load(id: string) {
      const idRaw = id;
      // if (id === 'index.js?commonjs-entry') return null;

      if (id.startsWith(PREFIX)) {
        id = id.substr(PREFIX_LENGTH);
      }
      if (id.includes('>')) {
        id = id.substring(id.lastIndexOf('>') + 1);
      }
      if (id.includes('?') || id[0] === '\0') {
        return null; // leave to commonjs plugin?!
        id = id.substring(0, id.lastIndexOf('?'));
      }
      // console.log('\nload', { id, idRaw });

      const tryLoadFromDirectory = (dir: string) => {
        const resolveOrder = [
          ...getPackageJsonMain(vfs, dir + '/' + id),
          'index.js',
          'main.js',
        ];

        const checkFile = (fileName: string) => {
          const filePath = `${dir}/${id}/${fileName}`;
          const maybeText = getFileContent(vfs, filePath);
          // console.log(`Check [${maybeText.status}]: '${filePath}'`);
          return maybeText.status === 'ok' ? maybeText.content : undefined;
        };
        let result = undefined;
        for (let candidate of resolveOrder) {
          result = result || checkFile(candidate);
        }
        return result;
      };

      let maybeText = tryLoadFromDirectory(NODE_STD_LIB);
      if (maybeText) {
        // console.log('Found in node-std-lib');
        return maybeText;
      }

      const maybeFile = getFileContent(vfs, id);
      if (maybeFile.status === 'ok') {
        // console.log(`Direct file found: '${id}'`);
        return maybeFile.content;
      }

      maybeText = tryLoadFromDirectory('node_modules');
      if (maybeText) {
        // console.log('Found in node_modules');
        return maybeText;
      }

      throw new Error(`Could not load module '${id}'`);
    },
  };

  let bundle = await rollup({
    input: 'index.js',
    external: ['fs', 'tts', 'net'],
    output,
    plugins: [
      plugin,
      commonjs({
        sourceMap: false,
        // transformMixedEsModules: true,
      }),
      json(),
    ],
  });
  // console.log(bundle.cache?.modules);
  await generateOutputs(bundle, output);
}

const getPackageJsonMain = (vfs: VirtualFS, modulePath: string): string[] => {
  const f = `${modulePath}/package.json`;
  let maybeText = getFileContent(vfs, f);
  if (maybeText.status !== 'ok') {
    // console.log(`Dir '${f}': ${maybeText.status}`);
    return [];
  }

  const pckJson = JSON.parse(maybeText.content || '');
  return [
    pckJson.main || '',
    pckJson.exports?.['.']?.import || '',
    pckJson.exports?.['.']?.require || '',
  ];
};

async function generateOutputs(bundle: RollupBuild, outputOpts: OutputOptions) {
  // console.log('------------ pre generateOutputs ------------');
  const output2 = await bundle.write(outputOpts);
  // console.log(output2);

  /*
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
  */
}
