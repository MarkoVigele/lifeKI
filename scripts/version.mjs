import { execSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { NAME, STABLE_BRANCH, STAND_PREFIX, TEST_PREFIX } from './config.mjs'

const action = process.argv[2] ?? 'status'
const ask = process.argv.includes('--ask')
const nameArg = process.argv.find((a, i) => i > 2 && !a.startsWith('--'))

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim()
}

function trySh(cmd) {
  try {
    return sh(cmd)
  } catch {
    return ''
  }
}

function branches(prefix) {
  const raw = trySh('git branch --format="%(refname:short)"')
  return raw
    .split('\n')
    .map((b) => b.trim())
    .filter((b) => b.startsWith(prefix))
}

function slug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function prompt(question) {
  const rl = createInterface({ input, output })
  try {
    return (await rl.question(question)).trim()
  } finally {
    rl.close()
  }
}

async function confirm(message) {
  if (!ask) return true
  const answer = await prompt(`${message}  [j/N] `)
  return /^(j|ja|y|yes)$/i.test(answer)
}

function currentBranch() {
  return trySh('git rev-parse --abbrev-ref HEAD') || '—'
}

function shortHead() {
  return trySh('git rev-parse --short HEAD') || '—'
}

function dirty() {
  return Boolean(trySh('git status --porcelain'))
}

async function pickFrom(list, label) {
  if (list.length === 0) {
    console.log(`Keine ${label} vorhanden.`)
    return null
  }
  list.forEach((item, i) => console.log(`  ${i + 1}.  ${item}`))
  if (nameArg) {
    if (/^\d+$/.test(nameArg)) return list[Number(nameArg) - 1] ?? null
    const exact = list.find((b) => b === nameArg || b.endsWith(nameArg) || b === `${STAND_PREFIX}${nameArg}` || b === `${TEST_PREFIX}${nameArg}`)
    return exact ?? null
  }
  const choice = await prompt(`Welche ${label}? Nummer oder Name: `)
  if (/^\d+$/.test(choice)) return list[Number(choice) - 1] ?? null
  return list.find((b) => b === choice || b.endsWith(choice)) ?? null
}

function checkout(ref) {
  if (dirty()) {
    console.log('Uncommitted Änderungen — ich sichere sie kurz auf den Stash.')
    sh('git stash push -u -m "lifeki-auto vor Versionswechsel"')
  }
  sh(`git checkout ${ref}`)
}

async function status() {
  console.log(`${NAME} · Wo bin ich?`)
  console.log('')
  console.log(`Zweig    ${currentBranch()}`)
  console.log(`Commit   ${shortHead()}`)
  console.log(`Arbeitsbaum  ${dirty() ? 'hat ungesicherte Änderungen' : 'sauber'}`)
  const tests = branches(TEST_PREFIX)
  const stands = branches(STAND_PREFIX)
  console.log('')
  console.log(`Spielwiesen  ${tests.length ? tests.join(', ') : '—'}`)
  console.log(`Stände       ${stands.length ? stands.join(', ') : '—'}`)
}

async function stable() {
  if (!(await confirm(`Zurück auf ${STABLE_BRANCH}?`))) return
  checkout(STABLE_BRANCH)
  console.log(`Jetzt auf ${STABLE_BRANCH} (${shortHead()}).`)
}

async function newTest() {
  const raw = nameArg || (await prompt('Name der Spielwiese: '))
  const id = slug(raw)
  if (!id) {
    console.log('Kein Name — abgebrochen.')
    return
  }
  const branch = `${TEST_PREFIX}${id}`
  if (!(await confirm(`Spielwiese ${branch} anlegen? Stabil bleibt unberührt.`))) return
  sh(`git checkout -b ${branch}`)
  console.log(`Neue Spielwiese: ${branch}`)
}

async function openTest() {
  const chosen = await pickFrom(branches(TEST_PREFIX), 'Spielwiese')
  if (!chosen) return
  if (!(await confirm(`Spielwiese ${chosen} laden?`))) return
  checkout(chosen)
  console.log(`Geladen: ${chosen}`)
}

async function save() {
  const raw = nameArg || (await prompt('Name für diesen Stand (Foto): '))
  const id = slug(raw)
  if (!id) {
    console.log('Kein Name — abgebrochen.')
    return
  }
  const branch = `${STAND_PREFIX}${id}`
  const here = currentBranch()
  if (!(await confirm(`Stand ${branch} sichern?`))) return
  if (dirty()) {
    sh('git add -A')
    const tree = sh('git write-tree')
    const parent = sh('git rev-parse HEAD')
    const commit = sh(`git commit-tree ${tree} -p ${parent} -m "Stand: ${id}"`)
    sh(`git update-ref refs/heads/${branch} ${commit}`)
    sh('git reset -q')
  } else {
    sh(`git branch -f ${branch} HEAD`)
  }
  console.log(`Stand gesichert: ${branch}`)
  console.log(`Du bleibst auf ${here}.`)
}

async function load() {
  const chosen = await pickFrom(branches(STAND_PREFIX), 'Stand')
  if (!chosen) return
  if (!(await confirm(`Stand ${chosen} laden? Der aktuelle Zweig wird verlassen.`))) return
  checkout(chosen)
  console.log(`Stand geladen: ${chosen}`)
}

const commands = {
  status,
  stable,
  'new-test': newTest,
  'open-test': openTest,
  save,
  load,
}

if (!commands[action]) {
  console.error(`Unbekannt: ${action}`)
  console.error('Befehle: status | stable | new-test | open-test | save | load')
  process.exit(1)
}

await commands[action]()
