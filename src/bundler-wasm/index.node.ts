import { promises as fs } from 'fs';
import { loadVirtualFileSystem_zip } from 'virtual-fs/loaders';
import { buildBundle, createBundleOutput } from './bundle';
import '../utils/static_files.node';

const VFS_FILENAME = 'vfs.zip';
const OUTPUT_PATH = 'static/bundled-express.js';

export async function main(outputFile: string) {
  console.log(`Loading virtual file system from '${VFS_FILENAME}'..`);
  const vfs = await loadVirtualFileSystem_zip(VFS_FILENAME);
  // vfsDebugTree(vfs);

  console.log('Running rollup to unify the code (handle CommonJS)..');
  // await build(vfs, outputFile);
  const bundleOutputOpts = createBundleOutput(outputFile);
  const bundle = await buildBundle(vfs, bundleOutputOpts);
  console.log(`Writing bundled code to '${outputFile}'..`);
  const _output = await bundle.write(bundleOutputOpts);

  // stats
  const outStats = await fs.stat(outputFile);
  const sizeMb = outStats.size / 1024 / 1024;
  console.log(
    `Written bundled app to '${outputFile}' (${sizeMb.toFixed(1)}MB).` // prettier-ignore
  );
}

main(OUTPUT_PATH);
