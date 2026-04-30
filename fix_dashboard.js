const fs = require('fs');

const content = fs.readFileSync('fix_dashboard.py', 'utf8');
const start = content.indexOf('r"""') + 4;
const end = content.lastIndexOf('"""');
const tsxContent = content.substring(start, end);
fs.writeFileSync('src/app/dashboard/page.tsx', tsxContent, 'utf8');
console.log('Dashboard fixed!');
