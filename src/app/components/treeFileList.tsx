import React, { useEffect, useState } from 'react';
import { FileDirent, joinPath, VirtualFS } from 'virtual-fs';
import TreeView, { flattenTree, INode } from 'react-accessible-treeview';
import { DiCss3, DiJavascript, DiNpm } from 'react-icons/di';
import { FaFile, FaList, FaRegFolder, FaRegFolderOpen } from 'react-icons/fa';
import './treeFileList.css';
import { IFlatMetadata } from 'react-accessible-treeview/dist/TreeView/utils';

type ITreeNode = Parameters<typeof flattenTree>[0];

/** https://dgreene1.github.io/react-accessible-treeview/ */
export function TreeFileList({
  vfs,
  onFileSelected,
}: {
  vfs: VirtualFS;
  onFileSelected?: (path: string) => void;
}) {
  const [data, setData] = useState<INode<IFlatMetadata>[]>([]);

  // we only calcuate this once. There is no way to add new file!
  useEffect(() => {
    const data = prepareVfsForRender(vfs);
    setData(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty =
    data.length === 0 || data.every((e) => e.children.length === 0);
  if (isEmpty) {
    return <div className="px-4 text-center text-md opacity-60">(empty)</div>;
  }

  return (
    <div className="px-4 directory text-md">
      <TreeView
        data={data}
        aria-label="directory tree"
        onNodeSelect={(e) => {
          // ignore directories
          if (e.isBranch) return;

          // console.log('onNodeSelect', e);
          let element = e.element;
          const path = [];
          while (element && element.parent !== null) {
            path.push(element.name);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            element = data[element.parent as any];
          }

          path.reverse();
          console.log('Selected', path);

          if (onFileSelected) onFileSelected(joinPath(path));
        }}
        nodeRenderer={({
          element,
          isBranch,
          isExpanded,
          getNodeProps,
          level,
        }) => (
          <div {...getNodeProps()} style={{ paddingLeft: 20 * (level - 1) }}>
            <div className="inline-block relative top-[5px] ml-2">
              {isBranch ? (
                <FolderIcon isOpen={isExpanded} />
              ) : (
                <FileIcon filename={element.name} />
              )}
            </div>

            <span>{element.name}</span>
          </div>
        )}
      />
    </div>
  );
}

const FolderIcon = (props: { isOpen: boolean }) =>
  props.isOpen ? (
    <FaRegFolderOpen color="e8a87c" className="icon" />
  ) : (
    <FaRegFolder color="e8a87c" className="icon" />
  );

const FileIcon = ({ filename }: { filename: string }) => {
  if (filename.toLowerCase() === 'package.json') {
    return <DiNpm color="red" className="icon" />;
  }

  const extension = filename.slice(filename.lastIndexOf('.') + 1);
  switch (extension) {
    case 'js':
    case 'mjs':
      return <DiJavascript color="yellow" className="icon" />;
    case 'css':
      return <DiCss3 color="turquoise" className="icon" />;
    case 'json':
      return <FaList color="yellow" className="icon" />;
    case 'npmignore':
      return <DiNpm color="red" className="icon" />;
    case 'txt':
    case 'md':
      return <FaFile color="grey" className="icon" />;
    default:
      return null;
  }
};

function prepareVfsForRender(vfs: VirtualFS) {
  const addFiles = (fileName: string, entry: FileDirent): ITreeNode => {
    if (entry.type === 'file') {
      return { name: fileName };
    }

    const files = Object.keys(entry.files).sort((a, b) => {
      const fileA = entry.files[a];
      const fileB = entry.files[b];
      if (!fileA) return 1;
      if (!fileB) return -1;
      if (fileA.type === fileB.type) return a.localeCompare(b);
      return fileA.type === 'directory' ? -1 : 1;
    });
    const children: ITreeNode[] = [];
    files.forEach((k) => {
      const child = entry.files[k];
      if (child) {
        children.push(addFiles(k, child));
      }
    });

    return { name: fileName, children };
  };

  const tree = addFiles('', { type: 'directory', files: vfs.files });
  return flattenTree(tree);
}
