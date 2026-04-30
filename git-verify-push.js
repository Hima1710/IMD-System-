const { execSync } = require('child_process');
const gitPath = 'C:\\Program Files\\Git\\bin\\git.exe';

try {
  // Check local and remote in detail
  console.log('=== LOCAL HEAD ===');
  execSync(`"${gitPath}" show HEAD --oneline --stat`, { stdio: 'inherit' });
  
  console.log('\n=== REMOTE MAIN ===');
  execSync(`"${gitPath}" show origin/main --oneline --stat`, { stdio: 'inherit' });
  
  console.log('\n=== VERIFY PUSH ===');
  // Try to push with force or check connection
  execSync(`"${gitPath}" ls-remote --heads origin main`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error:', error.message);
}
