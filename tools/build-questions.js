/*
 * build-questions.js — copies data/questions.json into data/questions.js.
 *
 * Why? Browsers block fetch() of local JSON files when you open index.html
 * by double-clicking (file://). A .js file loaded with <script> always works.
 *
 * Run from the project folder:   node tools/build-questions.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const questions = JSON.parse(fs.readFileSync(path.join(root, 'data/questions.json'), 'utf8'));

const header =
  '/* AUTO-GENERATED copy of questions.json so the app also works when opened as a file (file://).\n' +
  '   After editing questions.json, regenerate with:  node tools/build-questions.js */\n';

fs.writeFileSync(
  path.join(root, 'data/questions.js'),
  header + 'window.SU_QUESTIONS = ' + JSON.stringify(questions, null, 1) + ';\n'
);
console.log('Wrote data/questions.js with ' + questions.length + ' questions.');
