import React, { useCallback, useState } from 'react';
import { Button } from '../button';
import LoaderOverlayContent from '../loaders';
import { ContainerState } from 'app/model/useContainerState';
import useAsync, { AsyncState } from 'app/hooks/useAsync';
import { ensurePrefix, stringify, WithClassName } from 'utils';
import { InterceptedFetchResponse } from 'app/utils/sendFakeRequest';
import { Toggle } from '../toggle';

interface Props {
  containerState: ContainerState;
}

const EXAMPLE_PATHNAMES = [
  'hello?param0=1&param2',
  '',
  'user/my-user-id',
  'error-500',
  'error-404',
];

export function FetchSection({ containerState }: Props) {
  const { sendFakeRequest, expressPort } = containerState;

  const [pathname, setPathname] = useState(EXAMPLE_PATHNAMES[0]);
  const [lastSubmitPathname, setLastSubmitPathname] = useState('');
  const [isServiceWorker, setIsServiceWorker] = useState(false);

  const sendReq = useCallback(() => {
    setLastSubmitPathname(pathname);
    return sendFakeRequest(pathname, isServiceWorker);
  }, [isServiceWorker, pathname, sendFakeRequest]);

  const fetchState = useAsync(sendReq);

  return (
    <Indent className="px-2 pb-4">
      <PathnameInput
        baseUrl={`//localhost:${expressPort}/`}
        pathname={pathname}
        onChangePathname={setPathname}
      />

      <ExamplePathnames onChangePathname={setPathname} />

      <Toggle
        small
        checked={isServiceWorker}
        id="use-service-worker"
        onChecked={setIsServiceWorker}
        srLabel="Use service worker"
        className="mb-4"
      >
        <span className="inline-block ml-2">Use service worker</span>
      </Toggle>

      <div className="flex gap-4">
        <Button small className="mb-3 " onClick={fetchState.execute}>
          Fetch()
        </Button>

        {fetchState.state.type !== 'initial' ? (
          <Button small className="mb-3 " onClick={fetchState.reset}>
            Reset
          </Button>
        ) : null}
      </div>

      {fetchState.state.type !== 'initial' ? (
        <>
          <Indent label="Request" className="mb-2">
            <KeyValue
              label="Pathname"
              value={ensurePrefix(lastSubmitPathname, '/')}
            />
          </Indent>

          <FakeFetchResponse {...fetchState} />
        </>
      ) : null}
    </Indent>
  );
}

function PathnameInput(props: {
  baseUrl: string;
  pathname: string;
  onChangePathname: (p: string) => void;
}) {
  return (
    <div className="flex mb-2">
      <label htmlFor="fetch-pathname">
        <KeyValue label="Url" value="" />
      </label>

      <span className="opacity-40">{props.baseUrl}</span>
      <input
        id="fetch-pathname"
        className="bg-transparent border-b-2 border-b-accent-500 grow"
        value={props.pathname}
        onChange={(e) => {
          e.preventDefault();
          props.onChangePathname(e.target.value || '');
        }}
      />
    </div>
  );
}

function ExamplePathnames(props: { onChangePathname: (p: string) => void }) {
  return (
    <div className="mb-4">
      Or use example pathnames:
      <ul className="flex flex-wrap ml-5">
        {EXAMPLE_PATHNAMES.map((pathname, i) => (
          <li key={pathname}>
            <span
              className="transition-colors opacity-50 cursor-pointer hover:opacity-100 hover:text-accent-300"
              onClick={() => props.onChangePathname(pathname)}
            >
              {pathname.length ? `/${pathname}` : '(empty)'}
            </span>

            {i !== EXAMPLE_PATHNAMES.length - 1 ? (
              <span className="inline-block mr-2">,</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FakeFetchResponse({
  state,
}: {
  state: AsyncState<InterceptedFetchResponse | undefined>;
}) {
  if (state.type === 'initial') return;

  if (state.type === 'loading') {
    return (
      <div className="w-full h-[100px] relative">
        <LoaderOverlayContent visible={true} />
      </div>
    );
  }

  if (state.type === 'error') {
    return <StateError message={JSON.stringify(state.error)} />;
  }

  const resp = state.value;
  if (!resp) {
    return <StateError message="(undefined?)" />;
  }

  return (
    <Indent label="Response">
      <KeyValue label="Status code" value={resp.statusCode} />

      {Object.keys(resp.headers).map((header) => (
        <KeyValue
          key={header}
          label={`Headers[${header}]`}
          value={resp.headers[header]}
        />
      ))}

      <pre className="p-1 mt-1 whitespace-pre-wrap rounded bg-slate-300 text-slate-900">
        {stringify(resp.data)}
      </pre>
    </Indent>
  );
}

const StateError = ({ message }: { message: string }) => (
  <div className="">
    <h3 className="mb-1 text-lg">Critical error</h3>
    <pre className="p-2 ml-5 bg-red-800 rounded-md text-slate-200">
      {message}
    </pre>
  </div>
);

const Indent = (
  props: React.PropsWithChildren & WithClassName & { label?: string }
) => (
  <>
    {props.label !== undefined ? (
      <h3 className="mb-1 text-lg">{props.label}</h3>
    ) : null}
    <div className={`pl-5 ${props.className || ''}`}>{props.children}</div>
  </>
);

function KeyValue({ label, value }: { label: string; value: unknown }) {
  return (
    <p>
      <span className="text-accent-300">{label}:&nbsp;</span>
      {stringify(value)}
    </p>
  );
}
