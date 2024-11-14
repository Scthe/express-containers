export * from 'browserify-url';
export * from './fileURLToPath';

// import { resolve as pathResolve } from 'path';

// https://github.com/sindresorhus/file-url/blob/main/index.js
// https://github.com/sindresorhus/file-url/blob/main/license
export const pathToFileURL = (filePath, options = {}) => {
  if (typeof filePath !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof filePath}`);
  }

  const { resolve = true } = options;

  let pathName = filePath;
  if (resolve) {
    // pathName = pathResolve(filePath); // TODO
  }

  pathName = pathName.replace(/\\/g, '/');

  // Windows drive letter must be prefixed with a slash.
  if (pathName[0] !== '/') {
    pathName = `/${pathName}`;
  }

  // Escape required characters for path components.
  // See: https://tools.ietf.org/html/rfc3986#section-3.3
  return encodeURI(`file://${pathName}`).replace(/[?#]/g, encodeURIComponent);
};
