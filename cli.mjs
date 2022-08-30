#!/usr/bin/env node

import Parser from 'tap-parser';
import chalk from 'chalk';

const PER_LINE = 32;

const p = new Parser(finish);
process.stdin.pipe(p);

let fail = 0;
let pass = 0;
let todo = 0;
let skip = 0;
let currentLineCount = 0;
let errors = [];

const red = chalk.ansi256(160);
const green = chalk.ansi256(118);
const yellow = chalk.ansi256(214);
const cyan = chalk.ansi256(80);

const emitDot = dot => {
	process.stdout.write(dot);
	++currentLineCount;

	if (currentLineCount === PER_LINE) {
		process.stdout.write('\n');
		currentLineCount = 0;
	}
};

const lineBreak = () => {
	process.stdout.write(currentLineCount === 0 ? '\n' : '\n\n');
	currentLineCount = 0;
};

const leftPad = str =>
	str
		.split('\n')
		.map(s => `    ${s}`)
		.join('\n');

const printDiagnostic = diag => {
	console.log();
	const duration = diag.diag.duration_ms
		? [chalk.dim(`<after ${diag.diag.duration_ms}ms>`)]
		: [];
	console.log(
		red('ERR'),
		chalk.dim(diag.id),
		chalk.whiteBright(diag.name),
		...duration
	);
	if (diag.diag.error) console.log(leftPad(red(diag.diag.error)));
	if (diag.diag.stack) console.log(leftPad(chalk.dim(diag.diag.stack)));
	console.log();
};

const formatReports = reports =>
	reports.length === 1
		? reports[0].join(' ')
		: reports
				.reduce((final, report, i) => {
					final.push(report.join(' '));
					switch (i) {
						case reports.length - 1:
							break;
						case reports.length - 2:
							final.push(', and ');
							break;
						default:
							final.push(', ');
					}
					return final;
				}, [])
				.join('');

function finish() {
	lineBreak();

	errors.forEach(printDiagnostic);

	const total = fail + pass + todo + skip;
	const ok = fail === 0;

	let reports = [];
	if (total === 0) reports.push([chalk.bold('no tests')]);
	if (pass > 0) reports.push([chalk.bold(green(pass)), 'passed']);
	if (fail > 0) reports.push([chalk.bold(red(fail)), 'failed']);
	if (skip > 0) reports.push([chalk.bold(yellow(skip)), 'skipped']);
	if (todo > 0) reports.push([chalk.bold(cyan(todo)), 'to-do']);

	const status = ok ? green('OK') : red('FAILED');

	const message = [status, 'with', formatReports(reports)];
	console.log(...message);

	process.exit(Number(!ok));
}

p.on('pass', () => {
	emitDot(green('.'));
	++pass;
});

p.on('fail', e => {
	emitDot(red('!'));
	errors.push(e);
	++fail;
});

p.on('todo', () => {
	emitDot(cyan('?'));
	++todo;
});

p.on('skip', () => {
	emitDot(yellow('*'));
	++skip;
});
