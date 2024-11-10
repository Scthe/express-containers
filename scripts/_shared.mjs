import { promises as fsAsync } from 'fs';
import path from 'path';

const isValidExt = (path) => {
  const p = path.toLowerCase();
  return (
    p.endsWith('.js') ||
    p.endsWith('.mjs') ||
    p.endsWith('.cjs') ||
    p.endsWith('.json') ||
    p.includes('license') ||
    p.indexOf('.') === -1 // executables
  );
};

export const listFiles = async (rootPath, virtualRootPath) => {
  virtualRootPath = virtualRootPath === undefined ? rootPath : virtualRootPath;
  const files = await fsAsync.readdir(rootPath, { recursive: true });
  // console.log(files);

  const result = [];

  for (const pathVirtual of files) {
    // console.log(pathVirtual);

    const pathHdd = path.join(rootPath, pathVirtual);
    const stat = await fsAsync.stat(pathHdd);
    if (!stat.isFile() || !isValidExt(pathVirtual)) continue;

    result.push({
      pathHdd,
      virtualPath: path.join(virtualRootPath, pathVirtual),
    });
  }

  return result;
};

export const copyFiles = (path) => listFiles(path, path);

export const resolveFromPackageJson = async (moduleNames) => {
  // const text = await fsAsync.readFile('package.json', { encoding: 'utf-8' });
  // const json = JSON.parse(text);
  // const dependencies = { ...json.devDependencies, ...json.dependencies };
  // console.log(dependencies);

  return moduleNames.map((moduleName) => {
    // if (!dependencies[moduleName]) {
    // throw new Error(`Unknown module '${moduleName}'`);
    // }
    // let name = dependencies[moduleName];
    // if (name.startsWith('npm:')) {
    // name = name.substring(4, name.indexOf('@'));
    // }
    let name = moduleName;
    return `node_modules/${name}`;
  });
};
