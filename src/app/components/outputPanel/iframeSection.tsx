import React, { useState } from 'react';
import { Button } from '../button';
import {
  WORKER_REQUEST_MARKER,
  WORKER_REQUEST_MARKER_VALUE,
} from 'app/model/serviceWorkerShared';
import { ensureSuffix } from 'utils';

export function IframeSection() {
  const height = 200;
  const [showIframe, setShowIframe] = useState(false);

  let baseUrl = `${location.protocol}//${location.host}${location.pathname}`;
  baseUrl = ensureSuffix(baseUrl, '/');
  const src = `${baseUrl}?${WORKER_REQUEST_MARKER}=${WORKER_REQUEST_MARKER_VALUE}`;

  return (
    <div className="px-2 pb-4">
      <Button small onClick={() => setShowIframe((k) => !k)}>
        Toggle iframe
      </Button>

      {showIframe ? (
        <div className="mt-2 overflow-hidden bg-gray-200 rounded-md">
          <iframe
            src={src}
            height={height}
            width={0}
            sandbox="allow-same-origin allow-scripts"
            className="w-full"
          />
        </div>
      ) : null}
    </div>
  );
}
