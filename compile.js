const Module = require('module');
const {isSubdir} = require('./utils');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {exec} = require('child_process');
const {extractTexErrors} = require('./tex_error_extractor');

const CORE_EXPORT_FALLBACKS = {
    JtexEnvironment: ['JtexEnvironment', 'default'],
    Tokenizer: ['Tokenizer', 'default'],
    Parser: ['Parser', 'default']
};

let defaultCoreCache = null;

function extractCoreOption(args) {
    const cleaned = [];
    let coreOverride = null;
    let error = null;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--core') {
            if (i + 1 >= args.length) {
                error = "Missing value after --core.";
                break;
            }
            coreOverride = args[i + 1];
            i++;
            continue;
        }
        if (arg.startsWith('--core=')) {
            coreOverride = arg.substring('--core='.length);
            continue;
        }
        cleaned.push(arg);
    }
    return {
        corePath: coreOverride ? path.resolve(coreOverride) : null,
        args: cleaned,
        error
    };
}

function loadCoreModules(corePath) {
    try {
        if (corePath) {
            return importCoreModules(createCoreRequire(corePath), corePath);
        }
        if (!defaultCoreCache) {
            const pkgPath = require.resolve('jtex-core/package.json');
            defaultCoreCache = importCoreModules(Module.createRequire(pkgPath), 'jtex-core');
        }
        return defaultCoreCache;
    } catch (err) {
        if (corePath) {
            console.log('Failed to load jtex-core override from: ' + corePath);
        } else {
            console.log('Failed to load the bundled jtex-core package. Ensure dependencies are installed.');
        }
        console.log(err.message);
        return null;
    }
}

