const assert = require('node:assert/strict');
const base = process.env.COURSE_QA_URL || 'http://localhost:3014';
const checkoutExpectedEnabled = process.env.EXPECT_CHECKOUT_ENABLED === 'true';

async function page(path) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, `${path} should load`);
  return response.text();
}

(async () => {
  for (const [prefix, expected] of [
    ['', ['Build your website with Codex.', 'A live website with a private client area', 'Buy the course']],
    ['/ru', ['Создайте сайт вместе с Codex.', 'личным кабинетом для клиентов', 'Купить курс']],
  ]) {
    const home = await page(`${prefix}/`);
    const firstScreen = home.match(/<section class="studio-hero" id="top">[\s\S]*?<\/section>/)?.[0];
    assert(firstScreen, 'Homepage hero should exist');
    assert.equal((firstScreen.match(/class="studio-path studio-path-/g) || []).length, 2, 'Homepage first screen must offer exactly two paths');
    const coursePath = prefix ? '/ru/courses/build-with-codex' : '/courses/build-with-codex';
    assert(firstScreen.includes(`href="${coursePath}"`), 'Course card must lead to course overview and purchase');
    assert(firstScreen.includes('href="#contact"'), 'Website-service card must lead to project contact');
    const courseChoice = firstScreen.match(/<article class="studio-path studio-path-course">[\s\S]*?<\/article>/)?.[0];
    assert(courseChoice, 'Homepage should include its course choice card');
    assert(courseChoice.includes('studio-home-course-purchase') && courseChoice.includes('class="course-sales-buy"'), 'Course card must contain a direct checkout button on the first screen');
    assert(courseChoice.includes(prefix ? 'Купить курс' : 'Buy the course'), 'Course card must show its purchase action');
    assert(courseChoice.includes(prefix ? '16 УРОКОВ · ОПЛАТА ОДИН РАЗ' : '16 LESSONS · PAY ONCE') && courseChoice.includes('$49 USD'), 'Course card must show lesson scope, a one-time payment and its price');
    assert.equal((courseChoice.match(/\$49 USD/g) || []).length, 1, 'Homepage course choice should show the price only once');
    assert(courseChoice.includes(prefix ? 'Нужны компьютер с Windows или Mac и доступ к Codex в ChatGPT для компьютера' : 'Requires a Windows or Mac computer, the ChatGPT desktop app and Codex access'), 'Course card must disclose the app and device requirements before checkout');
    assert(courseChoice.includes(prefix ? 'Что входит в курс' : 'What’s included'), 'Course overview link should be beside the purchase button');
    const homeBuyButton = firstScreen.match(/<button[^>]*>([\s\S]*?)<\/button>/)?.[0];
    assert(homeBuyButton, 'Homepage must render the purchase button');
    assert(!homeBuyButton.includes('$49'), 'Price should appear once in the card, not be repeated on its button');
    assert.equal(/disabled=""/.test(homeBuyButton), !checkoutExpectedEnabled, 'Homepage purchase availability must match live configuration');
    assert(prefix
      ? firstScreen.includes('Изучить курс') && firstScreen.includes('Заказать сайт')
      : firstScreen.includes('Explore the course') && firstScreen.includes('Order a website'),
    'Homepage first screen must name both choices');

    const html = await page(`${prefix}/courses/build-with-codex`);
    const salesHero = html.match(/<section class="course-sales-hero">[\s\S]*?<\/section>/)?.[0];
    assert(salesHero, 'Course sales hero should exist');
    assert(salesHero.includes('course-sales-hero-purchase') && salesHero.includes('class="course-sales-buy"'), 'Purchase button and price must appear in the first course section');
    assert(salesHero.includes(prefix ? 'Codex работает в настольном приложении ChatGPT с локальной папкой проекта' : 'This course uses Codex in the ChatGPT desktop app with a local project folder'), 'Course page must explain the local desktop workflow before the purchase action');
    assert(salesHero.includes('help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan'), 'Course page should link to current official Codex setup information');
    assert(html.includes('<section class="course-sales-final">'), 'Course should repeat the purchase action after the overview');
    for (const text of expected) assert(html.includes(text), `Missing ${text} in ${prefix || 'English'} page`);
    assert.equal((html.match(/class="course-sales-buy"/g) || []).length, 2, 'There should be a purchase button at the top and after the overview');
    for (const buyRegion of html.match(/<div class="course-sales-buy">[\s\S]*?<\/div>/g) || []) {
      assert(!buyRegion.includes('$49'), 'Price should not be repeated inside a course purchase button');
    }
    assert(html.includes('$49'));
    assert(prefix ? html.includes('НДС или налог с продаж') : html.includes('VAT or sales tax'));
    assert(prefix
      ? html.includes('Упражнения с Supabase можно выполнять на Free — Pro покупать ради обучения не нужно')
      : html.includes('You can follow the Supabase exercises on its Free plan; Pro is optional for learning'));
    assert(prefix ? html.includes('Codex входит в тарифы ChatGPT в поддерживаемых регионах') : html.includes('Codex is included with ChatGPT plans where available'));
    assert(prefix ? html.includes('Vercel Hobby') : html.includes('personal, non-commercial'));
    assert(!/try the free lesson|free preview|first lesson for free|бесплатный урок|первый урок — бесплатно/i.test(html));
    assert(prefix
      ? ['Создайте сайт с Codex', 'Сохраняйте и восстанавливайте версии в GitHub', 'Публикуйте и улучшайте сайт с Vercel', 'Подключите аккаунты и данные через Supabase'].every((title) => html.includes(title))
      : ['Build with Codex', 'Save and recover with GitHub', 'Publish and improve with Vercel', 'Connect accounts and data with Supabase'].every((title) => html.includes(title)),
    'Course page must explain all four stages');
    assert(prefix ? html.includes('пошаговые письменные уроки') : html.includes('step-by-step written lessons'), 'Course format should be clear before purchase');
    assert.equal((html.match(/class="course-sales-module-lessons"/g) || []).length, 4, 'Each course stage should expose its four lesson titles on demand');
    const moduleSection = html.match(/<section class="course-sales-modules"[\s\S]*?<\/section>/)?.[0] || '';
    assert.equal((moduleSection.match(/<li>/g) || []).length, 16, 'The public syllabus should list all sixteen lessons');
    assert(prefix
      ? ['Создайте первый сайт с Codex', 'Загрузите готовый сайт в GitHub', 'Опубликуйте сайт из GitHub через Vercel', 'Опубликуйте и проверьте готовый сайт'].every((title) => html.includes(title))
      : ['Build your first website with Codex', 'Put your existing website on GitHub', 'Publish the website from GitHub with Vercel', 'Launch and verify the complete website'].every((title) => html.includes(title)),
    'Course overview should show real lesson titles in the selected language');
    assert.equal((html.match(/<div class="course-sales-faq-list">[\s\S]*?<\/div>/)?.[0].match(/<details>/g) || []).length, 6, 'Course page should answer six purchase questions');
    assert(prefix
      ? html.includes('Что важно знать до начала.') && html.includes('Как открыть курс после оплаты?') && html.includes('Проверит ли автор мой сайт лично?')
      : html.includes('Questions before you start.') && html.includes('How do I open the course after paying?') && html.includes('Can I get personal feedback on my website?'),
    'Purchase FAQ should be available in both languages');
    assert(/rel="alternate"[^>]+hrefLang="en"/.test(html) && /rel="alternate"[^>]+hrefLang="ru"/.test(html), 'Course page should publish localized alternate URLs');
    assert(html.includes('summary_large_image'), 'Course page should provide a large social share card');
    assert(prefix
      ? html.includes('Онлайн-запись, приём оплаты и уведомления по почте — отдельные функции')
      : html.includes('Online booking, payment processing and email notifications are separate features'),
    'Course scope must distinguish saved requests from booking, payments and email automation');
    const buyRegion = html.match(/<div class="course-sales-buy">[\s\S]*?<\/div>/)?.[0];
    assert(buyRegion, 'Purchase button should be present');
    assert.equal(
      /<button[^>]*disabled=""/.test(buyRegion),
      !checkoutExpectedEnabled,
      checkoutExpectedEnabled
        ? 'Configured production checkout should be enabled'
        : 'Checkout should stay closed without production configuration',
    );
  }

  for (const [path, disclosure] of [
    ['/course-checkout', 'Codex is included with ChatGPT plans where available; usage limits vary. Other services may require separate accounts or paid plans.'],
    ['/ru/course-checkout', 'Codex включён в тарифы ChatGPT в поддерживаемых регионах; лимиты зависят от плана и задачи. Для других сервисов могут понадобиться отдельные аккаунты или платные тарифы'],
  ]) {
    const html = await page(path);
    assert(html.includes(disclosure), `Missing third-party cost note in ${path}`);
    assert(path.startsWith('/ru')
      ? html.includes('Курс использует Codex в настольном приложении ChatGPT и локальную папку проекта')
      : html.includes('The course uses Codex in the ChatGPT desktop app with a local project folder'),
    `Missing device requirement disclosure in ${path}`);
  }

  console.log(`PASS: RU/EN home, course and checkout pages show direct $49 purchase, disclose taxes and third-party costs, omit free-trial copy, and checkout is ${checkoutExpectedEnabled ? 'enabled' : 'closed'} as configured.`);
})().catch((error) => { console.error(error); process.exit(1); });
