const assert = require('node:assert/strict');
const base = process.env.COURSE_QA_URL || 'http://localhost:3014';

(async () => {
  for (const prefix of ['', '/ru']) {
    for (const route of ['/', '/courses/build-with-codex', '/learn/welcome']) {
      const response = await fetch(`${base}${prefix}${route}`);
      assert.equal(response.status, 200, `${prefix}${route} should load`);
      const html = await response.text();
      assert(!html.includes('hello@g-lab.agency'));
      assert(!/try the free lesson|free preview|first lesson for free|бесплатный урок|первый урок — бесплатно/i.test(html));
      if (route === '/courses/build-with-codex') {
        assert.equal((html.match(/class="course-sales-buy"/g) || []).length, 2);
        assert(html.includes('<section class="course-sales-hero">') && html.includes('course-sales-hero-purchase'));
        assert(html.includes(prefix ? 'ПЛАН КУРСА / 16 УРОКОВ' : 'COURSE MAP / 16 LESSONS'));
        assert(html.includes('course-sales-result'));
      }
      if (route === '/learn/welcome') {
        assert(html.includes('account-layout'));
        assert(!html.includes('project-challenge') && !html.includes('fl-chapter'));
      }
    }
  }
  console.log('PASS: RU/EN home, course overview with top and final purchase actions, and lesson paywall; no trial copy or example lesson in anonymous HTML.');
})().catch((error) => { console.error(error); process.exit(1); });
