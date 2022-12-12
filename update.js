const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function update(args) {
    if (args.length < 2) {
        console.log("Expecting the commit hash, branch or tag as argument.");
        return;
    }
    var dat = fs.readFileSync(path.join(__dirname, "package.json"));
    var json = JSON.parse(dat);
    if (args[1].toLowerCase() == "latest") {
        json.dependencies["jtex-core"] = "git://github.com/Jaybit0/JtexCore.git";
    } else {
        json.dependencies["jtex-core"] = "git://github.com/Jaybit0/JtexCore.git#" + args[1];
    }
    fs.writeFileSync(path.join(__dirname, "package.json"), JSON.stringify(json, null, 4));
    exec("npm update jtex-core", (err, stdout, stderr) => {
        if (err) {
            console.log("An error appeared while updating the package.");
        }
        console.log(stdout);
        console.log(stderr);
        if (!err)
            console.log("Update successful!");
    });
}

exports.update = update;