# ALTWEB FACTORY

Интерактивное портфолио Altweb Design: Vite, TypeScript и Phaser.

## Происхождение

Восстановлено из последнего доступного снимка приложения Vercel `dpl_HKYyaQ1DELqGj5Ju4YaWCbrCiNuq` от ноября 2026 года. Все 121 исходный файл сверены с SHA1-манифестом Vercel (`docs/recovery-manifest.json`). Исходного GitHub-репозитория не было. Основной домен: https://altweb-factory.vercel.app/ .

В снимке отсутствовали файлы `tests/*` и `scripts/*`, на которые ссылался package.json. Эти исторические проверки не считаются восстановленными.

## Разработка

Node.js 24; `npm ci`, `npm run dev`. Проверка типов: `npm run typecheck`. Production-сборка: `npm run build`.

## SEO/GEO и проверки

`npm run build` также генерирует `/services`, `/portfolio`, `/about`, `/contact`, `/faq`, читаемый раздел главной, sitemap и 404. Они доступны без JavaScript. `npm run preview` запускает полный статический результат на порту 4174. `npm run dev` предназначен для игровой части; полные SEO-страницы проверяйте после сборки.

`npm test` проверяет SEO без JavaScript, все комнаты и игры на desktop/mobile, портфолио и заявку. Нужен установленный Playwright Chromium (`npx playwright install chromium`) либо `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Содержание и метаданные: `src/content/site.ts`; услуги: `src/content/commerce.ts`; проекты и доступность ссылок: `src/content/projects.ts`. Существующая политика обучающих роботов сохранена. Сторонняя аналитика и коды верификации без данных владельца не включены.

Подробности, ограничения измерений и действия владельца: [docs/SEO-GEO.md](docs/SEO-GEO.md).
