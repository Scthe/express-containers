import React, {
  Fragment,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button } from './button';
import { createPortal } from 'react-dom';

export const HelpButton = ({
  id,
  dialogLabel,
  children,
}: PropsWithChildren & { id: string; dialogLabel: string }) => {
  const dialogElRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setOpen] = useState(false);

  /*const openDialog = useCallback(() => {
    const el = dialogElRef.current;
    if (el) {
      el.showModal();
    }
    el?.addEventListener('')
  }, []);*/

  useEffect(() => {
    const el = dialogElRef.current;
    if (!el) return;

    if (isOpen) {
      el.showModal();
    } else {
      el.close();
    }
  }, [isOpen]);

  const onClose = useCallback(() => {
    dialogElRef.current?.close();
    setOpen(false);
  }, [dialogElRef]);

  return (
    <Fragment>
      <Button onClick={() => setOpen(true)} small>
        Help
      </Button>

      <ReactDialogPortal isOpen={isOpen}>
        <dialog
          id={`${id}-dialog`}
          className="bg-transparent"
          ref={dialogElRef}
          onClose={() => setOpen(false)}
        >
          <section className="bg-panel text-content max-w-full w-[600px] p-6 overflow-hidden rounded-lg border-2 border-accent-500">
            <DialogCloseBtn onClick={onClose} />

            <h2 className="pt-4 mb-3 text-xl text-center md:text-4xl">
              {dialogLabel}
            </h2>
            {children}
          </section>
        </dialog>
      </ReactDialogPortal>
    </Fragment>
  );
};

export const HelpParagraph = ({ children }: PropsWithChildren) => (
  <p className="px-4 mb-2 text-center sm:text-left">{children}</p>
);

function ReactDialogPortal({
  children,
  isOpen,
}: PropsWithChildren & { isOpen: boolean }) {
  if (!isOpen) return null;

  const parentEl = document.getElementById('dialog-container')!;
  return createPortal(children, parentEl);
}

function DialogCloseBtn(props: { onClick: () => void }) {
  const size = '20px';

  return (
    <div className="absolute top-4 right-4">
      <button
        className="p-2 transition-colors text-accent-600 hover:text-accent-600/50"
        onClick={props.onClick}
        aria-label="Close the modal"
      >
        <span className="not-sr-only" aria-hidden>
          <svg
            fill="currentcolor"
            height={size}
            width={size}
            viewBox="0 0 512 512"
          >
            <g>
              <g>
                <polygon
                  points="512,59.076 452.922,0 256,196.922 59.076,0 0,59.076 196.922,256 0,452.922 59.076,512 256,315.076 452.922,512 
			512,452.922 315.076,256"
                />
              </g>
            </g>
          </svg>
        </span>
      </button>
    </div>
  );
}
