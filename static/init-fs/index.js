import helloNestedFile_default, { helloNestedFile } from './nested/a.js';

console.log('Inside VM!', {
  def: helloNestedFile_default(),
  imp: helloNestedFile(),
});

globalThis.result = {
  helloNestedFile_default,
  helloNestedFile,
};

setTimeout(() => {
  console.log('Inside setTimeout VM!');
  // undefined = 1;
}, 10);
