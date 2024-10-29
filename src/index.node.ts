import { main } from 'index';
import { staticFiles } from 'utils';
import { promises as fs } from 'fs';
import { join } from 'path';

staticFiles.fetchFileText = async (path: string) => {
  // console.log('fetchFileText', path);
  return fs.readFile(`./static/${path}`, { encoding: 'utf8' });
};

staticFiles.fetchFileBlob = async (path: string) => {
  // console.log('fetchFileBlob', path);
  throw new Error('On node, fetchFileBlob() is not implemented');
  return '?';
};

main();
