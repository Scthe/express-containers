import { useState } from 'react';
import { VirtualFS } from 'virtual-fs';

export type ShownFileSystem = 'files' | 'bundle';

export function useShownFileSystem(
  fileSystem_Files: VirtualFS,
  fileSystem_Bundle: VirtualFS | undefined
) {
  const [shownFileSystem, setShownFileSystem] =
    useState<ShownFileSystem>('files');

  return {
    shownFileSystem,
    setShownFileSystem,
    hasBundleFileSystem: fileSystem_Bundle !== undefined,
    fileSystem:
      fileSystem_Bundle !== undefined && shownFileSystem === 'bundle'
        ? fileSystem_Bundle
        : fileSystem_Files,
  };
}
