const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const { promisify } = require('util');
const rmdir = promisify(fs.rmdir);

async function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        for (const entry of fs.readdirSync(path)) {
            const curPath = `${path}/${entry}`;
            if (fs.lstatSync(curPath).isDirectory()) {
                await deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        }
        await rmdir(path);
    }
}

async function upgrade() {
  switch(process.platform) {
    case "win32":
      upgradeWindows();
      break;
    case "darwin":
    case "linux":
      upgradeUnix();
      break;
    default:
      console.log("Unsupported platform: " + process.platform);
      break;
  }
}

async function upgradeWindows() {
  try {
    const repoUrl = 'https://github.com/Jaybit0/JtexClient.git';
    const localRepoPath = os.tmpdir() + '\\tmp-update-repo';

    // Check if localRepoPath exists and delete it
    await deleteFolderRecursive(localRepoPath);

    // Clone the Git repository containing the update
    const gitClone = spawn('git', ['clone', repoUrl, localRepoPath]);
    gitClone.on('error', (error) => {
      console.error('Error cloning the repository:', error);
    });

    gitClone.on('exit', (code) => {
      if (code === 0) {
        // Successfully cloned the repository, now run the setup.bat script
        const setupScript = spawn('cmd.exe', ['/c', 'setup.bat', process.pid], {
          stdio: 'inherit',
          cwd: localRepoPath
        });
        setupScript.on('error', (error) => {
          console.error('Error running the setup.bat script:', error);
        });

        setupScript.on('exit', (code) => {
          if (code === 0) {
            // Successfully executed the setup.bat script
            console.log('Update completed successfully');
          } else {
            console.error(`setup.bat script exited with code ${code}`);
          }
          // Exit the current Node.js script
          process.exit(code);
        });
      } else {
        console.error(`git clone exited with code ${code}`);
      }
    });
  } catch (error) {
    console.error('Error updating the script:', error);
  }
}

async function upgradeUnix() {
  try {
    // Check if the user is root
    if (process.getuid() !== 0) {
      console.error('You must run this script as root (sudo jtex upgrade)');
      return;
    }

    const repoUrl = 'https://github.com/Jaybit0/JtexClient.git';
    const localRepoPath = os.tmpdir() + '/tmp-update-repo';

    // Check if localRepoPath exists and delete it
    await deleteFolderRecursive(localRepoPath);

    // Clone the Git repository containing the update
    const gitClone = spawn('git', ['clone', repoUrl, localRepoPath]);
    gitClone.on('error', (error) => {
      console.error('Error cloning the repository:', error);
    });

    gitClone.on('exit', (code) => {
      if (code === 0) {
        // Successfully cloned the repository, now run the install.sh script
        const installScript = spawn('sudo', ['./install.sh', process.ppid], {
          stdio: 'inherit',
          cwd: localRepoPath
        });
        installScript.on('error', (error) => {
          console.error('Error running the install.sh script:', error);
        });

        installScript.on('exit', (code) => {
          if (code === 0) {
            // Successfully executed the install.sh script
            console.log('Update completed successfully');
          } else {
            console.error(`install.sh script exited with code ${code}`);
          }
          // Exit the current Node.js script
          process.exit(code);
        });
      } else {
        console.error(`git clone exited with code ${code}`);
      }
    });
  } catch (error) {
    console.error('Error updating the script:', error);
  }
}

exports.upgrade = upgrade;