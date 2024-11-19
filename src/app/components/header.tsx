import React, { PropsWithChildren, useCallback } from 'react';
import { HelpButton, HelpParagraph } from './helpButton';
import { Toggle } from './toggle';
import { ShownFileSystem } from 'app/model/useShownFileSystem';
import { LogOriginBadge } from './logsPanel';
import { Button } from './button';
import classNames from 'classnames';

const TitleRow = (props: PropsWithChildren & { title: string }) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-xl">{props.title}</h2>
      {props.children}
    </div>
  );
};

const Header = (props: PropsWithChildren) => (
  <div className="px-3 mt-2 mb-2">{props.children}</div>
);

export const HeaderFiles = (props: {
  shownFileSystem: ShownFileSystem;
  hasBundleFileSystem: boolean;
  onFileSystemChange?: (fs: ShownFileSystem) => void;
}) => {
  const { onFileSystemChange } = props;
  const changeFileSystem = useCallback(
    (enabled: boolean) => onFileSystemChange?.(enabled ? 'bundle' : 'files'),
    [onFileSystemChange]
  );

  return (
    <Header>
      <TitleRow title="Files">
        <HelpButton id="help-files" dialogLabel="Files">
          <HelpParagraph>
            <Emph>Content of the virtual file system.</Emph> This is what the
            app sees as files. Since we do not have access to the hard drive we
            emulate one.
          </HelpParagraph>
          <HelpParagraph>
            You can <Emph>edit any file you want.</Emph> If you screw something
            up, refresh the page.
          </HelpParagraph>
          <HelpParagraph>
            <span className="opacity-40">Greyed-out</span> files are for
            internal use. Feel free to edit them too.
          </HelpParagraph>
          <HelpParagraph>
            If the server is running,{' '}
            <Emph>you can view the bundled code too.</Emph>
          </HelpParagraph>
        </HelpButton>
      </TitleRow>

      {props.hasBundleFileSystem ? (
        <div className="mt-2">
          <Toggle
            small
            checked={props.shownFileSystem === 'bundle'}
            id="show-bundle-content"
            onChecked={changeFileSystem}
            srLabel="Show bundle content"
          >
            <span className="inline-block ml-2">Show bundle content</span>
          </Toggle>
        </div>
      ) : null}
    </Header>
  );
};

export const HeaderTextEditor = (props: { filepath: string }) => {
  return (
    <Header>
      <TitleRow title={props.filepath}></TitleRow>
    </Header>
  );
};

export const HeaderOutput = (props: {
  stopServerDisabled?: boolean;
  onStopTheServer?: () => void;
}) => {
  return (
    <Header>
      <TitleRow title="Server output">
        <div className="flex gap-2">
          {props.onStopTheServer ? (
            <Button
              small
              danger
              onClick={props.onStopTheServer}
              disabled={Boolean(props.stopServerDisabled)}
            >
              Stop the server
            </Button>
          ) : null}

          <HelpButton id="help-output" dialogLabel="Server output">
            <HelpParagraph>
              Server management. Use this panel to{' '}
              <Emph>start and stop the server</Emph>.
            </HelpParagraph>
            <HelpParagraph>
              Try editing the files and restarting the server. Any changes you
              make are then applied. For example, replace the endpoint return
              value or the HTML template.
            </HelpParagraph>
            <HelpParagraph>
              <Emph sectionTitle>Fetch</Emph>
              When the server is running,{' '}
              <Emph>press the &quot;Fetch()&quot; button</Emph> to execute a
              sample request. You can also try endpoints that return responses
              with status codes 404 or 500. If a service worker is used, the
              request will show up in the dev tools network tab.
            </HelpParagraph>
            <HelpParagraph>
              <Emph sectionTitle>Iframe</Emph>
              Using service worker, we can intercept iframe requests. Navigation
              inside the iframe also works.
            </HelpParagraph>
          </HelpButton>
        </div>
      </TitleRow>
    </Header>
  );
};

export const HeaderLogs = (props: {
  isAutoScroll: boolean;
  setAutoScroll: (b: boolean) => void;
  clearLogs: () => void;
}) => {
  return (
    <Header>
      <TitleRow title="Logs">
        <div className="flex gap-2">
          <Toggle
            small
            checked={props.isAutoScroll}
            id="logs-autoscroll"
            onChecked={props.setAutoScroll}
            srLabel="Autoscroll"
          >
            <span className="inline-block ml-2">Autoscr.</span>
          </Toggle>

          <Button small danger onClick={props.clearLogs}>
            Clear
          </Button>

          <HelpButton id="help-logs" dialogLabel="Logs">
            <HelpParagraph>
              Logs from both the host and QuickJS. Uses overridden console.log()
              internally.
            </HelpParagraph>
            <HelpParagraph>
              <LogOriginBadge origin="host" /> are messages originating from
              your browser. Usually UI-related.
            </HelpParagraph>
            <HelpParagraph>
              <LogOriginBadge origin="vm" /> are messages originating from
              QuickJS. It&apos;s the JavaScript engine that executes the code
              for the Express server.
            </HelpParagraph>
            {/* 
            <HelpParagraph>
              <LogOriginBadge origin="service_worker" /> are messages from the
              service worker that intercepts all network connections. Requests
              to the Express server are redirected into QuickJS, rest are left
              untouched.
            </HelpParagraph>
             */}
          </HelpButton>
        </div>
      </TitleRow>
    </Header>
  );
};

const Emph = ({
  children,
  sectionTitle,
}: React.PropsWithChildren & { sectionTitle?: boolean }) => (
  <span
    className={classNames(
      'text-accent-400',
      sectionTitle && 'inline-block mr-2 uppercase'
    )}
  >
    {children}
  </span>
);
