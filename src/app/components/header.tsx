import React, { PropsWithChildren, useCallback } from 'react';
import { HelpButton, HelpParagraph } from './helpButton';
import { Toggle } from './toggle';
import { ShownFileSystem } from 'app/model/useShownFileSystem';
import { LogOriginBadge } from './logsPanel';

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
            The content of the virtual file system. This is what the app sees as
            files. Since we do not have access to the hard drive we emulate one.
          </HelpParagraph>
          <HelpParagraph>
            You can edit any file you want. If you screw something up, just
            refresh the page.
          </HelpParagraph>
          <HelpParagraph>
            <span className="opacity-40">Greyed-out</span> files are for
            internal use. Feel free to edit them too.
          </HelpParagraph>
          <HelpParagraph>
            If the server is running, you view the bundled code too.
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

export const HeaderOutput = () => {
  return (
    <Header>
      <TitleRow title="Server output">
        <HelpButton id="help-output" dialogLabel="Server output">
          <HelpParagraph>
            Server management. Use this panel to start and stop the server.
          </HelpParagraph>
          <HelpParagraph>
            Try editing the files and restarting the server. Any changes you did
            will be then applied. For example, replace the endpoint return value
            or the HTML template.
          </HelpParagraph>
          <HelpParagraph>
            When the server is running, press the &quot;Fetch from the
            server&quot; button to execute a sample request. You can also try
            endpoints that return responses with status codes 404 or 500.
          </HelpParagraph>
        </HelpButton>
      </TitleRow>
    </Header>
  );
};

export const HeaderLogs = () => {
  return (
    <Header>
      <TitleRow title="Logs">
        <HelpButton id="help-logs" dialogLabel="Logs">
          <HelpParagraph>
            Logs from both the host and the server. Uses overridden
            console.log() internally. Expect spam.
          </HelpParagraph>
          <HelpParagraph>
            <LogOriginBadge origin="host" /> are messages originating from your
            browser. Usually UI-related.
          </HelpParagraph>
          <HelpParagraph>
            <LogOriginBadge origin="vm" /> are messages originating from
            QuickJS. It&apos;s the JavaScript engine that executes the code for
            the Express server.
          </HelpParagraph>
          <HelpParagraph>
            <LogOriginBadge origin="service_worker" /> are messages from the
            service worker that intercepts all network connections. Requests to
            the Express server are redirected into QuickJS, rest are left
            untouched.
          </HelpParagraph>
        </HelpButton>
      </TitleRow>
    </Header>
  );
};
