import { promises as fs } from 'fs';
import { staticFiles } from './static_files';

// Patch utils so that files in /static can be read them on node
// SIDE EFFECTS!

staticFiles.fetchFileText = async (path: string) => {
  // console.log('fetchFileText', path);
  return fs.readFile(`./static/${path}`, { encoding: 'utf8' });
};

staticFiles.fetchFileBlob = async (path: string) => {
  // console.log('fetchFileBlob', path);
  // throw new Error('On node, fetchFileBlob() is not implemented');
  // return '?' as any;
  return fs.readFile(`./static/${path}`);
};
