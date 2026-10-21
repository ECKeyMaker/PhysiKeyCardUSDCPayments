const fs = require('fs');
const path = require('path');

const env = process.argv[2]; // Get the environment from the command line argument

if (!env) {
  console.error('Please specify an environment (testnet or mainnet)');
  process.exit(1);
}

const envFile = path.resolve(__dirname, `.env.${env}`);
const targetFile = path.resolve(__dirname, '.env');

if (!fs.existsSync(envFile)) {
  console.error(`Environment file .env.${env} does not exist.`);
  if (fs.existsSync(`${envFile}.example`)) {
    console.error(
      `Create it from the template and add your API keys:\n  cp .env.${env}.example .env.${env}`,
    );
  }
  process.exit(1);
}

fs.copyFileSync(envFile, targetFile);
console.log(`Environment set to ${env}`);
