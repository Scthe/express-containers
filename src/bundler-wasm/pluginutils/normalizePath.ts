import type { NormalizePath } from './types';

const win32_sep = '\\';
const posix_sep = '/';

const normalizePathRegExp = new RegExp(`\\${win32_sep}`, 'g');

const normalizePath: NormalizePath = function normalizePath(filename: string) {
  return filename.replace(normalizePathRegExp, posix_sep);
};

export { normalizePath as default };
