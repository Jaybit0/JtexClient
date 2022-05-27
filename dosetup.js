const { setup } = require('./setup');

var args = process.argv.slice(2);
args.unshift("setup");
setup(args);