function createCoreRequire(targetPath) {
    const resolved = path.resolve(targetPath);
    if (!fs.existsSync(resolved)) {
        throw new Error('Path does not exist: ' + resolved);
    }
    const stats = fs.statSync(resolved);
    const candidates = [];
    if (stats.isDirectory()) {
        candidates.push(path.join(resolved, 'package.json'));
        candidates.push(path.join(resolved, 'index.js'));
        candidates.push(path.join(resolved, 'dist', 'index.js'));
    } else {
        candidates.push(resolved);
    }
    let lastError = null;
    for (const candidate of candidates) {
        try {
            return Module.createRequire(candidate);
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error('Unable to construct require for override: ' + resolved);
}

function importCoreModules(coreRequire, originLabel) {
    const envModule = requireFromCandidates(coreRequire, [
        './envutils',
        './envutils.js',
        './dist/envutils',
        './dist/envutils.js',
        './lib/envutils',
        './lib/envutils.js',
        './src/envutils',
        './src/envutils.js',
        './build/envutils',
        './build/envutils.js'
    ], originLabel, 'envutils');
    const tokenizerModule = requireFromCandidates(coreRequire, [
        './tokenizer',
        './tokenizer.js',
        './dist/tokenizer',
        './dist/tokenizer.js',
        './lib/tokenizer',
        './lib/tokenizer.js',
        './src/tokenizer',
        './src/tokenizer.js',
        './build/tokenizer',
        './build/tokenizer.js'
    ], originLabel, 'tokenizer');
    const parserModule = requireFromCandidates(coreRequire, [
        './parser',
        './parser.js',
        './dist/parser',
        './dist/parser.js',
        './lib/parser',
        './lib/parser.js',
        './src/parser',
        './src/parser.js',
        './build/parser',
        './build/parser.js'
    ], originLabel, 'parser');

    return {
        JtexEnvironment: resolveExport(envModule, 'JtexEnvironment'),
        Tokenizer: resolveExport(tokenizerModule, 'Tokenizer'),
        Parser: resolveExport(parserModule, 'Parser')
    };
}

function requireFromCandidates(coreRequire, candidates, originLabel, label) {
    let lastError = null;
    for (const candidate of candidates) {
        try {
            return coreRequire(candidate);
        } catch (err) {
            if (err.code !== 'MODULE_NOT_FOUND') {
                lastError = err;
                break;
            }
            lastError = err;
        }
    }
    const message = 'Unable to load ' + label + ' from ' + originLabel + '. Tried: ' + candidates.join(', ');
    if (lastError) {
        throw new Error(message + '\n' + lastError.message);
    }
    throw new Error(message);
}

function resolveExport(moduleExport, key) {
    const fallbacks = CORE_EXPORT_FALLBACKS[key] || [];
    const possibles = Array.isArray(fallbacks) ? fallbacks : [fallbacks];
    if (moduleExport && typeof moduleExport === 'object') {
        for (const name of [key, ...possibles]) {
            if (moduleExport[name]) {
                return moduleExport[name];
            }
        }
    }
    if (typeof moduleExport === 'function') {
        return moduleExport;
    }
    if (moduleExport && moduleExport.default && typeof moduleExport.default === 'function') {
        return moduleExport.default;
    }
    throw new Error('Cannot resolve export for ' + key + '.');
}

function makepdf(args) {
    const parsed = extractCoreOption(args);
    if (parsed.error) {
        console.log(parsed.error);
        return;
    }
    args = parsed.args;
    const core = loadCoreModules(parsed.corePath);
    if (!core) {
        return;
    }
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
    }
    runCompilation(core, cpath, compiledDir, mainFile);
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
    const parsed = extractCoreOption(args);
    if (parsed.error) {
        console.log(parsed.error);
        return;
    }
    args = parsed.args;
    const core = loadCoreModules(parsed.corePath);
    if (!core) {
        return;
    }
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
    runCompilation(core, cpath, dest, mainpath);
}

function runCompilation(core, sourcePath, dest, mainpath) {
    const envRoot = path.join(os.homedir(), ".jtex", "environments", "default");
    const environment = new core.JtexEnvironment(envRoot).init(force=true);
    const parser = new core.Parser(environment);
    const tokenizerCtor = core.Tokenizer;
    if (fs.statSync(sourcePath).isFile()) {
        compileFile(sourcePath, parser, tokenizerCtor, dest, mainpath);
        return;
    }
    if (!dest) {
        dest = sourcePath;
    }
    compileDir(sourcePath, dest, parser, tokenizerCtor, mainpath);
}

function compileDir(dir, dest, parser, tokenizerCtor, mainpath=null) {
    if (!fs.existsSync(dest))
        fs.mkdirSync(dest, {recursive: true});
    var entries = fs.readdirSync(dir, { withFileTypes: true });
    const folders = entries.filter(entry => entry.isDirectory() && (!isSubdir(dir, dest) || entry.name != path.basename(dest)));
    const files = entries.filter(entry => entry.isFile());
    for (const file of files)
        compileFile(path.join(dir, file.name), parser, tokenizerCtor, path.join(dest, file.name), mainpath);
    for (const folder of folders)
        compileDir(path.join(dir, folder.name), path.join(dest, folder.name), parser, tokenizerCtor, mainpath);
}

function compileFile(f, parser, tokenizerCtor, dest=null, mainpath=null) {
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
        compileJtex(f, parser, tokenizerCtor, dest, ismain);
    } else if (dest && f != dest) {
        fs.copyFileSync(f, dest);
    }
}

function compileJtex(f, parser, tokenizerCtor, dest=null, main=false) {
    var stats = fs.statSync(f);
    if (!stats.isFile()) {
        console.log("Expecting a file, but found a directory: " + f);
        return;
    }
    const fileContent = fs.readFileSync(f, 'utf8').toString();
    const tokenizer = new tokenizerCtor(fileContent);
    var out = parser.parse(tokenizer, "\r\n", main);

    if (!dest)
        dest = path.join(path.dirname(f), path.basename(f, '.jtex') + '.tex');
    fs.writeFileSync(dest, out);
}

exports.compile = compile;
exports.makepdf = makepdf;
