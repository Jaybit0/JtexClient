const {JtexEnvironment} = require('jtex-core/envutils');
const {Tokenizer} = require('jtex-core/tokenizer');
const {Parser} = require('jtex-core/parser');
const path = require('path');
const fs = require('fs');
const os = require('os');

function compile(args) {
    if (args.length < 2) {
        console.log("Expecting an argument after 'compile'. Type 'jtex compile --help' for more information.");
        return;
    }
    var cpath = path.isAbsolute(args[1]) ? args[1] : path.join(process.cwd(), args[1]);
    var env = new JtexEnvironment(path.join(os.homedir(), ".jtex", "environments", "default")).init(force=true);
    var parser = new Parser(env);
    if (!fs.existsSync(cpath)) {
        console.log("Directory not found: " + cpath);
        return;
    } 
    
    if (fs.statSync(cpath).isFile()) {
        compileFile(cpath, parser);
    } else {
        var files = fs.readdirSync(cpath);
        for (file of files) {

        }
    }
}

function compileDir(dir, dest, parser) {
    var files = fs.readdirSync(dir);
    for (file of files) {
        var f = path.join(dir, file);
        var stats = fs.statSync(f);
        if (stats.isFile()) {
            compileFile(f, parser);
        } else if (stats.isDirectory()) {
            compileDir(f, dest);
        }
    }
}

function compileFile(f, parser, dest=null) {
    if (!fs.existsSync(f)) {
        console.log('File not found: ' + f);
        console.log('Skipping...');
        return;
    }
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