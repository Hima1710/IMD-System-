const { execSync } = require('child_process');
const gitPath = 'C:\\Program Files\\Git\\bin\\git.exe';

try {
  console.log('Adding files...');
  execSync(`"${gitPath}" add -A`, { stdio: 'inherit' });
  
  console.log('Checking status...');
  execSync(`"${gitPath}" status`, { stdio: 'inherit' });
  
  console.log('Committing...');
  execSync(`"${gitPath}" commit -m "Fix: Replace supabase.raw() with fetch-then-update for stock increment"`, { stdio: 'inherit' });
  
  console.log('Pushing to main...');
  execSync(`"${gitPath}" push origin main`, { stdio: 'inherit' });
  
  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
}
