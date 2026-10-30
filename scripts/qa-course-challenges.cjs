const fs = require('fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (name) {
  if (name === 'server-only') return {};
  return originalLoad.apply(this, arguments);
};
require.extensions['.ts'] = (module, file) =>
  module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, file);

const { lessons } = require('../lib/course.ts');
const { courseChallenges } = require('../lib/course-challenges.ts');
const { translate } = require('../lib/i18n/translate.ts');
const { practicalLessons } = require('../lib/practical-course.ts');
const dictionary = { ...require('../lib/i18n/ru.json'), ...require('../lib/i18n/ru-overrides.json') };
const base = process.env.COURSE_QA_URL || 'http://localhost:3014';

async function run() {
  assert.equal(Object.keys(courseChallenges).length, lessons.length);
  for (const lesson of practicalLessons) {
    assert.equal(lesson.exercise, courseChallenges[lesson.slug].task[0]);
    assert.notEqual(translate(lesson.summary, 'ru', dictionary), lesson.summary);
    assert.notEqual(translate(lesson.exercise, 'ru', dictionary), lesson.exercise);
    assert.equal(lessons.find((item) => item.slug === lesson.slug).summary, lesson.summary);
  }

  for (const prefix of ['', '/ru']) {
    for (const lesson of lessons) {
      const response = await fetch(`${base}${prefix}/learn/${lesson.slug}`);
      assert.equal(response.status, 200, `Route failed: ${prefix}${lesson.slug}`);
      const html = await response.text();
      assert(html.includes('account-layout'), `Missing paywall: ${prefix}${lesson.slug}`);
      assert(!html.includes('project-challenge') && !html.includes('fl-chapter'), `Preview content exposed: ${prefix}${lesson.slug}`);
    }
  }

  console.log('PASS: all challenge/catalogue mappings translate; all 32 anonymous RU/EN lesson routes are gated without preview content.');
}
run().catch((error) => { console.error(error); process.exit(1); });
