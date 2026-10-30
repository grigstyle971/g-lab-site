const fs = require('node:fs');
const ts = require('../node_modules/typescript');
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (name) {
  if (name === 'server-only') return {};
  return originalLoad.apply(this, arguments);
};
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, file);
const { lessons, modules } = require('../lib/course.ts');
const { practicalLessons } = require('../lib/practical-course.ts');
const assert = (condition, message) => { if (!condition) throw Error(message); };
const base = process.env.COURSE_QA_URL || 'http://localhost:3014';

(async () => {
  assert(lessons.length === 16 && practicalLessons.length === 15, 'Expected sixteen complete lessons');
  assert(new Set(lessons.map((lesson) => lesson.slug)).size === 16, 'Duplicate lesson routes');
  assert(modules.length === 4 && modules.every((module) => module.lessons.length === 4), 'Expected four lessons per module');
  for (const lesson of practicalLessons) {
    assert(lesson.chapters.length >= 6, `Incomplete walkthrough: ${lesson.slug}`);
    assert(lesson.quiz.length >= 3 && lesson.quiz.length <= 4 && lesson.quiz.every((question) => question.correct >= 0 && question.correct < question.answers.length), `Invalid quiz: ${lesson.slug}`);
    assert(lesson.chapters.some((chapter) => chapter.prompt) && lesson.troubleshooting.length >= 3 && lesson.checks.length >= 5, `Missing practice: ${lesson.slug}`);
  }

  for (const prefix of ['', '/ru']) {
    for (const lesson of lessons) {
      const response = await fetch(`${base}${prefix}/learn/${lesson.slug}`);
      assert(response.status === 200, `Route failed: ${prefix}${lesson.slug}`);
      const html = await response.text();
      assert(html.includes('account-layout'), `Missing paid access gate: ${prefix}${lesson.slug}`);
      assert(!html.includes('fl-chapter') && !html.includes('project-challenge'), `Anonymous lesson content exposed: ${prefix}${lesson.slug}`);
    }
  }
  const missing = await fetch(`${base}/learn/not-a-real-lesson`);
  assert(missing.status === 404, 'Unknown lesson should be 404');
  console.log('PASS: 16 lessons, 4 modules, practical lesson structure, all anonymous RU/EN lesson routes gated and unknown lesson is 404.');
})().catch((error) => { console.error(error); process.exit(1); });
