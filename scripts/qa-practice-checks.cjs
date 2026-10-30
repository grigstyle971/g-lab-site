// Exercise the actual lesson components and the JSON boundary used by account saves.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const originalLoad = Module._load;
Module._load = function (name) {
  if (name === 'server-only') return {};
  return originalLoad.apply(this, arguments);
};
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, file);
}
const { practicalLessons } = require('../lib/practical-course.ts');
const { evidenceChecks } = require('../lib/first-lesson.ts');
const { FirstLesson } = require('../components/FirstLesson.tsx');
const { LessonNotebook } = require('../components/LessonNotebook.tsx');
const { CompletionChecklist } = require('../components/CompletionChecklist.tsx');
const { LanguageProvider, LessonTranslations } = require('../components/LanguageProvider.tsx');
const { lessonTranslations } = require('../lib/i18n/lesson-translations.ts');
const { translate } = require('../lib/i18n/translate.ts');
const { restorePracticeChecks, readLessonDraft } = require('../lib/lesson-progress.ts');
const { validNotebook } = require('../lib/account/notebook.ts');
const all = [{ slug: 'welcome', checks: evidenceChecks }, ...practicalLessons];
assert.equal(all.length, 16);
let count = 0;
for (const lesson of all) {
  assert(lesson.checks.length >= 5, `Missing project actions: ${lesson.slug}`);
  assert.equal(new Set(lesson.checks).size, lesson.checks.length);
  count += lesson.checks.length;
  const extra = lesson.slug === 'welcome' ? {} : lessonTranslations(lesson);
  for (const check of lesson.checks) {
    assert(/[а-яё]/i.test(translate(check, 'ru', extra)), `Untranslated action: ${lesson.slug}: ${check}`);
  }
  for (const locale of ['en', 'ru']) {
    const html = renderToStaticMarkup(React.createElement(LanguageProvider, { locale },
      React.createElement(LessonTranslations, { translations: extra },
        lesson.slug === 'welcome' ? React.createElement(FirstLesson) : React.createElement(LessonNotebook, { lesson }))));
    assert.equal((html.match(/type="checkbox"/g) || []).length, lesson.checks.length, `${locale}/${lesson.slug}: missing actions in the real lesson UI`);
    assert(html.includes('id="project-checks"') && html.includes('aria-describedby="project-checks-help"'));
    assert(html.includes(locale === 'ru' ? 'Практика в вашем проекте' : 'Your work in the project'));
    assert(html.includes(locale === 'ru' ? `подтверждено 0 из ${lesson.checks.length}` : `0 of ${lesson.checks.length} confirmed`));
  }
  const note = { notes: 'Observed result in my project', url: 'https://example.com', practiceChecks: lesson.checks };
  assert(validNotebook(JSON.parse(JSON.stringify(note))), `Cannot save checklist for ${lesson.slug}`);
  assert.deepEqual(restorePracticeChecks(note.practiceChecks, lesson.checks), lesson.checks);
}
const checks = evidenceChecks;
assert.deepEqual(restorePracticeChecks([checks[0], checks[0], 'removed requirement', null, 2], checks), [checks[0]]);
assert.deepEqual(restorePracticeChecks([checks[0]], ['Changed wording requiring a new review.']), []);
for (const old of [undefined, null, {}, true, 'all completed', [0, 1, true]]) assert.deepEqual(restorePracticeChecks(old, checks), []);
const legacy = { notes: 'Keep my older notes', answers: { 0: 1 }, reviewed: true };
assert.deepEqual(readLessonDraft(JSON.stringify(legacy)), legacy);
for (const bad of [null, '{broken', 'null', '[]', 'true']) assert.deepEqual(readLessonDraft(bad), {});
assert(validNotebook({ notes: 'Older account notebook', url: '', answers: { 0: 1 } }));
for (const bad of ['all', {}, null, [1], [''], ['a', 'a'], ['x'.repeat(501)], Array.from({ length: 21 }, (_, i) => String(i))]) {
  assert(!validNotebook({ notes: '', url: '', practiceChecks: bad }), 'Account API must reject malformed checklists');
}
const readyProps = { practiceConfirmed: 0, practiceTotal: 5, activitiesPassed: true, answered: 3, correct: 3, questions: 3, reviewed: true, complete: false };
const incomplete = renderToStaticMarkup(React.createElement(CompletionChecklist, readyProps));
assert(incomplete.includes('1 step left') && incomplete.includes('href="#project-checks"'));
assert(!incomplete.includes('Ready — mark'));
const ready = renderToStaticMarkup(React.createElement(CompletionChecklist, { ...readyProps, practiceConfirmed: 5 }));
assert(ready.includes('Ready — mark'));
console.log(`PASS: ${all.length} real lesson components in RU/EN, ${count} translated project checks, completion requirements, current/legacy restoration and account JSON validation.`);
