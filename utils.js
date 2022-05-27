const path = require('path');

function isSubdir(parent, dir) {
    const relative = path.relative(parent, dir);
    if (relative.length == 0)
        return false;
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

exports.isSubdir = isSubdir;