const AutoGitUpdate = require('auto-git-update');
const os = require('os');

function upgrade(args) {
    const config = {
        repository: 'https://github.com/Jaybit0/JtexClient',
        branch: "main",
        fromReleases: false,
        tempLocation: os.tmpdir(),
        ignoreFiles: [],
        executeOnComplete: 'jtex finalizeupgrade',
        exitOnComplete: true
    }
    
    const updater = new AutoGitUpdate(config);
    
    updater.autoUpdate();
}

exports.upgrade = upgrade;