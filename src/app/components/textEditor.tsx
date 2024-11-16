import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { useDebouncedCallback } from 'use-debounce';
import { highlight, languages } from 'prismjs';
// import 'prismjs/themes/prism-twilight.css'; // low-contrast
// import 'prismjs/themes/prism-tomorrow.css'; // low-contrast
import 'prismjs/themes/prism-okaidia.css'; // low-contrast
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import { getFileContent, VirtualFS, writeFile } from 'virtual-fs';
// import './textEditor.css';

interface Props {
  vfs: VirtualFS;
  path: string;
}

/**
- https://github.com/react-simple-code-editor/react-simple-code-editor
- https://github.com/Scthe/ai-prompt-editor/blob/master/src/components/promptInput/promptInput.css

TODO how to indicate focus? Change text color? Add left/right border?
TODO opening binary files is permitted, but hangs.. User should just reload the page..
*/
export function TextEditor({ path, vfs }: Props) {
  const initText = useMemo(() => {
    const fileRead = getFileContent(vfs, path);
    return fileRead.status === 'ok' ? fileRead.content : undefined;
  }, [path, vfs]);

  const isValidFile = initText !== undefined;
  const currentContent = useRef(initText || '');
  const [code, setCode] = React.useState(initText);

  const writeToVfsNow = useCallback(() => {
    const text = currentContent.current;
    if (isValidFile) {
      // console.log(`Write to '${path}', text length ${text.length} characters`);
      writeFile(vfs, path, text);
    }
  }, [isValidFile, path, vfs]);

  const writeToVfsDebounce = useDebouncedCallback(writeToVfsNow, 100, {
    trailing: true,
    maxWait: 100,
  });

  const onUserInputChange = useCallback(
    (code: string) => {
      setCode(code);
      currentContent.current = code;
      writeToVfsDebounce();
    },
    [writeToVfsDebounce]
  );

  // guarantee store to vfs when user switches file
  useEffect(() => {
    return () => writeToVfsNow();
  }, [path, writeToVfsNow]);

  return (
    <Editor
      placeholder="This file is empty?"
      disabled={!isValidFile}
      value={code || '(Invalid file path)'}
      onValueChange={onUserInputChange}
      highlight={(code) => highlight(code, languages.js, 'js')}
      padding={10}
      style={{
        fontFamily: 'monospace',
        fontSize: '1.15em',
      }}
    />
  );
}
