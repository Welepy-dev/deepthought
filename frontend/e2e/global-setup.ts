import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = join(__dirname, '.auth.json');

/**
 * The app has no self-serve signup (accounts only come from 42 OAuth), so the
 * smoke suite needs an existing seed user to test authenticated pages against.
 * Minting the JWT inside the `transcendence_backend` container (instead of on
 * the host) means the suite needs zero DB credentials or JWT_SECRET of its
 * own — it just needs the dev stack (`make up`) already running.
 */
export default function globalSetup() {
  const script = readFileSync(join(__dirname, 'generate-token.js'));

  let output: string;
  try {
    output = execFileSync('docker', ['exec', '-i', 'transcendence_backend', 'node'], {
      input: script,
    }).toString().trim();
  } catch (error: any) {
    throw new Error(
      `Could not mint a test JWT via the backend container. Is the stack running (\`make up\`)? ` +
        `Original error: ${error.stderr?.toString() ?? error.message}`,
    );
  }

  writeFileSync(AUTH_FILE, output);
}
