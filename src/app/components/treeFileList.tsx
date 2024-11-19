import React, { useCallback, useEffect, useState } from 'react';
import { FileDirent, joinPath, VirtualFS } from 'virtual-fs';
import TreeView, {
  flattenTree,
  INode,
  INodeRendererProps,
  ITreeViewOnNodeSelectProps,
} from 'react-accessible-treeview';
import { DiCss3, DiJavascript, DiNpm } from 'react-icons/di';
import { FaFile, FaList, FaRegFolder, FaRegFolderOpen } from 'react-icons/fa';
import './treeFileList.css';
import { IFlatMetadata } from 'react-accessible-treeview/dist/TreeView/utils';
import classNames from 'classnames';
import { NODE_STD_LIB } from 'bundler-wasm/vfs-plugin';

const INTERNAL_FILES = [NODE_STD_LIB];

type ITreeNode = Parameters<typeof flattenTree>[0];

/** https://dgreene1.github.io/react-accessible-treeview/ */
export function TreeFileList({
  vfs,
  selectedFile,
  onFileSelected,
}: {
  vfs: VirtualFS;
  selectedFile: string;
  onFileSelected?: (path: string) => void;
}) {
  const [data, setData] = useState<INode<IFlatMetadata>[]>([]);

  // we only calcuate this once. There is no way to add new file!
  useEffect(() => {
    const data = prepareVfsForRender(vfs);
    setData(data);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelected = useCallback(
    (e: ITreeViewOnNodeSelectProps) => {
      // ignore directories
      if (e.isBranch) return;

      const path = getElementPath(data, e.element);
      // eslint-disable-next-line no-console
      console.log(`Selected file: '${path}'`);

      if (onFileSelected) {
        onFileSelected(path);
      }
    },
    [data, onFileSelected]
  );

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
        onNodeSelect={onSelected}
        nodeRenderer={(e) => (
          <ListItem key={e.element.id} {...e} selectedFile={selectedFile} />
        )}
      />
    </div>
  );
}

const ListItem = ({
  element,
  level,
  getNodeProps,
  isBranch,
  isExpanded,
  selectedFile,
}: INodeRendererProps & {
  selectedFile: string;
}) => {
  const nodeProps = getNodeProps();
  const absPath = getNodeAbsPath(element);
  const isInternal = INTERNAL_FILES.some((e) => absPath.startsWith(e));
  const isSelected = absPath === selectedFile;

  return (
    <div
      {...nodeProps}
      style={{ paddingLeft: 20 * (level - 1) }}
      className={classNames(
        nodeProps.className,
        isSelected && 'tree-node--selected_my'
      )}
    >
      <div className={classNames('pl-2', isInternal && 'opacity-40')}>
        <div className={classNames('inline-block relative top-[5px]')}>
          {isBranch ? (
            <FolderIcon isOpen={isExpanded} />
          ) : (
            <FileIcon filename={element.name} />
          )}
        </div>

        <span>{element.name}</span>
      </div>
    </div>
  );
};

const FolderIcon = (props: { isOpen: boolean }) =>
  props.isOpen ? (
    <FaRegFolderOpen color="e8a87c" className="icon" aria-hidden />
  ) : (
    <FaRegFolder color="e8a87c" className="icon" aria-hidden />
  );

const FileIcon = ({ filename }: { filename: string }) => {
  if (filename.toLowerCase() === 'package.json') {
    return <DiNpm color="red" className="icon" aria-hidden />;
  }

  const extension = filename.slice(filename.lastIndexOf('.') + 1);
  switch (extension) {
    case 'js':
    case 'mjs':
      return <DiJavascript color="yellow" className="icon" aria-hidden />;
    case 'css':
      return <DiCss3 color="turquoise" className="icon" aria-hidden />;
    case 'json':
      return <FaList color="yellow" className="icon" aria-hidden />;
    case 'npmignore':
      return <DiNpm color="red" className="icon" aria-hidden />;
    case 'html':
      return <FaFile color="red" className="icon" aria-hidden />;
    case 'txt':
    case 'md':
      return <FaFile color="grey" className="icon" aria-hidden />;
    default:
      return null;
  }
};

const getElementPath = (
  data: INode<IFlatMetadata>[],
  element: INode<IFlatMetadata>
): string => {
  const path = [];
  while (element && element.parent !== null) {
    path.push(element.name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    element = data[element.parent as any];
  }

  path.reverse();
  return joinPath(path);
};

const getNodeAbsPath = (e: INode<IFlatMetadata>): string =>
  String(e?.metadata?.absPath || '-');

function prepareVfsForRender(vfs: VirtualFS) {
  const addFiles = (
    absPath: string,
    fileName: string,
    entry: FileDirent
  ): ITreeNode => {
    const metadata = { absPath };

    if (entry.type === 'file') {
      return { name: fileName, metadata };
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
    files.forEach((fileName) => {
      const child = entry.files[fileName];
      if (child) {
        children.push(addFiles(joinPath([absPath, fileName]), fileName, child));
      }
    });

    return { name: fileName, children, metadata };
  };

  const tree = addFiles('', '', { type: 'directory', files: vfs.files });
  return flattenTree(tree);
}
