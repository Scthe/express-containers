import { useCallback, useEffect, useState } from 'react';
import { getFileContent, VirtualFS } from 'virtual-fs';

const isFileOk = (vfs: VirtualFS, path: string) =>
  getFileContent(vfs, path).status === 'ok';

export function useSelectedFile(
  vfs: VirtualFS,
  initialFile: string
): [string, (f: string) => void] {
  const [selectedFile, setSelectedFile] = useState(initialFile);

  const changeSelectedFile = useCallback(
    (path: string) => {
      if (isFileOk(vfs, path)) {
        setSelectedFile(path);
      }
    },
    [vfs]
  );

  // verify initial file
  useEffect(() => {
    if (isFileOk(vfs, initialFile)) return;
    const files = Object.keys(vfs.files).sort();

    for (const name of files) {
      if (isFileOk(vfs, name)) {
        setSelectedFile(name);
        break;
      }
    }
  }, [initialFile, vfs]);

  return [selectedFile, changeSelectedFile];
}
