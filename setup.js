const {isSubdir} = require("./utils");
const fs = require('fs');
const os = require('os');
const path = require('path');

function setup(args) {
    switch(process.platform) {
        case "win32":
            setupWindows(args);
            break;
        default:
            console.log("Unsupported platform: " + process.platform());
            break;
    }
}

async function setupWindows(args) {
    const dest = path.join(os.homedir(), "Jtex", "v0.0.1");
    if (args.length > 1) {
        dest = path.isAbsolute(args[1]) ? args[1] : path.join(process.cwd(), args[1]);
    }
    if (__dirname != dest) {
        copyDir(__dirname, dest, exclude=[path.join(__dirname, "setup.bat"), path.join(__dirname, "jtex.bat")]);
        fs.copyFileSync(path.join(__dirname, "jtex.bat"), path.join(path.dirname(dest), "jtex.bat"));
    }

    const regedit = require('regedit').promisified;
    const result = await regedit.listUnexpandedValues("HKCU\\Environment\\Path");
    if (result.length == 1) {
        if (result[0].value.split(";").indexOf(path.dirname(dest)) > -1){
            console.log("JteX is already installed in the user path.");
            console.log("Jtex was successfully installed.");
            return;
        }
        const toPut = {
            "HKCU\\Environment": {
                "Path": {
                    value: result[0].value + ";" + path.dirname(dest),
                    type: "REG_EXPAND_SZ"
                }
            }
        };
        try {
            await regedit.putValue(toPut);
        } catch (e) {
        }

        console.log("Jtex was successfully installed.");
        console.log("Please restart your computer to use jtex as a console-command.");
    }
    
}

function copyDir(from, to, exclude=[]) {
    if (isSubdir(from, to)) {
        console.log("Cannot use a subdirectory of the current directory as a destination.");
        return false;
    }
    if (!fs.existsSync(to))
        fs.mkdirSync(to, {recursive: true});
    var entries = fs.readdirSync(from, { withFileTypes: true });
    const folders = entries.filter(entry => entry.isDirectory());
    const files = entries.filter(entry => entry.isFile());
    for (file of files)
        fs.copyFileSync(path.join(from, file.name), path.join(to, file.name));
    for (folder of folders)
        copyDir(path.join(from, folder.name), path.join(to, folder.name));
}

exports.setup = setup;