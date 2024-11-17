import Request from './http_request';
import Response from './http_response';

// this will get invoked by the host (either Node or web browser)
globalThis.__portListeners = (() => {
  const data = {};
  return {
    add: (port, expressApp) => {
      data[port] = expressApp;
    },
    invoke: (port, pathname) => {
      console.log(
        `Express app request (port='${port}', pathname='${pathname}')`
      );
      const expressApp = data[port];
      if (!expressApp) {
        console.error(`No express apps running on port=${port}?`);
        return;
      }

      const resp = handleRequest(expressApp, port, pathname);

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

function handleRequest(expressApp, port, pathname) {
  const fakeXhr = {
    open: () => {},
    onerror: () => {},
    onreadystatechange: () => {},
    __fakeXhr: true,
  };

  const host = 'localhost';
  pathname = pathname.startsWith('/') ? pathname.substring(1) : pathname;
  // const path = 'user/my-user-id';
  // const path = 'hello?param0=1&param2';
  // TODO /user/:id
  // TODO query params
  // TODO endpoint for 500

  // http://localhost:3000/?param0=1&param2
  // url: '/?param0=1&param2',
  // baseUrl: '',
  // originalUrl: '/?param0=1&param2',
  // params: {},
  // query: { param0: '1', param2: '' },

  const fakeReq = new Request(fakeXhr, {
    url: `http://${host}:${port}/${pathname}`,
    host,
    port,
    path: '/' + pathname,
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
