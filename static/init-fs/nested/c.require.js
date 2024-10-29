const requireTest = require('./b.require.js');

module.exports = 'transitive-require()----' + requireTest.insideRequire;
