import helloNestedFile_default, { helloNestedFile } from './nested/a.js';

const requireTest = require('./nested/b.require.js');
const requireTest_transitive = require('./nested/c.require.js');

console.log('Inside VM!', {
  def: helloNestedFile_default(),
  imp: helloNestedFile(),
  requireTest_default: requireTest,
  requireTest_spread: { ...requireTest },
  requireTest_transitive,
});
requireTest(); // prints 'createApplication'

globalThis.result = {
  helloNestedFile_default,
  helloNestedFile,
};

setTimeout(() => {
  console.log('Inside setTimeout VM!');
  // undefined = 1;
}, 10);
