const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const releaseDir = path.join(__dirname, '..', 'release');

// Kill any lingering InvPos / Electron processes on Windows
if (process.platform === 'win32') {
  const processes = ['InvPos POS.exe', 'electron.exe'];
  for (const proc of processes) {
    try {
      execSync(`taskkill /F /IM "${proc}" /T`, { stdio: 'ignore' });
      console.log(`Killed process: ${proc}`);
    } catch {
      // Process not running — ignore
    }
  }
}

// Remove the release directory
if (fs.existsSync(releaseDir)) {
  try {
    fs.rmSync(releaseDir, { recursive: true, force: true });
    console.log('Cleaned release directory');
  } catch (e) {
    console.warn('Could not fully clean release directory:', e.message);
    // Try renaming instead
    try {
      const backup = releaseDir + '-old-' + Date.now();
      fs.renameSync(releaseDir, backup);
      console.log(`Renamed old release to ${path.basename(backup)}`);
    } catch {
      console.error('Failed to clean or rename release directory. Please close InvPos POS and retry.');
      process.exit(1);
    }
  }
} else {
  console.log('Release directory does not exist, proceeding');
}

console.log('Pre-clean complete');
