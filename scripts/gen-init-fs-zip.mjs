import fs, { promises as fsAsync } from 'fs';
import JSZip from 'jszip';
import { listFiles, copyFiles, resolveFromPackageJson } from './_shared.mjs';

async function createZipFS(files, outputPath) {
  const zip = new JSZip();
  let fileCount = 0;

  await Promise.all(
    files.map(async (pathVirtual) => {
      const { pathHdd, virtualPath } = pathVirtual;
      const content = await fsAsync.readFile(pathHdd, {
        encoding: 'utf-8',
      });
      zip.file(virtualPath, content);
      fileCount += 1;
    })
  );

  zip
    .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
    .pipe(fs.createWriteStream(outputPath));

  const outStats = await fsAsync.stat(outputPath);
  const sizeMb = outStats.size / 1024 / 1024;

  console.log(
    `Written virtual filesystem zip to '${outputPath}'. Total ${fileCount} files (${sizeMb.toFixed(1)}MB).` // prettier-ignore
  );
}

const stdLibSupports = await resolveFromPackageJson([
  'browserify-events',
  'browserify-is-arguments',
  'browserify-is-generator-function',
  'browserify-is-typed-array',
  'browserify-stream',
  'browserify-which-typed-array',
]);

const FILE_LIST = await Promise.all([
  // add app files into './'. Includes 'package.json', 'index.js', and 'node_modules' with express.
  listFiles('_references/vfs-content-0/init-fs-express', ''),
  // add node standard lib replacement into '/$__node-std-lib'
  listFiles('src/node-std-lib', '$__node-std-lib'),
  // add external modules required by standard lib replacement into '/node_modules'
  copyFiles('node_modules/pathe'),
  copyFiles('node_modules/native-url'),
  copyFiles('node_modules/readable-stream'),
  copyFiles('node_modules/string_decoder'),
  // add browserify's replacements into '/node_modules'
  ...stdLibSupports.map((e) => listFiles(e)),
  // ipaddr.js has an.. unfortunate name
  listFiles('_references/vfs-content-0/init-fs-express/node_modules/ipaddr.js/lib', ''), // prettier-ignore
]).then((e) => e.flat());
// console.log(FILE_LIST);

createZipFS(FILE_LIST, 'static/vfs.zip');
