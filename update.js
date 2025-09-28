const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { spawn } = require('child_process');

function update(args) {
    if (process.env.JTEX_CONTAINERIZED) {
        console.log('Update is not supported inside the Docker runtime. Rebuild the Docker image to apply updates.');
        return;
    }
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
    /*exec("npm update jtex-core", (err, stdout, stderr) => {
        if (err) {
            console.log("An error appeared while updating the package.");
        }
        console.log(stdout);
        console.log(stderr);
        if (!err)
            console.log("Update successful!");
    });*/

    var npmUpdate = null;
    
    if (process.platform == 'darwin' || process.platform == 'linux') {
        npmUpdate = spawn('sudo', ['npm', 'update', 'jtex-core'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
    } else if (process.platform == 'win32') {
        npmUpdate = spawn('npm', ['update', 'jtex-core'], {
            cwd: __dirname,
            stdio: 'inherit',
            shell: true
        });
    } else {
        console.log('Your platform is not supported: ' + process.platform);
        return;
    }
    
    npmUpdate.on('error', (error) => {
        console.error('Error running :', error);
    });

    npmUpdate.on('exit', (code) => {
        if (code === 0) {
            console.log('Update completed successfully');
        } else {
            console.error('Update failed with error code:', code);
        }
    });
}

exports.update = update;
