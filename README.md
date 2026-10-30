> **Витрина кода.** Это публичная копия рабочего проекта [g-lab.agency](https://g-lab.agency). Тексты уроков платного курса, видео и скриншоты уроков в неё не входят, поэтому проект в таком виде не собирается. Здесь можно посмотреть устройство кода: Next.js App Router, Supabase (Auth, RLS, миграции), оплата через Gumroad с вебхуками, админка заявок, QA-скрипты на Playwright.

# G-lab — Build and launch your first website

G-lab is an English and Russian, text-first course for people building a first website with Codex, GitHub, Vercel and Supabase. The course teaches learners to describe the result they want, use the tools, review changes and verify the finished site. No prior coding experience is required. The site also presents website development services.

## Run locally

```bash
npm ci
npm run dev -- --port 3014
```

The default local origin is `http://localhost:3014`, matching the authentication callback examples in the setup guide.

## Validate the build

```bash
npm run typecheck
npm run build
```

Before running Next.js, the build checks installed dependency versions and flags obsolete locale route files.

## Course

- 16 lessons arranged as four modules. Existing lesson URLs are preserved.
- Lesson 1 includes a brief builder. Lessons 2–16 use the practical lesson renderer and cover Codex, GitHub, Vercel and Supabase.
- Each lesson has guided actions, expected results, troubleshooting, an independent project challenge, interactive practice and a three-question knowledge check.
- All 16 lessons include project-note prompts and 88 practical confirmations in total. Learners can save notes and answers in their account, export readable TXT notes, and restore current or earlier JSON backups after reviewing a preview. Completion is learner self-assessment; it does not inspect external projects or certify a finished website.
- All 16 lessons require confirmed course access; there is no free lesson or public lesson preview.
- The course is written-first. Videos are not required.

Course structure and editorial goals are in [course direction](docs/course-direction.md). A real beginner usability session for the first four lessons is still pending; see [the review guide](docs/beginner-course-review.md).

## Languages and visual references

English routes use their original paths; Russian routes are under `/ru`. The language switch keeps the current lesson and chapter. Learner-facing Russian course text is maintained separately from the English source.

All lessons include chapter-specific visual references in `public/lesson-screens`. Their sources and labels are recorded beside the images. Interface screenshots are illustrations from public documentation, not screenshots of a learner's account; the Supabase data model is a diagram.

## Account and course access

Supabase email/password authentication powers sign-in, password recovery, course enrollment, purchase history and progress sync. New accounts can be created only after a confirmed Gumroad purchase or a manual invitation from the owner. Paid lesson content is checked on the server before it is returned. Repository visibility and access to the published course are separate; source history is not a DRM mechanism. Production authentication limits and the required Supabase IP-forwarding setup are documented in [docs/auth-rate-limit-rollout.md](docs/auth-rate-limit-rollout.md).

Account registration links the public `/privacy` notice and `/terms` course terms; Russian versions are available under `/ru/privacy` and `/ru/terms`. The notice describes browser storage, Supabase account data, course feedback and Gumroad sale records.

## International course payments

The only checkout provider enabled in the code is Gumroad, for the digital course. The course price is **$49 USD** before any applicable checkout tax. G-lab opens Gumroad's hosted checkout, verifies the purchase through the Gumroad API, and updates course access after a confirmed sale or refund. Gumroad Pings are persisted in a private Supabase queue; a daily Vercel Cron retries queued events.

Production checkout is enabled. The course page opens the configured Gumroad product at $49 USD; Gumroad's test Ping returned HTTP 200, and a manual production Cron run returned HTTP 200. The owner checkout identifies purchases as tests and does not charge the creator, so these checks do not prove a real sale, Gumroad API token validity for sale reconciliation, automatic enrollment after an independent purchase, or a payout. Do not buy the product from the creator account. See the [payment setup guide](docs/account-payment-setup.md) and [payment routing review](docs/payment-routing.md) for the verified scope and remaining live-sale check.

PayPal Connect may add PayPal inside the Gumroad checkout if Gumroad accepts the seller's actual Vietnam profile and existing Kazakhstan PayPal account. Card, wallet and PayPal options vary by buyer region. The site does not accept payment for website-service enquiries through the course checkout.

## Public examples

The course includes public-page study tasks for [by-alinkins.com](https://by-alinkins.com/), [by-alinkins.space](https://by-alinkins.space/) and [the G-lab site](https://g-lab.agency/). These exercises do not claim verified private checkout or account behavior. Details are maintained in `lib/site-examples.ts`.

## Production site

[g-lab.agency](https://g-lab.agency)
