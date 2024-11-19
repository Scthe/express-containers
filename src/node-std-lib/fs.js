export default {
  __fakeFs: true,
  stat,
  createReadStream,
  ReadStream,
};

function ReadStream() {}

export function stat(path, callback) {
  const hostStat = __platform_fs_stat(path);
  const isDirectory = hostStat === 'directory';
  const isFile = hostStat === 'file';
  console.log(`fs.stat '${path}', hostStat='${hostStat}'`);

  if (isDirectory || isFile) {
    const stats = mockStats(isDirectory);
    callback(undefined, stats);
  } else {
    const fakeErr = new Error(`File '${path}' does not exist`);
    fakeErr.code = 'ENOENT';
    callback(fakeErr, undefined);
  }
}

export function createReadStream(path, options) {
  console.log(`fs.createReadStream '${path}'`);
  const hostFileContent = __platform_fs_createReadStream(path);

  const stream = new ReadStream();
  stream.destroy = () => undefined;

  stream.on = (ev, cb) => {
    // console.log('fs::createReadStream::on', ev);
    switch (ev) {
      case 'end': {
        cb();
        return;
      }
      case 'error': {
        if (!hostFileContent) {
          const fakeErr = new Error(`File '${path}' does not exist`);
          cb(fakeErr);
        }
      }
    }
  };

  stream.pipe = (respStream) => {
    // respStream is the original response object provided to the express app
    // console.log('fs::createReadStream::pipe', Object.keys(respStream));
    respStream.data = hostFileContent;
  };

  return stream;
}

const mockStats = (isDirectory = false) => {
  const date = new Date();
  const dateMs = date.getTime();

  return {
    isDirectory: () => isDirectory,
    atimeMs: dateMs,
    mtimeMs: dateMs,
    ctimeMs: dateMs,
    birthtimeMs: dateMs,
    atime: date,
    mtime: date,
    ctime: date,
    birthtime: date,
    // https://nodejs.org/api/fs.html#fsstatpath-options-callback
    // isstats() has following comment: "// quack quack"
    // I like isstats().
    dev: 16777220,
    mode: 16877,
    nlink: 3,
    uid: 501,
    gid: 20,
    rdev: 0,
    blksize: 4096,
    ino: 14214262,
    size: 96,
    blocks: 0,
  };
};
