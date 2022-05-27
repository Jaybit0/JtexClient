const {JtexEnvironment} = require('jtex-core/envutils');
const {Tokenizer} = require('jtex-core/tokenizer');
const {Parser} = require('jtex-core/parser');
const {isSubdir} = require('./utils');
const path = require('path');
const fs = require('fs');
const os = require('os');

function compile(args) {
    if (args.length < 2) {
        console.log("Expecting an argument after 'compile'. Type 'compile --help' for more information.");
        return;
    }
    var cpath = path.isAbsolute(args[1]) ? args[1] : path.join(process.cwd(), args[1]);
    var dest = args.length > 2 ? (path.isAbsolute(args[2]) ? args[2] : path.join(process.cwd(), args[2])) : null;
    if (!fs.existsSync(cpath)) {
        console.log("Directory or file not found: " + cpath);
        return;
    }
    var env = new JtexEnvironment(path.join(os.homedir(), ".jtex", "environments", "default")).init(force=true);
    var parser = new Parser(env);
    if (fs.statSync(cpath).isFile()) {
        compileFile(cpath, parser, dest);
    } else {
        if (!dest) {
            dest = cpath;
        }
        compileDir(cpath, dest, parser);
    }
}

function compileDir(dir, dest, parser) {
    if (!fs.existsSync(dest))
        fs.mkdirSync(dest, {recursive: true});
    var entries = fs.readdirSync(dir, { withFileTypes: true });
    const folders = entries.filter(entry => entry.isDirectory() && (!isSubdir(dir, dest) || entry.name != path.basename(dest)));
    const files = entries.filter(entry => entry.isFile());
    for (file of files)
        compileFile(path.join(dir, file.name), parser, path.join(dest, file.name));
    for (folder of folders)
        compileDir(path.join(dir, folder.name), path.join(dest, folder.name), parser);
}

function compileFile(f, parser, dest=null) {
    if (!fs.existsSync(f)) {
        console.log('File not found: ' + f);
        console.log('Skipping...');
        return;
    }
    if (!fs.existsSync(path.dirname(f)))
        fs.mkdirSync(dest, {recursive: true});
    if (f.endsWith('.jtex')) {
        compileJtex(f, parser, dest.substring(0, dest.length - 5) + '.tex');
    } else if (dest && f != dest) {
        fs.copyFileSync(f, dest);
    }
}

function compileJtex(f, parser, dest=null) {
    var stats = fs.statSync(f);
    if (!stats.isFile()) {
        console.log("Expecting a file, but found a directory: " + f);
        return;
    }
    const fileContent = fs.readFileSync(f, 'utf8').toString();
    const tokenizer = new Tokenizer(fileContent);
    var out = parser.parse(tokenizer);

    if (!dest)
        dest = path.join(path.dirname(f), path.basename(f, '.jtex') + '.tex');
    fs.writeFileSync(dest, out);
}

exports.compile = compile;