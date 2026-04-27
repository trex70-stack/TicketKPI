import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_KEY = 'Y7fPjV2sR9cD1xL4kH8bM0zG3wN6qE5aT';

function runExport() {
  if (!process.env.CONFIG_DB_KEY) {
    process.env.CONFIG_DB_KEY = DEFAULT_KEY;
  }
  
  const args = process.argv.slice(2);
  const year = args[0] || '26';
  const outputFile = args[1] || null;
  
  const scriptPath = join(__dirname, 'closed-tickets-report.js');
  
  const childArgs = [scriptPath, year];
  if (outputFile) childArgs.push(outputFile);
  
  const child = spawn('node', childArgs, {
    stdio: 'inherit',
    env: process.env
  });
  
  child.on('close', (code) => {
    process.exit(code);
  });
}

runExport();
