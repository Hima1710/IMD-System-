const { execSync } = require('child_process');
const gitPath = 'C:\\Program Files\\Git\\bin\\git.exe';

try {
  console.log('Pushing to main...');
  execSync(`"${gitPath}" push origin main`, { stdio: 'inherit' });
  
  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
}
