export * from 'browserify-stream';

// default export
import * as name1 from 'browserify-stream';
export default name1;

name1.Stream.prototype.listeners = function () {
  return [];
};
