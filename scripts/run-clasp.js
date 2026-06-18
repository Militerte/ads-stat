const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/run-clasp.js <clasp-args...>');
  process.exit(1);
}

const clasp = path.join(__dirname, '..', 'node_modules', '@google', 'clasp', 'build', 'src', 'index.js');
const result = spawnSync(
  process.execPath,
  ['--dns-result-order=ipv4first', clasp, ...args],
  { stdio: 'inherit', env: process.env }
);

process.exit(result.status ?? 1);
