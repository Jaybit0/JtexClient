const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');

async function upgrade() {
    try {
      const repoUrl = 'https://github.com/Jaybit0/JtexClient.git';
      const localRepoPath = os.tmpdir() + '/tmp-update-repo';

      // Check if localRepoPath exists and delete it
      if (fs.existsSync(localRepoPath)) {
        await rimraf(localRepoPath);
      }
  
      // Clone the Git repository containing the update
      const gitClone = spawn('git', ['clone', repoUrl, localRepoPath]);
      gitClone.on('error', (error) => {
        console.error('Error cloning the repository:', error);
      });
  
      gitClone.on('exit', (code) => {
        if (code === 0) {
          // Successfully cloned the repository, now run the install.sh script
          const installScript = spawn('sudo', [`${localRepoPath}/install.sh`, process.pid], { stdio: 'inherit' });
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