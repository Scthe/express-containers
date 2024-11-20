// https://gist.github.com/kosamari/7c5d1e8449b2fbc97d372675f16b566e
// https://web.dev/articles/two-way-communication-guide#channel-api
// TODO [IGNORE] workbox?

import {
  HostFetchResponse,
  MESSAGE_TYPES,
  WORKER_REQUEST_MARKER,
  WORKER_REQUEST_MARKER_VALUE,
  WorkerFetchRequest,
} from './model/serviceWorkerShared';
import { InterceptedFetchResponse } from './utils/sendFakeRequest';

// TODO [LOW] handle as tag in logs panel

// eslint-disable-next-line no-console
const log = (...args: unknown[]) => console.log('[Service Worker]', ...args);

// typesafe!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const self2: ServiceWorkerGlobalScope = self as any;

self2.addEventListener('install', function (_e) {
  log('Service worker installed');

  // force upgrade
  self2.skipWaiting();
});

self2.addEventListener('fetch', function (event: FetchEvent) {
  log(`Fetch request: '${event.request.url}'`);
  // log(`Fetch request:`, event);

  if (!isQuickJsRequest(event.request)) return;

  log(`It's QuickJS request: '${event.request.url}'`);
  const respAsync = getResponseFromVM(event);
  event.respondWith(respAsync);
});

function isQuickJsRequest(request: Request) {
  const byHeader =
    request.headers.get(WORKER_REQUEST_MARKER) === WORKER_REQUEST_MARKER_VALUE;
  const byQueryParam = request.url.includes(
    `${WORKER_REQUEST_MARKER}=${WORKER_REQUEST_MARKER_VALUE}`
  );

  // from inside iframe
  const byRefererQueryParam = request.referrer.includes(
    `${WORKER_REQUEST_MARKER}=${WORKER_REQUEST_MARKER_VALUE}`
  );

  return byHeader || byQueryParam || byRefererQueryParam;
}

type UrlResolver = (resp: InterceptedFetchResponse | undefined) => void;

const OUTSTANDING_REQUESTS: Record<
  string, // url
  UrlResolver[]
> = {};

function getResponseFromVM(event: FetchEvent) {
  const url = event.request.url;

  return new Promise<Response>((resolve, _rej) => {
    const arr = OUTSTANDING_REQUESTS[url] || [];
    OUTSTANDING_REQUESTS[url] = arr;

    arr.push((resp) => {
      const text =
        typeof resp?.data === 'string' ? resp.data : '(invalid response data)';

      const respObject = new Response(text, {
        status: resp?.statusCode || 500,
        headers: resp?.headers || {},
      });
      resolve(respObject);
    });

    postRequestToHost(url);
  });

  /*return new Response('mock-body', {
    status: 202,
    headers: {
      'header-0': 'aaaaa',
    },
  });*/
}

/** TODO [IGNORE] Persist headers and content too. Trivial but I'm too lazy */
async function postRequestToHost(url: string) {
  const clientsRaw = await self2.clients.matchAll({
    includeUncontrolled: true,
  });
  const clients = clientsRaw || [];

  log(`Post request to host url='${url}' to ${clients.length} clients`);
  clients.forEach((client) => {
    // log('post to client', client);
    client.postMessage({
      type: MESSAGE_TYPES.WORKER_REQUEST,
      url,
    } satisfies WorkerFetchRequest);
  });
}

self2.addEventListener('message', (event) => {
  log('Handle message', event.data);

  if (event.data && event.data.type === MESSAGE_TYPES.HOST_RESPONSE) {
    const data = event.data as HostFetchResponse;
    const { url, resp } = data;

    const awaitingRequests = OUTSTANDING_REQUESTS[url];
    OUTSTANDING_REQUESTS[url] = [];
    awaitingRequests.forEach((callback) => callback(resp));
  }
});
