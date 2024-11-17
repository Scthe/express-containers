import Request from './http_request';
import Response from './http_response';

// this will get invoked by the host (either Node or web browser)
globalThis.__portListeners = (() => {
  const data = {};
  return {
    add: (port, expressApp) => {
      data[port] = expressApp;
    },
    invoke: (port) => {
      console.log('Call express app from port', port);
      const expressApp = data[port];
      if (!expressApp) return;

      const resp = handleRequest(expressApp, port);

      console.log('Express response:', {
        keys: Object.keys(resp),
        statusCode: resp.statusCode,
        data: resp.data,
        _headers: resp._headers,
      });
    },
  };
})();

export function createServer(expressApp, ...args) {
  console.log('fake-http createServer()', expressApp);
  return {
    // listen: (server, callback, ...args) => {
    listen: (port, afterInitCb) => {
      console.log(`fake-http server.listen(port=${port})`);
      __platform_registerPortListener(port);
      globalThis.__portListeners.add(port, expressApp);

      //
      afterInitCb();
    },
  };
}

function handleRequest(expressApp, reqData) {
  const port = reqData;

  const fakeXhr = {
    open: () => {},
    onerror: () => {},
    onreadystatechange: () => {},
    __fakeXhr: true,
  };

  const host = 'localhost';
  const path = '';
  const fakeReq = new Request(fakeXhr, {
    url: `http://${host}:${port}/${path}`,
    host,
    port,
    path: '/' + path,
    method: 'GET',
    headers: {},
    // extra mocks
    listeners: () => [],
    resume: () => {},
    finished: true, // finished streaming request, can respond now
    __fakeRequest: true,
  });
  const fakeResp = new Response('__fakeResponse: true');

  // invoke express
  expressApp(fakeReq, fakeResp);

  return fakeResp;
}
