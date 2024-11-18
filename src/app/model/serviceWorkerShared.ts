import { InterceptedFetchResponse } from 'app/utils/sendFakeRequest';

/** Either header or query param */
export const WORKER_REQUEST_MARKER = 'is-quick-js';
export const WORKER_REQUEST_MARKER_VALUE = '1';

export const MESSAGE_TYPES = {
  WORKER_REQUEST: 'WORKER_REQUEST',
  HOST_RESPONSE: 'HOST_RESPONSE',
} as const;

export interface WorkerFetchRequest {
  type: (typeof MESSAGE_TYPES)['WORKER_REQUEST'];
  url: string;
}

export interface HostFetchResponse {
  type: (typeof MESSAGE_TYPES)['HOST_RESPONSE'];
  url: string;
  resp: InterceptedFetchResponse | undefined;
}
