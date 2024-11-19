// globalThis.process
globalThis.process = (function () {
  const p = {};
  p.cwd = () => '';
  // https://nodejs.org/api/process.html#processenv
  p.env = {
    DEBUG: '*', // express uses 'debug' lib. Print everything
  };
  p.browser = true;
  return p;
})();

const global = globalThis;

// global.XMLHttpRequest = function () {
// return { open: () => undefined };
// };

/*
const window = global;

global.location = {
  host: undefined,
  protocol: 'http',
};*/

// Error.captureStackTrace
// https://github.com/sindresorhus/capture-stack-trace/blob/main/index.js
Error.captureStackTrace = (error) => {
  const container = new Error(); // eslint-disable-line unicorn/error-message
  const createCallSite = (line) => ({
    getFileName: () => line,
    getLineNumber: () => '?',
    getColumnNumber: () => '?',
    getFunctionName: () => '?',
    isEval: () => false,
  });

  Object.defineProperty(error, 'stack', {
    configurable: true,
    get() {
      const { stack } = container;
      const stack2 = stack.split('\n').map(createCallSite);
      Object.defineProperty(this, 'stack', { value: stack2 });
      return stack2;
    },
  });
};

// Used in non-esm build targets
// globalThis.fs = {};
// globalThis.net = {};

// globalThis.setImmediate = (fn) => setTimeout(fn, 0);
globalThis.setImmediate = (fn) => {
  // fn();
  setTimeout(() => {
    fn();
  }, 0);
};
