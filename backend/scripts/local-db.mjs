/**
 * Local PostgreSQL for development, no installer or Docker needed.
 *
 * Uses the PostgreSQL binaries shipped by the `embedded-postgres` dev
 * dependency and keeps the data directory in `backend/.pgdata` (git-ignored).
 *
 *   npm run db:start   # initialises the cluster on first run, then starts it
 *   npm run db:stop
 *   npm run db:status
 *   npm run db:reset   # stops and wipes the data directory
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const pg = require('pg');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, '.pgdata');
const LOG_FILE = path.join(DATA_DIR, 'postgres.log');

const PORT = Number(process.env.LOCAL_PG_PORT ?? 5432);
const USER = 'postgres';
const PASSWORD = 'postgres';
const DATABASE = 'chat';

const platformPackage = {
  win32: '@embedded-postgres/windows-x64',
  darwin: process.arch === 'arm64' ? '@embedded-postgres/darwin-arm64' : '@embedded-postgres/darwin-x64',
  linux: process.arch === 'arm64' ? '@embedded-postgres/linux-arm64' : '@embedded-postgres/linux-x64',
}[process.platform];

// The platform package exports absolute paths to pg_ctl, initdb and postgres.
const binaries = await import(platformPackage);
const exe = (name) => binaries[name];

const run = (bin, args, opts = {}) => {
  const result = spawnSync(exe(bin), args, { stdio: 'inherit', ...opts });
  if (result.error) throw result.error;
  return result.status ?? 1;
};

const isInitialised = () => existsSync(path.join(DATA_DIR, 'PG_VERSION'));

const init = () => {
  if (isInitialised()) return;
  console.log(`Initialising PostgreSQL cluster in ${DATA_DIR}`);
  mkdirSync(DATA_DIR, { recursive: true });
  const pwFile = path.join(ROOT, '.pgpass.tmp');
  writeFileSync(pwFile, PASSWORD);
  try {
    const status = run('initdb', [
      '-D', DATA_DIR,
      '-U', USER,
      '--auth=scram-sha-256',
      `--pwfile=${pwFile}`,
      '-E', 'UTF8',
      '--locale=C',
    ]);
    if (status !== 0) throw new Error('initdb failed');
  } finally {
    rmSync(pwFile, { force: true });
  }
};

const status = () => run('pg_ctl', ['status', '-D', DATA_DIR]) === 0;

const start = async () => {
  init();
  if (status()) {
    console.log('PostgreSQL is already running');
  } else {
    // stdio must not be inherited here: the postgres server would hold on to
    // this terminal's pipes and keep the calling shell waiting forever.
    const code = run(
      'pg_ctl',
      ['start', '-w', '-D', DATA_DIR, '-l', LOG_FILE, '-o', `-p ${PORT} -c listen_addresses=127.0.0.1`],
      { stdio: 'ignore', windowsHide: true },
    );
    if (code !== 0) throw new Error(`pg_ctl start failed, see ${LOG_FILE}`);
  }
  await ensureDatabase();
  console.log(`\nDATABASE_URL="postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}"`);
};

const ensureDatabase = async () => {
  const client = new pg.Client({ host: '127.0.0.1', port: PORT, user: USER, password: PASSWORD, database: 'postgres' });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DATABASE]);
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${DATABASE}"`);
      console.log(`Created database "${DATABASE}"`);
    }
  } finally {
    await client.end();
  }
};

const stop = () => {
  if (!isInitialised() || !status()) {
    console.log('PostgreSQL is not running');
    return;
  }
  run('pg_ctl', ['stop', '-w', '-D', DATA_DIR, '-m', 'fast']);
};

const reset = () => {
  stop();
  rmSync(DATA_DIR, { recursive: true, force: true });
  console.log('Data directory removed');
};

const command = process.argv[2];
const commands = { start, stop, status: () => process.exit(status() ? 0 : 1), reset };

if (!commands[command]) {
  console.error(`Usage: node scripts/local-db.mjs <${Object.keys(commands).join('|')}>`);
  process.exit(2);
}

Promise.resolve(commands[command]()).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
