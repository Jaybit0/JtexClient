const {compile} = require('./compile');
const { setup } = require('./setup');

var args = process.argv.slice(2);
execCmd(args);

function execCmd(args) {
    if (args.length == 0) {
        console.log("Missing command. Type '--help' for more information.");
        return;
    }
    switch (args[0]) {
        case "setup":
            setup(args);
            break;
        case "compile":
            compile(args);
            break;
        default:
            console.log("Unknown command: " + args[0]);
    }
}