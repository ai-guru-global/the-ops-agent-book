#!/usr/bin/env node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  runCanary, runNotReadyScenario, runRollback, runShadow, writeRunOutput,
} from './src/runtime.mjs';

const MODES = {
  demo: runNotReadyScenario,
  shadow: runShadow,
  canary: runCanary,
  rollback: runRollback,
};

function usage() {
  console.error('Usage: node runner.mjs demo|shadow|canary|rollback --output <dir>');
}

export function parseArgs(argv) {
  const mode = argv[0];
  if (!MODES[mode]) throw new Error('INVALID_MODE');
  let outputDir = null;
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === '--output' && argv[index + 1] && !argv[index + 1].startsWith('--')) {
      outputDir = resolve(argv[index + 1]);
      index += 1;
    } else {
      throw new Error('INVALID_ARGUMENTS');
    }
  }
  if (!outputDir) throw new Error('OUTPUT_REQUIRED');
  return { mode, outputDir };
}

export async function main(argv = process.argv.slice(2)) {
  try {
    const { mode, outputDir } = parseArgs(argv);
    const result = MODES[mode]();
    const files = writeRunOutput(result, outputDir);
    console.log(JSON.stringify({
      mode,
      outcome: result.summary.outcome,
      verified: result.summary.verified,
      event_count: files.event_count,
      trace_verified: files.trace_verified,
      anchor_verified: files.anchor_verified,
      summary: files.summary_path,
      trace: files.trace_path,
      anchor: files.anchor_path,
    }, null, 2));
    return result.summary.outcome === 'failure' || result.summary.outcome === 'escalated' ? 1 : 0;
  } catch (error) {
    console.error(`${error.code || 'RUNNER_ERROR'}: ${error.message}`);
    usage();
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
