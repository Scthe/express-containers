const fsAsync = require('fs').promises;
const path = require('path');

async function main(vfsRoot) {
  const allFiles = await fsAsync.readdir(vfsRoot, { recursive: true });
  // console.log(allFiles);
  const addedFiles = [];

  for (let filePath of allFiles) {
    const pathDisc = path.join(vfsRoot, filePath);
    const stat = await fsAsync.stat(pathDisc);
    if (stat.isFile()) {
      filePath = filePath.replaceAll('\\', '/');
      addedFiles.push(filePath);
    }
  }

  await fsAsync.writeFile(
    `${vfsRoot}.json`,
    JSON.stringify({ files: addedFiles })
  );
}

main('static/init-fs');
