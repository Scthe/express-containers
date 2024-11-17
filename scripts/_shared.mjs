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

export const copyFiles = async (rootPath, virtualRootPath) => {
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
