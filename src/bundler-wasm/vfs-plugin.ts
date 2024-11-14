import { ensurePrefix, ensureSuffix, removeSuffix, replaceSuffix } from 'utils';
import { join } from 'path';
import { InputPluginOption } from 'rollup';
import { getFileContent, VirtualFS } from 'virtual-fs';

const NODE_STD_LIB = '$__node-std-lib';

export const vfsPlugin = (vfs: VirtualFS): InputPluginOption => {
  return {
    name: 'loader',
    resolveId(source: string, importer: string | undefined) {
      const orgSource = source;
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
      // console.log('\nresolveId', { source, importer, orgSource });

      const tryLoadFromDirectory = (dir: string) => {
        const source2 = removeSuffix(source, '.js');
        const modulePath = ensurePrefix(source2, dir + '/');

        return resolveDirectoryImport(vfs, modulePath, (filePath: string) => {
          const maybeText = getFileContent(vfs, filePath);
          // console.log(`[resolveId] Check [${maybeText.status}] '${filePath}'`);
          return maybeText.status === 'ok' ? filePath : undefined;
        });
      };

      const maybeFile = getFileContent(vfs, source);
      if (maybeFile.status === 'ok') {
        return source;
      }

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

      return null;
      // return source;
    },
    load(id: string) {
      const idRaw = id;
      // if (id === 'index.js?commonjs-entry') return null;

      if (id.includes('?') || id[0] === '\0') {
        return null; // leave to commonjs plugin?!
        // id = id.substring(0, id.lastIndexOf('?'));
      }
      // console.log('\nload', { id, idRaw });

      const tryLoadFromDirectory = (dir: string) => {
        return resolveDirectoryImport(
          vfs,
          `${dir}/${id}`,
          (filePath: string) => {
            filePath = removeSuffix(filePath, '/'); // remove trailing '/'
            const maybeText = getFileContent(vfs, filePath);
            // console.log(`[load] Check [${maybeText.status}] '${filePath}'`);
            return maybeText.status === 'ok' ? maybeText.content : undefined;
          }
        );
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
    pckJson.browser || '',
    pckJson.main || '',
    pckJson.exports?.['.']?.import || '',
    pckJson.exports?.['.']?.require || '',
  ];
};

const resolveDirectoryImport = <T>(
  vfs: VirtualFS,
  dir: string,
  checkFile: (filePath: string) => T
) => {
  const resolveOrder = [
    '',
    ...getPackageJsonMain(vfs, dir),
    'index.js',
    'main.js',
    '.js',
  ];

  let result = undefined;
  for (let candidate of resolveOrder) {
    // [load] Check [error] '$__node-std-lib/node_modules/body-parser/lib/read.js/.js'
    let path = `${dir}/${candidate}`;
    path = replaceSuffix(path, '/.js', '.js');
    path = replaceSuffix(path, '.js.js', '.js');
    result = result || checkFile(path);
  }
  return result;
};
