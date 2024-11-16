import { typesafeObjectKeys } from 'utils';
import { createEventEmitter } from 'utils/eventEmitter';

/* eslint-disable no-console */
// @ts-expect-error I won't bother reimplementing whole node:process
globalThis.process = {
  cwd: () => '',
};

// install URL override for rollup wasm file
const ROLLUP_WASM_FILE = 'bindings_wasm_bg.wasm';
const orgURL = URL;
// @ts-expect-error we are doing something sus cause it's 'hacks.ts'
globalThis.URL = function (...args: unknown[]) {
  // console.log('URL', args);
  if (args[0] === ROLLUP_WASM_FILE) {
    const url = new orgURL('bindings_wasm_bg.wasm', window.location.href);
    // console.log(url);
    // console.log(typeof url.href);
    // return url.href;
    return new Request(url.href);
  }
  // @ts-expect-error we are doing something sus cause it's 'hacks.ts'
  return new orgURL(...args);
};

/////////////////////
// ConsoleInterceptor

export type ConsoleLevel = keyof typeof orgConsole;
export type ConsoleInterceptorParams = { level: ConsoleLevel; args: unknown[] };

export const CONSOLE_INTERCEPTORS =
  createEventEmitter<ConsoleInterceptorParams>('delayed');

const orgConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};
typesafeObjectKeys(orgConsole).forEach((level) => {
  console[level] = (...args) => {
    orgConsole[level](...args);
    CONSOLE_INTERCEPTORS.emit({ level, args });
  };
});
