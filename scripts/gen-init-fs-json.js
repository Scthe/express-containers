const fsAsync = require('fs').promises;
const path = require('path');

// TODO unused

const isValidExt = (path) => {
  const p = path.toLowerCase();
  return (
    p.endsWith('.js') ||
    p.endsWith('.mjs') ||
    p.endsWith('.json') ||
    p.includes('license') ||
    p.indexOf('.') === -1 // executables
  );
};
module.exports = { isValidExt };

async function main(vfsRoot) {
  const allFiles = await fsAsync.readdir(vfsRoot, { recursive: true });
  // console.log(allFiles);
  const addedFiles = [];

  for (let filePath of allFiles) {
    const pathDisc = path.join(vfsRoot, filePath);
    const stat = await fsAsync.stat(pathDisc);
    if (stat.isFile() && isValidExt(filePath)) {
      filePath = filePath.replaceAll('\\', '/');
      addedFiles.push(filePath);
    }
  }

  const outFile = `${vfsRoot}.json`;
  await fsAsync.writeFile(
    outFile,
    JSON.stringify(
      {
        basePath: vfsRoot.substring('static/'.length),
        files: addedFiles,
      },
      undefined,
      2
    )
  );
  console.log(`Created: '${outFile}'`);
}

if (!module.parent) {
  main('static/init-fs');
  main('static/init-fs-express');
}
