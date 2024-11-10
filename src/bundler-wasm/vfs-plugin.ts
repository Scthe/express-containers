import { ensureSuffix, removeSuffix } from 'utils';
import { join } from 'path';
import { InputPluginOption } from 'rollup';
import { getFileContent, VirtualFS } from 'virtual-fs';

const NODE_STD_LIB = '$__node-std-lib';
const PREFIX = `\0polyfill-node.`;
const PREFIX_LENGTH = PREFIX.length;

export const vfsPlugin = (vfs: VirtualFS): InputPluginOption => {
  return {
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
};

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
