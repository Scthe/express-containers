export * from 'browserify-buffer';

// default export
import * as name1 from 'browserify-buffer';
export default name1;

globalThis.Buffer = name1.Buffer;
