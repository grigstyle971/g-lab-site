const assert = require('node:assert/strict');
const base = process.env.COURSE_QA_URL || 'http://localhost:3014';

(async () => {
  for (const prefix of ['', '/ru']) {
    const response = await fetch(`${base}${prefix}/learn/welcome`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert(html.includes('account-layout'));
    assert(!html.includes('fl-chapter') && !html.includes('project-challenge') && !html.includes('lesson-code'));
    assert(html.includes(prefix ? 'Получить доступ к курсу' : 'Get course access'));
  }
  console.log('PASS: the first lesson is gated in English and Russian; no free preview or lesson content is sent to anonymous visitors.');
})().catch((error) => { console.error(error); process.exit(1); });
