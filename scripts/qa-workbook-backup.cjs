const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, file);
const { lessons } = require('../lib/course.ts');
const { makeWorkbookBackup, readWorkbookBackup, snapshotFingerprint } = require('../lib/workbook-backup.ts');
const { projectNotePrompts, projectNoteOutline } = require('../lib/project-note-prompts.ts');
const { validNotebook } = require('../lib/account/notebook.ts');
const content = {
  notes: 'Actual project observation: the contact link works. Recovery is not checked yet.',
  url: 'https://example.com', answers: { 0: 1 },
  activities: { choice: 1, order: [2, 0, 1] },
  practiceChecks: ['I tested the main action.'],
  brief: { business: 'Practice photographer', audience: 'Parents', outcome: 'Understand the session', action: 'Reach contacts' },
};
assert.equal(lessons.length, 16);
assert.equal(Object.keys(projectNotePrompts).length, 16);
for (const lesson of lessons) {
  for (const locale of ['en', 'ru']) {
    const outline = projectNoteOutline(lesson.slug, locale);
    assert.equal(projectNotePrompts[lesson.slug][locale].length, 4);
    assert.equal(outline.split(locale === 'ru' ? '[Мой результат или пока не проверено]' : '[My result or not checked yet]').length - 1, 4);
    assert(outline.includes('1. ') && outline.includes('4. '));
    const draft = { ...content, notes: outline };
    assert.deepEqual(readWorkbookBackup(makeWorkbookBackup(lesson.slug, draft), lesson.slug), { ok: true, content: draft });
    assert.deepEqual(readWorkbookBackup(JSON.stringify({ lesson: lesson.slug, ...draft }), lesson.slug), { ok: true, content: draft });
  }
}
const parse = value => readWorkbookBackup(JSON.stringify(value), 'welcome');
assert.equal(readWorkbookBackup('{not json', 'welcome').error, 'invalid');
assert.equal(parse(null).error, 'invalid');
assert.equal(parse([]).error, 'invalid');
assert.equal(parse({ lesson: 'data-model', ...content }).error, 'lesson');
assert.equal(parse({ lesson: 'welcome', format: 'g-lab-workbook', version: 2, content }).error, 'version');
assert.equal(parse({ lesson: 'welcome', ...content, answers: { 0: 'yes' } }).error, 'invalid');
assert.equal(parse({ lesson: 'welcome', ...content, activities: { choice: 0, order: [0, 0, 1] } }).error, 'invalid');
assert.equal(parse({ lesson: 'welcome', ...content, notes: 'a'.repeat(12001) }).error, 'invalid');
assert.equal(parse({ lesson: 'welcome', ...content, notes: 'я'.repeat(51000) }).error, 'size');
assert.equal(parse({ lesson: 'welcome', ...content, unexpected: 'not part of a notebook' }).error, 'invalid');
const invalidUrlDraft = { ...content, url: 'still typing my address' };
assert.deepEqual(parse({ lesson: 'welcome', ...invalidUrlDraft }).content, invalidUrlDraft);
assert.equal(validNotebook(invalidUrlDraft), false, 'An unfinished URL must not bypass account validation');
assert.equal(parse({ lesson: 'welcome', notes: 'Old note', url: '' }).content.answers.constructor, Object);
assert.equal(snapshotFingerprint({ answers: { 1: 0, 0: 2 }, practiceChecks: ['b', 'a'] }), snapshotFingerprint({ answers: { 0: 2, 1: 0 }, practiceChecks: ['a', 'b'] }));
assert.notEqual(snapshotFingerprint(content), snapshotFingerprint({ ...content, answers: { 0: 2 } }));
console.log('PASS: all 16 RU/EN note plans; current/legacy backup round trips; invalid, oversized and wrong-lesson files rejected; incomplete drafts preserved without bypassing account validation.');
