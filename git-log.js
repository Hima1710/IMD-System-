const { execSync } = require('child_process');
const gitPath = 'C:\\Program Files\\Git\\bin\\git.exe';

try {
  console.log('Last 5 commits:');
  execSync(`"${gitPath}" log --oneline -5`, { stdio: 'inherit' });
  
  console.log('\nVerifying fetch...');
  execSync(`"${gitPath}" fetch origin`, { stdio: 'inherit' });
  
  console.log('\nComparing with remote...');
  execSync(`"${gitPath}" log --oneline origin/main -3`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error:', error.message);
}
