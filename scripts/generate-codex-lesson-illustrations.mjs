import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Editable teaching diagrams, based on the supplied dark desktop UI reference.
// They use fictional course content and are labelled as diagrams in the lesson.
const output = new URL("../public/lesson-screens/", import.meta.url);
mkdirSync(output, { recursive: true });
const c = { bg: "#181818", panel: "#202123", input: "#2c2c2c", line: "#414244", text: "#f1f1f1", muted: "#b4b4b6", gold: "#c9a17c" };
const esc = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
const rect = (x, y, w, h, fill, radius = 0, stroke = "none") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
const text = (x, y, value, size = 20, fill = c.text, weight = 400) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}">${esc(value)}</text>`;
const path = (d, stroke = c.muted, width = 2) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const plus = (x, y) => path(`M${x - 8} ${y}h16M${x} ${y - 8}v16`);
const circle = (x, y, r, fill, stroke = "none") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
const send = (x, y) => circle(x, y, 20, c.text) + path(`M${x} ${y + 8}V${y - 8}m-7 7 7-7 7 7`, c.bg);
const folder = (x, y) => path(`M${x} ${y + 4}h9l4 4h13v16h-26zM${x + 1} ${y + 10}h24`);
const lines = (x, y, values, size = 20, fill = c.text, step = 29) => values.map((value, i) => text(x, y + i * step, value, size, fill)).join("");
const save = (id, locale, width, height, title, body) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title" xml:lang="${locale}"><title id="title">${esc(title)}</title><g font-family="Arial, Helvetica, sans-serif">${rect(0, 0, width, height, c.bg, 14)}${body}</g></svg>\n`;
  writeFileSync(fileURLToPath(new URL(`${id}-dark-${locale}.svg`, output)), svg);
};

