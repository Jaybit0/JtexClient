const {compile} = require('./compile');

var args = process.argv.slice(2)

switch (args[0]) {
    case "compile":
        compile(args);
        break;
    default:
        console.log("Unknown command: " + args[0]);
}