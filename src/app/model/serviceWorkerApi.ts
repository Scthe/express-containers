import {
  InterceptedFetchResponse,
  sendFakeRequest,
} from 'app/utils/sendFakeRequest';
import { QuickJSContext } from 'quickjs-emscripten';
import {
  HostFetchResponse,
  MESSAGE_TYPES,
  WorkerFetchRequest,
} from './serviceWorkerShared';

const LOG_TAG = '[ServiceWorkerApi]';

/** https://web.dev/articles/two-way-communication-guide#channel-api */
class ServiceWorkerApi {
  private context: QuickJSContext | undefined = undefined;

  constructor() {
    navigator.serviceWorker.onmessage = this.handleMessage;
  }

  setContext = (context: QuickJSContext | undefined) => {
    this.context = context;
  };

  private handleMessage = async (event: MessageEvent) => {
    console.log(LOG_TAG, 'Handle message', event.data);

    if (event.data && event.data.type === MESSAGE_TYPES.WORKER_REQUEST) {
      const data = event.data as WorkerFetchRequest;
      const url = data.url || '';
      const urlObj = new URL(url);
      const pathname = urlObj.pathname + urlObj.search;

      const resp = await this.getResponseFromVM(pathname);
      this.sendMsgToWorker(url, resp);
    }
  };

  private getResponseFromVM = async (pathname: string) => {
    // eslint-disable-next-line no-console
    console.log(`${LOG_TAG} Service worker asked for pathname='${pathname}'`);

    if (!this.context) {
      console.error(
        `${LOG_TAG} Error: Could not forward request to VM. QuickJS context is not set`
      );
      return undefined;
    }
    const resp = sendFakeRequest(this.context, pathname);
    return resp;
  };

  private sendMsgToWorker = (
    url: string,
    resp: InterceptedFetchResponse | undefined
  ) => {
    if (!navigator.serviceWorker.controller) {
      console.error(
        `${LOG_TAG} Error: navigator.serviceWorker.controller is null`
      );
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `${LOG_TAG} Sending back intercepted response to service worker. Status code: ${resp?.statusCode}`
    );
    navigator.serviceWorker.controller.postMessage({
      type: MESSAGE_TYPES.HOST_RESPONSE,
      resp,
      url,
    } satisfies HostFetchResponse);
  };
}

export const SERVICE_WORKER_API = new ServiceWorkerApi();