for (const locale of ["en", "ru"]) {
  const ru = locale === "ru";
  const t = (en, russian) => ru ? russian : en;

  save("codex-prompt", locale, 900, 272, t("Codex message composer in dark mode — teaching diagram", "Тёмное поле ввода Codex — учебная схема"),
    rect(20, 24, 860, 202, c.input, 22, c.line)
    + text(44, 67, t("Ask for anything", "Попросите что угодно"), 20, c.muted)
    + lines(44, 111, [t("Create the first section of a photographer’s website.", "Создай первый экран сайта фотографа."), t("Add a button to discuss a photo session.", "Добавь кнопку «Обсудить съёмку»." )], 24, c.text, 34)
    + plus(54, 192) + text(620, 199, "Codex", 18, c.muted)
    + path("M689 190l5 5 5-5")
    + rect(749, 176, 10, 20, "none", 5, c.muted) + path("M745 189v3a9 9 0 0 0 18 0v-3M754 201v7")
    + send(830, 190)
    + text(28, 255, t("anna-first-site · Work locally", "anna-first-site · Локальный проект"), 16, c.muted)
  );

  save("codex-projects", locale, 480, 600, t("Codex project sidebar in dark mode — teaching diagram", "Тёмная панель проектов Codex — учебная схема"),
    rect(0, 0, 480, 600, c.panel, 14)
    + text(28, 50, "Codex", 27, c.text, 600) + path("M119 39l6 6 6-6")
    + plus(42, 104) + text(68, 111, t("New chat", "Новый чат"), 22)
    + text(28, 176, t("Recent", "Недавние"), 18, c.muted)
    + text(40, 221, t("Build the first page", "Создать первую страницу"), 21)
    + text(40, 266, t("Improve the main button", "Улучшить главную кнопку"), 21)
    + text(28, 335, t("Projects", "Проекты"), 18, c.muted)
    + folder(32, 367) + text(77, 389, "anna-first-site", 23, c.text, 500)
    + rect(28, 409, 424, 51, c.input, 10)
    + text(58, 442, t("Build a photography website", "Создать сайт фотографа"), 21)
    + folder(32, 492) + text(77, 514, t("Practice project", "Учебный проект"), 22)
    + text(28, 567, t("Open the folder for this website", "Выберите папку своего сайта"), 18, c.muted)
  );

  save("codex-environment", locale, 600, 374, t("Codex project actions in dark mode — teaching diagram", "Действия проекта Codex в тёмной теме — учебная схема"),
    rect(0, 0, 600, 66, c.panel, 14)
    + text(24, 41, "anna-first-site", 22, c.text, 500)
    + rect(388, 14, 62, 38, c.input, 8, c.line)
    + path("M403 25l11 8-11 8zM429 30l5 5 5-5")
    + rect(466, 14, 114, 38, c.input, 8, c.line)
    + text(483, 39, t("Open", "Открыть"), 18)
    + rect(180, 86, 394, 242, c.panel, 12, c.line)
    + text(200, 113, t("Project actions", "Действия проекта"), 16, c.muted)
    + rect(192, 123, 370, 49, c.input, 7)
    + path("M208 136l13 10-13 10z") + text(239, 153, "Run", 23)
    + path("M528 146l6 6 11-13", c.text)
    + path("M208 195l10-6 10 6v13l-10 6-10-6zM208 195l10 6 10-6M218 201v13")
    + text(239, 211, "Build", 23)
    + path("M194 241h364", c.line, 1)
    + plus(216, 278) + text(239, 285, t("Add action", "Добавить действие"), 22)
    + text(24, 359, t("Actions depend on the project’s configuration", "Действия зависят от настройки проекта"), 18, c.muted)
  );

  save("codex-browser", locale, 1120, 700, t("Codex conversation and website preview in dark mode — teaching diagram", "Переписка Codex и просмотр сайта в тёмной теме — учебная схема"),
    rect(0, 0, 1120, 52, c.panel, 14)
    + text(24, 34, t("Build a photography website", "Создать сайт фотографа"), 21, c.text, 600)
    + path("M522 52v648", c.line, 1)
    + rect(32, 88, 458, 118, c.input, 18)
    + lines(52, 122, [t("Create a website for Anna, a photographer.", "Создай сайт для фотографа Анны."), t("Add services, work and contact sections.", "Добавь услуги, работы и контакты."), t("Open it in the browser.", "Открой его в браузере.")], 21, c.text, 30)
    + text(32, 264, "Codex", 21, c.text, 600)
    + lines(32, 306, [t("The first page is ready to review.", "Первая страница готова к просмотру."), t("The preview is open on the right.", "Справа открыт просмотр сайта."), t("Click the main button to try it.", "Нажмите главную кнопку на сайте.")], 21, c.text, 33)
    + rect(32, 410, 458, 54, c.panel, 10, c.line)
    + text(49, 444, t("Preview: http://localhost:3000", "Просмотр: http://localhost:3000"), 20, c.muted)
    + rect(28, 523, 466, 139, c.input, 20, c.line)
    + text(49, 560, t("Ask for a change…", "Попросите внести изменение…"), 21, c.muted)
    + plus(54, 626) + text(291, 633, "Codex", 17, c.muted) + send(458, 626)
    + text(28, 687, "anna-first-site", 16, c.muted)
    + rect(523, 52, 597, 51, c.panel)
    + text(547, 85, t("Browser", "Браузер"), 19) + text(723, 85, "localhost:3000", 18, c.muted)
    + path("M1074 73l10 10m0-10-10 10")
    + rect(534, 114, 572, 570, "#171b19", 8)
    + text(560, 159, "ANNA / PHOTOGRAPHY", 17, c.gold, 600)
    + text(560, 219, t("Photographs that", "Снимки, в которых"), 32, c.text, 600)
    + text(560, 260, t("feel like you.", "вы — настоящие."), 32, c.text, 600)
    + lines(560, 302, [t("Portraits, stories and small moments.", "Портреты, истории и простые моменты."), t("A photo session at your own pace.", "Съёмка в вашем ритме.")], 20, c.muted, 29)
    + rect(560, 361, 276, 53, c.gold, 8)
    + text(579, 395, t("Discuss a photo session", "Обсудить съёмку"), 20, "#181818", 600)
    + text(560, 459, t("SELECTED WORK", "ИЗБРАННЫЕ РАБОТЫ"), 14, c.muted)
    + rect(560, 482, 245, 167, "#31302a", 6)
    + rect(825, 482, 253, 167, "#252e2b", 6)
    + circle(683, 538, 30, "#88735e") + path("M618 646v-10a65 58 0 0 1 130 0v10", "#88735e", 2)
    + circle(954, 535, 23, "#77867c") + path("M900 646v-18a54 52 0 0 1 108 0v18", "#77867c", 2)
  );
}
