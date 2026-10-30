const fs = require('node:fs');
const path = require('node:path');
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

const { practicalLessons } = require('../lib/practical-course.ts');
const base = process.env.COURSE_QA_URL || 'http://localhost:3014';
const allowedOrigin = process.env.APP_URL || 'https://g-lab.agency';

async function response(route, options) {
  return fetch(`${base}${route}`, options);
}
async function readPage(route) {
  const result = await response(route);
  assert.equal(result.status, 200, `${route} should load`);
  return result.text();
}
function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)],
  );
}

(async () => {
  for (const prefix of ['', '/ru']) {
    const account = await response(`${prefix}/account`, { redirect: 'manual' });
    assert([307, 308].includes(account.status), `${prefix}/account should redirect to sign in`);
    assert(new URL(account.headers.get('location'), base).searchParams.get('mode') === 'signin', `${prefix}/account must not advertise signup to visitors`);

    const afterPurchase = await response(`${prefix}/account?payment=pending`, { redirect: 'manual' });
    assert([307, 308].includes(afterPurchase.status), `${prefix}/account?payment=pending should open account creation`);
    assert(new URL(afterPurchase.headers.get('location'), base).searchParams.get('mode') === 'signup', `${prefix}/account?payment=pending must open the post-purchase account flow`);

    for (const route of ['/learn', '/learn/welcome', '/learn/data-model', '/course-example']) {
      const html = await readPage(`${prefix}${route}`);
      assert(html.includes('account-layout'), `Missing paid access gate: ${prefix}${route}`);
      assert(!html.includes('project-challenge') && !html.includes('fl-chapter'), `Anonymous lesson content exposed: ${prefix}${route}`);
    }
    const login = await readPage(`${prefix}/login`);
    assert(login.includes('Forgot password') || login.includes('Не помню пароль'));
    assert(
      !login.includes('New here? Create an account') &&
        !login.includes('Впервые здесь? Создать аккаунт'),
      'regular sign-in must not expose open registration',
    );
  }

  for (const provider of ['gumroad', 'stripe']) {
    const checkout = await response('/api/checkout', {
      method: 'POST',
      headers: { Origin: allowedOrigin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    assert.equal(checkout.status, 503, `${provider} must stay unavailable without production configuration`);
  }

  const crossOrigin = await response('/api/account/auth', {
    method: 'POST',
    headers: { Origin: 'https://unrelated.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'signin' }),
  });
  assert.equal(crossOrigin.status, 403);
  const malformed = await response('/api/account/auth', {
    method: 'POST',
    headers: { Origin: allowedOrigin, 'Content-Type': 'application/json' },
    body: 'null',
  });
  assert.equal(malformed.status, 400);

  const chunks = listFiles('.next/static').filter((file) => file.endsWith('.js')).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const accountFormSource = fs.readFileSync('components/AccountForms.tsx', 'utf8');
  const ownerStudentsSource = fs.readFileSync('components/OwnerStudents.tsx', 'utf8');
  assert(
    !accountFormSource.includes('New here? Create an account') &&
      !accountFormSource.includes('Впервые здесь? Создать аккаунт'),
    'self-service signup toggle must be removed',
  );
  assert(
    ownerStudentsSource.includes('s.pending_registration &&') &&
      ownerStudentsSource.includes('Copy signup link for student') &&
      ownerStudentsSource.includes('Скопировать ссылку для ученика'),
    'admin must be able to share a reserved manual signup invite',
  );
  assert(chunks.includes('Create your account after purchase') || chunks.includes('Создайте аккаунт после покупки'));
  assert(accountFormSource.includes('G-lab emailed a verification code') || accountFormSource.includes('Код G-lab отправлен на почту'));
  assert(chunks.includes('[0-9]{6,10}'), 'OTP field must accept Supabase OTP lengths');
  for (const lesson of practicalLessons) {
    for (const chapter of lesson.chapters) {
      assert(!chunks.includes(chapter.explanation), `Paid explanation in public JS: ${lesson.slug}`);
    }
  }

  console.log('PASS: RU/EN account pages send ordinary visitors to sign-in and post-purchase visitors to signup; course routes are gated, unconfigured checkout is closed, CSRF and malformed-body protections hold, and paid lesson explanations are absent from public JavaScript.');
})().catch((error) => { console.error(error); process.exit(1); });
