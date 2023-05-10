const { compile, makepdf } = require('./compile');
const { update } = require('./update');
const { upgrade } = require('./upgrade');
const fs = require('fs');
const path = require('path');

var args = process.argv.slice(2);
execCmd(args);

function execCmd(args) {
    if (args.length == 0) {
        console.log("Missing command. Type 'help' for more information.");
        return;
    }
    if (args[args.length-1].toLowerCase().endsWith("--help")) {
        help(args, true);
        return;
    }
    switch (args[0]) {
        case "help":
        case "?":
            help(args);
            break;
        case "compile":
            compile(args);
            break;
        case "makepdf":
            makepdf(args);
            break;
        case "update":
            update(args);
            break;
        case "upgrade":
            upgrade(args);
            break;
        default:
            console.log("Unknown command: " + args[0]);
            console.log("Type 'help' for more information.");
    }
}

function help(args, detailed = false) {
    var data = fs.readFileSync(path.join(__dirname, "help.json"));
    var json = JSON.parse(data);
    var ordered_json = Object.keys(json).sort().reduce(
            (obj, key) => { 
                obj[key] = json[key]; 
                return obj;
            }, 
            {}
        );
    if (!detailed) {
        help(["help"], true);
        console.log("");
        console.log("\x1b[35mAvailable commands:", "\x1b[0m");
        var maxLength = 0;
        for (var key in ordered_json) {
            if (maxLength < key.length)
                maxLength = key.length;
        }
        for (var key in ordered_json) {
            console.log("\x1b[32m", key.padEnd(maxLength), "\x1b[36m-", ordered_json[key]["description"], "\x1b[0m");
        }
    } else {
        var cmd = args[0];
        if (cmd in json) {
            console.log("\x1b[35mCommand: \x1b[31m" + cmd + "\x1b[0m");
            console.log("\x1b[35mDescription: \x1b[36m" + json[cmd]["description"] + "\x1b[0m");
            console.log("\x1b[35mParameters:" + "\x1b[0m")
            var maxLength = 0;
            for (var param in json[cmd]["params"]) {
                if (maxLength < param.length)
                    maxLength = param.length;
            }
            for (var param in json[cmd]["params"]) {
                console.log("\x1b[32m", param.padEnd(maxLength), "\x1b[36m-", json[cmd]["params"][param], "\x1b[0m");
            }
            maxLength = 0;
            console.log("\x1b[35mOptional parameters:" + "\x1b[0m");
            for (var param in json[cmd]["optional-params"]) {
                if (maxLength < param.length)
                    maxLength = param.length;
            }
            for (var param in json[cmd]["optional-params"]) {
                console.log("\x1b[32m", param.padEnd(maxLength), "\x1b[36m-", json[cmd]["optional-params"][param], "\x1b[0m");
            }
            console.log("\x1b[35mExamples:" + "\x1b[0m");
            for (var i = 0; i < json[cmd]["examples"].length; i++) {
                console.log("\x1b[35m -", "Command:", "\x1b[32m" + json[cmd]["examples"][i]["command"], "\x1b[0m");
                console.log("\x1b[35m  ", "Description:", "\x1b[36m" + json[cmd]["examples"][i]["description"], "\x1b[0m");
            }
        } else {
            console.log("Unknown command: " + cmd);
        }
    }
}