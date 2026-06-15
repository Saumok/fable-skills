#!/usr/bin/env node

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ── Constants ────────────────────────────────────────────────────────────────

const SKILLS = [
  'webbuilder', 'frontend', 'design', 'backend', 'database',
  'data', 'aiml', 'prompteng', 'security', 'devops',
  'reviewer', 'techlead', 'pm', 'seo', 'copy', 'growth', 'content',
];

const PKG_ROOT   = path.join(__dirname, '..');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');

// ── Helpers ──────────────────────────────────────────────────────────────────

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

function ok(msg)   { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); }
function warn(msg) { console.log(`  \x1b[33m!\x1b[0m ${msg}`); }
function fail(msg) { console.error(`  \x1b[31m✗\x1b[0m ${msg}`); }

function installSkill(name) {
  const src  = path.join(PKG_ROOT, `fable-${name}`);
  const dest = path.join(SKILLS_DIR, `fable-${name}`);
  if (!fs.existsSync(src)) {
    fail(`Unknown skill: "${name}"`);
    console.error(`     Available: ${SKILLS.join(', ')}`);
    process.exit(1);
  }
  copyDir(src, dest);
  ok(`fable-${name}`);
}

function removeSkill(name) {
  const dest = path.join(SKILLS_DIR, `fable-${name}`);
  if (!fs.existsSync(dest)) {
    warn(`fable-${name} is not installed — nothing to remove`);
  } else {
    fs.rmSync(dest, { recursive: true, force: true });
    ok(`removed fable-${name}`);
  }
}

function installIdentity() {
  const identityDir = path.join(SKILLS_DIR, 'fable-identity');
  fs.mkdirSync(identityDir, { recursive: true });
  fs.copyFileSync(
    path.join(PKG_ROOT, 'CLAUDE-FABLE-5.md'),
    path.join(identityDir, 'CLAUDE-FABLE-5.md'),
  );
  const claudeMdDest = path.join(CLAUDE_DIR, 'CLAUDE.md');
  const claudeMdSrc  = path.join(PKG_ROOT, 'CLAUDE.md');

  if (fs.existsSync(claudeMdDest)) {
    // Back up existing CLAUDE.md before overwriting
    fs.copyFileSync(claudeMdDest, claudeMdDest + '.bak');
    warn('Existing ~/.claude/CLAUDE.md backed up to CLAUDE.md.bak');
  }
  fs.copyFileSync(claudeMdSrc, claudeMdDest);

  ok('fable-identity  (CLAUDE-FABLE-5.md)');
  ok('~/.claude/CLAUDE.md  (orchestrator)');
}

// ── Help text ────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
\x1b[1mFable Skills\x1b[0m — Expert minds for Claude Code

\x1b[1mUsage:\x1b[0m
  npx fable-skills add all              Install all 17 skills + identity layer
  npx fable-skills add <skill>          Install one skill
  npx fable-skills add <s1> <s2> ...   Install multiple skills
  npx fable-skills list                 Show all available skills
  npx fable-skills remove <skill>       Remove an installed skill

\x1b[1mSkills:\x1b[0m
  ${SKILLS.map(s => `/fable-${s}`).join('  ')}

\x1b[1mExamples:\x1b[0m
  npx fable-skills add all
  npx fable-skills add security
  npx fable-skills add backend database devops
  npx fable-skills remove seo
`);
}

function printList() {
  console.log('\n\x1b[1mAvailable Fable Skills\x1b[0m\n');
  const groups = {
    'Build & Engineering': ['webbuilder','frontend','design','backend','database','devops','reviewer','techlead'],
    'Data & AI':           ['data','aiml','prompteng','security'],
    'Product & Growth':    ['pm','seo','copy','growth','content'],
  };
  for (const [group, names] of Object.entries(groups)) {
    console.log(`  \x1b[2m${group}\x1b[0m`);
    names.forEach(n => {
      const installed = fs.existsSync(path.join(SKILLS_DIR, `fable-${n}`));
      const tag = installed ? ' \x1b[32m[installed]\x1b[0m' : '';
      console.log(`    /fable-${n}${tag}`);
    });
    console.log('');
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const [,, command, ...rest] = process.argv;

if (!command || ['help', '--help', '-h'].includes(command)) {
  printHelp();
  process.exit(0);
}

if (command === 'list') {
  printList();
  process.exit(0);
}

if (command === 'add') {
  if (!rest.length) {
    console.error('Specify a skill name or "all".  Run: npx fable-skills help');
    process.exit(1);
  }

  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  console.log('');

  if (rest.includes('all')) {
    console.log('\x1b[1mInstalling all Fable Skills...\x1b[0m\n');
    installIdentity();
    SKILLS.forEach(installSkill);
  } else {
    rest.forEach(installSkill);
  }

  console.log('\n\x1b[1mDone!\x1b[0m Open Claude Code and type \x1b[36m/fable-\x1b[0m to see your skills.\n');
  process.exit(0);
}

if (command === 'remove') {
  if (!rest.length) {
    console.error('Specify a skill to remove.  Run: npx fable-skills help');
    process.exit(1);
  }
  console.log('');
  rest.forEach(removeSkill);
  console.log('');
  process.exit(0);
}

console.error(`Unknown command: "${command}".  Run: npx fable-skills help`);
process.exit(1);
