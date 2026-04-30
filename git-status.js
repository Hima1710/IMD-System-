const { execSync } = require('child_process');
const gitPath = 'C:\\Program Files\\Git\\bin\\git.exe';

try {
  console.log('Checking git status...');
  execSync(`"${gitPath}" status`, { stdio: 'inherit' });
  
  console.log('\nChecking remote...');
  execSync(`"${gitPath}" remote -v`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error:', error.message);
}
