#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILLS_DIR = path.join(__dirname, 'skills');
const REPORTS_DIR = path.join(__dirname, 'reports');
const PROJECT_ROOT = path.join(__dirname, '..');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

function loadSkills() {
  const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(SKILLS_DIR, f), 'utf8'));
    data._filename = f;
    return data;
  });
}

function evaluateExpect(output, expect) {
  const num = parseInt(output.trim(), 10);
  if (isNaN(num)) return { pass: false, actual: output.trim(), reason: 'Non-numeric output' };

  if (expect.startsWith('min:')) {
    const threshold = parseInt(expect.split(':')[1], 10);
    return { pass: num >= threshold, actual: num, expected: '>= ' + threshold };
  }
  if (expect.startsWith('max:')) {
    const threshold = parseInt(expect.split(':')[1], 10);
    return { pass: num <= threshold, actual: num, expected: '<= ' + threshold };
  }
  if (expect.startsWith('exact:')) {
    const target = parseInt(expect.split(':')[1], 10);
    return { pass: num === target, actual: num, expected: '== ' + target };
  }
  return { pass: false, actual: num, reason: 'Unknown expect format: ' + expect };
}

function runCheck(check) {
  const startTime = Date.now();
  try {
    const output = execSync(check.command, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const result = evaluateExpect(output, check.expect);
    return {
      id: check.id,
      name: check.name,
      severity: check.severity,
      pass: result.pass,
      actual: result.actual,
      expected: result.expected || check.expect,
      duration_ms: Date.now() - startTime,
      fix: result.pass ? null : check.fix
    };
  } catch (err) {
    // Command failed (non-zero exit) — treat output or '0'
    const output = (err.stdout || '0').trim();
    const result = evaluateExpect(output, check.expect);
    return {
      id: check.id,
      name: check.name,
      severity: check.severity,
      pass: result.pass,
      actual: result.actual || 0,
      expected: result.expected || check.expect,
      duration_ms: Date.now() - startTime,
      fix: result.pass ? null : check.fix,
      error: err.message ? err.message.split('\n')[0] : 'Command failed'
    };
  }
}

function runSkill(skill) {
  const results = skill.checks.map(runCheck);
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const passRate = total > 0 ? (passed / total * 100) : 0;

  return {
    name: skill.name,
    file: skill._filename,
    total,
    passed,
    failed: total - passed,
    passRate: Math.round(passRate * 100) / 100,
    checks: results
  };
}

function runAllAgents() {
  const skills = loadSkills();
  const timestamp = new Date().toISOString();

  const agentResults = skills.map(runSkill);

  const totalChecks = agentResults.reduce((sum, a) => sum + a.total, 0);
  const totalPassed = agentResults.reduce((sum, a) => sum + a.passed, 0);
  const overallPassRate = totalChecks > 0 ? (totalPassed / totalChecks * 100) : 0;

  // Calculate agent-skill usage (all agents used all their skill checks)
  const agentsUsingSkills = agentResults.filter(a => a.total > 0).length;
  const totalAgents = agentResults.length;
  const skillUsageRate = totalAgents > 0 ? (agentsUsingSkills / totalAgents * 100) : 0;

  const report = {
    timestamp,
    summary: {
      totalAgents: agentResults.length,
      totalChecks,
      totalPassed,
      totalFailed: totalChecks - totalPassed,
      overallPassRate: Math.round(overallPassRate * 100) / 100,
      skillUsageRate: Math.round(skillUsageRate * 100) / 100,
      programScore: Math.round(overallPassRate * 100) / 100,
      targetsMetProgram: overallPassRate >= 99.99,
      targetsMetSkills: agentResults.every(a => a.passRate >= 98),
      targetsMetAgents: agentResults.every(a => a.passRate >= 99),
      targetsMetUsage: skillUsageRate >= 99,
      allTargetsMet: overallPassRate >= 99.99
        && agentResults.every(a => a.passRate >= 98)
        && skillUsageRate >= 99
    },
    agents: agentResults
  };

  return report;
}

function printReport(report, verbose) {
  console.log('\n' + '='.repeat(60));
  console.log('  AGENT RUNNER — ITERATION REPORT');
  console.log('  ' + report.timestamp);
  console.log('='.repeat(60));

  report.agents.forEach(agent => {
    const status = agent.passRate >= 99 ? 'PASS' : agent.passRate >= 98 ? 'WARN' : 'FAIL';
    const icon = status === 'PASS' ? '[OK]' : status === 'WARN' ? '[!!]' : '[XX]';
    console.log('\n  ' + icon + ' ' + agent.name + ': ' + agent.passRate + '% (' + agent.passed + '/' + agent.total + ')');

    if (verbose || status !== 'PASS') {
      agent.checks.forEach(check => {
        const mark = check.pass ? '    [+]' : '    [-]';
        console.log(mark + ' ' + check.name + ' (actual: ' + check.actual + ', expected: ' + check.expected + ')');
        if (!check.pass && check.fix) {
          console.log('        FIX: ' + check.fix);
        }
      });
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log('  OVERALL: ' + report.summary.overallPassRate + '% (' + report.summary.totalPassed + '/' + report.summary.totalChecks + ')');
  console.log('  Program Score:     ' + report.summary.programScore + '% (target: 99.99%)');
  console.log('  Skill Usage Rate:  ' + report.summary.skillUsageRate + '% (target: 99%)');
  console.log('  All Targets Met:   ' + (report.summary.allTargetsMet ? 'YES' : 'NO'));
  console.log('='.repeat(60) + '\n');
}

// Main
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const maxLoops = 1;

let loop = 0;
let report;

do {
  loop++;
  console.log('\n>>> Loop ' + loop + '/' + maxLoops);
  report = runAllAgents();
  printReport(report, verbose);

  // Save report
  const reportFile = path.join(REPORTS_DIR, 'report-' + loop + '.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log('Report saved to: ' + reportFile);

  if (report.summary.allTargetsMet) {
    console.log('\n>>> ALL TARGETS MET! Stopping.');
    break;
  }

  // Print failures for fixing
  if (!report.summary.allTargetsMet) {
    console.log('\n>>> FAILURES TO FIX:');
    report.agents.forEach(agent => {
      agent.checks.filter(c => !c.pass).forEach(c => {
        console.log('  [' + agent.name + '] ' + c.id + ': ' + c.fix);
      });
    });
  }
} while (loop < maxLoops);

// Save final summary
const summaryFile = path.join(REPORTS_DIR, 'latest.json');
fs.writeFileSync(summaryFile, JSON.stringify(report, null, 2));
console.log('Latest report: ' + summaryFile);

process.exit(report.summary.allTargetsMet ? 0 : 1);
