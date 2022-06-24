const fs = require('fs');
const path = require('path');

function extractTexErrors(logstr, latexCompileDir) {
    var errors = [];
    var lines = logstr.split('\n');
    var curFile = "?";
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf('!') == 0) {
            if (line.startsWith('! LaTeX Error: ')) {
                errors.push({
                    line: i+1,
                    file: curFile,
                    msg: "[ERR] " + line.substring(15).trim()
                });
            } else if (line.startsWith('! LaTeX Warning: ')) {
                errors.push({
                    line: i+1, 
                    file: curFile, 
                    msg: "[WARN] " + line.substring(16).trim()
                });
            } else if (line.startsWith("! Undefined control sequence")) {
                i++;
                errors.push({
                    line: i, 
                    file: curFile,
                    msg: "[ERR] " + "Undefined control sequence: " + lines[i]
                });
            } else {
                errors.push({
                    line: i+1, 
                    file: curFile,
                    msg: "[?] " + line
                });
            }
        } else {
            var split = line.split("(");
            if (split.length >= 2) {
                var mpath = split[split.length-1]
                if (!path.isAbsolute(mpath)) {
                    mpath = path.join(latexCompileDir, mpath);
                }
                if (fs.existsSync(mpath)) {
                    curFile = split[split.length-1];
                }
            }
        }
    }
    return errors;
}

exports.extractTexErrors = extractTexErrors;