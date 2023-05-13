const {JtexEnvironment} = require('jtex-core/envutils');
const {Tokenizer} = require('jtex-core/tokenizer');
const {Parser} = require('jtex-core/parser');
const {isSubdir} = require('./utils');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {exec} = require('child_process');
const {extractTexErrors} = require('./tex_error_extractor');

function makepdf(args) {
    if (args.length < 2) {
        console.log("Expecting an argument after 'compile'. Type 'makepdf --help' for more information.");
        return;
    }
    const cpath = path.isAbsolute(args[1]) ? args[1] : path.join(process.cwd(), args[1]);
    if (!fs.existsSync(cpath)) {
        console.log("File not found: " + cpath);
        return;
    }
    if (!fs.statSync(cpath).isFile()) {
        console.log("Expecting a file, but found a directory: " + cpath);
        return;
    }
    compile(["compile", path.dirname(cpath), path.join(path.dirname(cpath), ".compiled")]);
    const outpath = path.join(path.dirname(cpath), ".compiled"/*, "out"*/);
    const mpath = path.join(path.dirname(cpath), ".compiled", path.basename(cpath, '.jtex') + '.tex');
    const cmd = "pdflatex -interaction=nonstopmode "/*-output-directory=" + outpath + " -aux-directory=" + outpath*/ + " " + mpath;
    exec(cmd, {cwd: path.join(path.dirname(cpath), ".compiled")}, (err, stdout, stderr) => {
        if (err) {
            console.log("An error appeared in the latex compilation.");
            console.log("For further information check the log file: .\\" + path.relative(path.dirname(cpath), path.join(outpath, path.basename(cpath, ".jtex") + ".log")));
            var logs = fs.readFileSync(path.join(outpath, path.basename(cpath, ".jtex") + ".log"), "utf8");
            logErrors = extractTexErrors(logs, path.join(path.dirname(cpath), ".compiled"));
            fName = path.basename(cpath, ".jtex") + ".log";
            if (logErrors.length > 0)
                console.log("Quick error scanner (" + fName + "):");
            for (logErr of logErrors) {
                console.log();
                console.log(" - line    " +  + logErr.line);
                console.log("   - file: " + logErr.file);
                console.log("   - msg:  " + logErr.msg);
            }
        }
        // console.log(stdout);
        console.log(stderr);
        var pdfDir = path.join(outpath, path.basename(cpath, '.jtex') + '.pdf');
        if (fs.existsSync(pdfDir))
            fs.copyFileSync(pdfDir, path.join(path.dirname(cpath), path.basename(pdfDir)));
        if (!err)
            console.log("Compilation successful!");
    });
}

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
        if (!dest)
            dest = path.join(path.dirname(f), path.basename(f, '.jtex') + '.tex');
        else if (dest.endsWith(".jtex"))
            dest = path.join(path.dirname(dest), path.basename(dest, '.jtex') + '.tex');
        compileJtex(f, parser, dest);
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
exports.makepdf = makepdf;