import fs, { promises as fsAsync } from 'fs';
import JSZip from 'jszip';
import { copyFiles } from './_shared.mjs';

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
    .on('end', async () => {
      const outStats = await fsAsync.stat(outputPath);
      const sizeMb = outStats.size / 1024 / 1024;

      // eslint-disable-next-line no-console
      console.log(
        `Written virtual filesystem zip to '${outputPath}'. Total ${fileCount} files (${sizeMb.toFixed(1)}MB).` // prettier-ignore
      );
    })
    .pipe(fs.createWriteStream(outputPath));
}

const APP_ROOT = 'example-app';
const INTERNAL_LIBS = '$__node-std-lib';

const FILE_LIST = await Promise.all([
  // add app files into './'. Includes 'package.json', 'index.js', and 'node_modules' with express.
  copyFiles(APP_ROOT, ''),

  // add dependencies required by:
  // - browserify mocks
  // - my standard library mocks (start with browserify-*)
  copyFiles('extra-dependencies/node_modules', INTERNAL_LIBS),

  // add node standard lib replacement into '/$__node-std-lib'
  copyFiles('src/node-std-lib', INTERNAL_LIBS),

  // ipaddr.js has an.. unfortunate name
  // normally you would handle this by better bundler,
  // but I'm too lazy
  copyFiles(`${APP_ROOT}/node_modules/ipaddr.js/lib`, INTERNAL_LIBS),
]).then((e) => e.flat());
// console.log(FILE_LIST);

createZipFS(FILE_LIST, 'static/vfs.zip');
