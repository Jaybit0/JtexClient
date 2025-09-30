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
        console.log("Expecting an argument after 'makepdf'. Type 'makepdf --help' for more information.");
        return;
    }
    const cpath = path.isAbsolute(args[1]) ? args[1] : path.join(process.cwd(), args[1]);
    if (!fs.existsSync(cpath)) {
        console.log("File not found: " + cpath);
        return;
    }
    let mainFile = cpath;
    let workdir = path.dirname(cpath);
    let compiledDir = path.join(workdir, ".compiled");
    if (fs.statSync(cpath).isDirectory()) {
        workdir = cpath;
        compiledDir = path.join(workdir, ".compiled");
        if (args.length > 2) {
            const supplied = args[2];
            mainFile = path.isAbsolute(supplied) ? supplied : path.join(workdir, supplied);
        } else {
            const candidates = [
                path.join(workdir, path.basename(workdir) + '.jtex'),
                path.join(workdir, 'main.jtex'),
                path.join(workdir, 'index.jtex')
            ];
            for (const candidate of candidates) {
                if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                    mainFile = candidate;
                    break;
                }
            }
        }
        if (!fs.existsSync(mainFile) || fs.statSync(mainFile).isDirectory()) {
            console.log('Directory input requires a main .jtex file.');
            console.log('Provide it explicitly: jtex makepdf ' + args[1] + ' path/to/main.jtex');
            return;
        }
        compile(["compile", workdir, compiledDir, mainFile]);
    } else {
        compile(["compile", path.dirname(cpath), compiledDir, cpath]);
    }
    const outpath = compiledDir;
    const compiledTexRelative = path.relative(workdir, mainFile).replace(/\.jtex$/i, '.tex');
    const mpath = path.join(outpath, compiledTexRelative);
    const cmd = "pdflatex -interaction=nonstopmode \"" + mpath + "\"";
    exec(cmd, {cwd: outpath}, (err, stdout, stderr) => {
        const logPath = mpath.replace(/\.tex$/i, '.log');
        const pdfPath = mpath.replace(/\.tex$/i, '.pdf');
        if (err) {
            console.log("An error appeared in the latex compilation.");
            if (fs.existsSync(logPath)) {
                console.log("For further information check the log file: .\\" + path.relative(workdir, logPath));
                const logs = fs.readFileSync(logPath, "utf8");
                const logErrors = extractTexErrors(logs, outpath);
                const fName = path.basename(logPath);
                if (logErrors.length > 0)
                    console.log("Quick error scanner (" + fName + "):");
                for (const logErr of logErrors) {
                    console.log();
                    console.log(" - line    " + logErr.line);
                    console.log("   - file: " + logErr.file);
                    console.log("   - msg:  " + logErr.msg);
                }
            } else {
                console.log("No log file produced (pdflatex may be missing or crashed before writing a log).");
            }
        }
        // console.log(stdout);
        console.log(stderr);
        const pdfTarget = path.join(path.dirname(mainFile), path.basename(pdfPath));
        if (fs.existsSync(pdfPath))
            fs.copyFileSync(pdfPath, pdfTarget);
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
    var mainpath = null;
    if (args.length > 3) {
        mainpath = path.isAbsolute(args[3]) ? args[3] : path.join(process.cwd(), args[3]);
    }
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
        compileDir(cpath, dest, parser, mainpath);
    }
}

function compileDir(dir, dest, parser, mainpath=null) {
    if (!fs.existsSync(dest))
        fs.mkdirSync(dest, {recursive: true});
    var entries = fs.readdirSync(dir, { withFileTypes: true });
    const folders = entries.filter(entry => entry.isDirectory() && (!isSubdir(dir, dest) || entry.name != path.basename(dest)));
    const files = entries.filter(entry => entry.isFile());
    for (file of files)
        compileFile(path.join(dir, file.name), parser, path.join(dest, file.name), mainpath);
    for (folder of folders)
        compileDir(path.join(dir, folder.name), path.join(dest, folder.name), parser, mainpath);
}

function compileFile(f, parser, dest=null, mainpath=null) {
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
        var ismain = mainpath && path.relative(mainpath, f) == "";
        compileJtex(f, parser, dest, ismain);
    } else if (dest && f != dest) {
        fs.copyFileSync(f, dest);
    }
}

function compileJtex(f, parser, dest=null, main=false) {
    var stats = fs.statSync(f);
    if (!stats.isFile()) {
        console.log("Expecting a file, but found a directory: " + f);
        return;
    }
    const fileContent = fs.readFileSync(f, 'utf8').toString();
    const tokenizer = new Tokenizer(fileContent);
    var out = parser.parse(tokenizer, "\r\n", main);

    if (!dest)
        dest = path.join(path.dirname(f), path.basename(f, '.jtex') + '.tex');
    fs.writeFileSync(dest, out);
}

exports.compile = compile;
exports.makepdf = makepdf;
