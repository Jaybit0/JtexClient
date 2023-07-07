const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function update(args) {
    switch(process.platform){
        case "darwin":
        case "linux":
            // Check if the user is root
            if (process.getuid() !== 0) {
                console.error('You must run this script as root (sudo jtex update <branch/version/commit>)');
                return;
            }
            break;
        default:
    }

    if (args.length < 2) {
        console.log("Expecting the commit hash or tag as argument.");
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
    const updateScript = spawn("npm", ["update", "jtex-core"], {
        cwd: __dirname,
        stdio: "inherit",
        shell:true
    });

    updateScript.on('error', (error) => {
        console.error("Error running npm update:", error);
    });

    updateScript.on('exit', (code) => {
        if (code === 0) {
          console.log('Update completed successfully');
        } else {
          console.error('Update failed with error code:', code);
        }
    });
}

exports.update = update;