const { compile, makepdf } = require('./compile');

var args = process.argv.slice(2);
execCmd(args);

function execCmd(args) {
    if (args.length == 0) {
        console.log("Missing command. Type '--help' for more information.");
        return;
    }
    switch (args[0]) {
        case "compile":
            compile(args);
            break;
        case "makepdf":
            makepdf(args);
            break;
        default:
            console.log("Unknown command: " + args[0]);
    }
}