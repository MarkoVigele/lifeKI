import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createConnection } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NAME, PORT, URL } from './config.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const action = process.argv[2] ?? 'starten'

function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: root, stdio: opts.quiet ? 'pipe' : 'inherit', encoding: 'utf8' })
}

function listening() {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port: PORT }, () => {
      socket.end()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
  })
}

function pidsOnPort() {
  try {
    const out = execSync(`lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t`, { encoding: 'utf8' }).trim()
    return out ? out.split('\n').filter(Boolean) : []
  } catch {
    return []
  }
}

async function starten() {
  if (await listening()) {
    console.log(`${NAME} läuft bereits unter ${URL}`)
    return
  }
  if (!existsSync(join(root, 'node_modules'))) {
    console.log('Abhängigkeiten fehlen — installiere einmalig …')
    sh('npm install')
  }
  console.log(`${NAME} startet unter ${URL}`)
  const child = spawn('npm', ['run', 'dev'], { cwd: root, stdio: 'inherit' })
  const code = await new Promise((resolve) => child.on('exit', (c) => resolve(c ?? 0)))
  process.exit(code)
}

function stoppen() {
  const pids = pidsOnPort()
  if (pids.length === 0) {
    console.log(`${NAME} läuft nicht (Port ${PORT} ist frei).`)
    return
  }
  for (const pid of pids) {
    try {
      process.kill(Number(pid), 'SIGTERM')
    } catch {
      /* already gone */
    }
  }
  console.log(`${NAME} gestoppt.`)
}

function updaten() {
  try {
    sh('git rev-parse --is-inside-work-tree', { quiet: true })
    console.log('1/2  git pull …')
    sh('git pull --ff-only')
  } catch {
    console.log('Kein Git-Remote oder Pull nicht möglich — überspringe git pull.')
  }
  console.log('2/2  npm install …')
  sh('npm install')
  console.log('Update fertig.')
}

const commands = {
  starten,
  start: starten,
  stoppen,
  stop: stoppen,
  updaten,
  update: updaten,
  async neustart() {
    stoppen()
    await new Promise((r) => setTimeout(r, 400))
    await starten()
  },
  async 'neustart-update'() {
    stoppen()
    await new Promise((r) => setTimeout(r, 400))
    updaten()
    await new Promise((r) => setTimeout(r, 200))
    await starten()
  },
}

if (!commands[action]) {
  console.error(`Unbekannt: ${action}`)
  console.error('Befehle: starten | stoppen | updaten | neustart | neustart-update')
  process.exit(1)
}

await commands[action]()
