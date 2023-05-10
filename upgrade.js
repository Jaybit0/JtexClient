const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const os = require('os');

async function upgrade() {
  // Clone the Git repository containing the update
  try {
    const repoUrl = 'https://github.com/Jaybit0/JtexClient.git';
    const localRepoPath = os.tmpdir() + '/JTeXUpdate';
    await execAsync(`git clone ${repoUrl} ${localRepoPath}`);

    // Run the install.sh script with sudo and pass the current process's PID as an argument
    execAsync(`sudo ${localRepoPath}/install.sh ${process.pid}`);

    // Exit the current Node.js script
    process.exit(0);
  } catch (error) {
    console.error('Error updating the script:', error);
  }
}

exports.upgrade = upgrade;