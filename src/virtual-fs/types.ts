export type FileNode = {
  type: 'file';
  // content: string | undefined; // lazy init
  content: string;
};

export type DirNode = {
  type: 'directory';
  files: Record<string, FileDirent | undefined>;
};

/** Dirent - entry in the filesystem, either file or directory */
export type FileDirent = FileNode | DirNode;

export type VirtualFS = {
  // basePath: string;
  files: Record<string, FileDirent | undefined>;
};

export type Path = string | string[];

/** https://nodejs.org/api/errors.html#common-system-errors */
export type FileError = 'e-no-entry' | 'e-not-a-file';

export type FileReadResult<T> =
  | ({ status: 'ok' } & T)
  | { status: 'error'; error: FileError };
export const ok = <T>(e: T) => ({ status: 'ok' as const, ...e });
export const err = (error: FileError) => ({ status: 'error' as const, error });
