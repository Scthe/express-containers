import React from 'react';

interface Props {
  visible: boolean;
}

/** https://github.com/Scthe/ai-prompt-editor/blob/master/src/components/loaders.tsx */
export default function LoaderOverlayContent({ visible }: Props) {
  if (!visible) return;

  return (
    <div
      key="loader-wrapper"
      className="absolute top-0 left-0 z-10 w-full h-full"
    >
      <div className="flex items-center justify-center w-full h-full bg-gray-400/80 dark:bg-zinc-800/80">
        <div className="absolute w-8 h-8 border-4 border-t-4 rounded-md border-accent-500 animate-spin"></div>
      </div>
    </div>
  );
}
