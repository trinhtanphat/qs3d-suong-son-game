# QS3D Guizang viewer upgrade — audit and acceptance — 2026-11-14

## Scope
- This release improves ONLY the QS3D viewer and its independent Sương Sơn game HTTP server. It never republishes original copyrighted game assets.
- Original author-hosted game: https://op7418.github.io/guizang-game-skill/
- User entry: https://guizang.qs3d.site/ ; separate independently developed game: /suong-son.

## Features shipped
1. Focus mode hides supplemental content to increase iframe play area; reversible aria-pressed control.
2. Browser fullscreen toggle with graceful unsupported/blocked fallback.
3. Explicit original iframe reload, with warning that unsaved game progress can be lost.
4. Contextual help and always-visible direct link to the original author page.
5. Non-blocking load status, 18-second slow-load fallback, and early-load race handling.
6. Improved keyboard focus states, skip link, responsive mobile layout, reduced motion preference.
7. Health endpoint now rejects unsafe methods and returns correct HEAD response; allowlisted local JS with no-cache.

## Fresh QA on WIN11-181 (local runner; GitHub Actions not used)
| Suite | Checks | Result | Evidence |
| --- | ---: | --- | --- |
| HTTP routes, CSP and method security | 15/15 | PASS, exit 0 | docs/evidence/2026-11-14-upgrade/http-tests.txt |
| New viewer controls (cross-origin iframe stub only) | 17/17 | PASS, exit 0 | docs/evidence/2026-11-14-upgrade/controls-qa.json, controls-mobile.png |
| Sương Sơn browser regression (real game) | 40/40 | PASS, exit 0 | docs/evidence/2026-11-14-upgrade/regression.json, regression desktop/mobile screenshots |
| Original author-hosted game via staged QS3D wrapper (real assets loaded) | 12/12 | PASS, exit 0, zero JS/page errors and failed requests | docs/evidence/2026-11-14-upgrade/official-iframe-qa.json |
| **Total** | **84/84** | **PASS in tested scope** | |

## Environment and failure disclosure
- The first viewer controls run on an existing CDP browser was interrupted by a browser context closure. A dedicated isolated headless run passed 17/17.
- Initial controls browser run exposed a load-notification race; fixed by also listening to the top-level load event. Subsequent run passed.
- Initial real-original browser runs encountered transient staging server stop and/or an isolated headless Chrome crash under high memory pressure. Both are environment failures before completing checks.
- A detached, isolated staging server on 127.0.0.1:5412 and the separate CDP browser context successfully completed real-original 12/12.
- These failures are preserved in QA diagnostics, but the successful retry is the acceptance gate. No user Session 2 tabs or unrelated production tunnels were intentionally changed.

## Release safety
- Keep historical production immutable release and launcher backup for rollback.
- Deploy only the dedicated QS3D-GuizangPortal-Server181 task after preflight; do not restart its tunnel or unrelated applications.
- Post-release live HTTP/browser checks and SHA-256 equality against release bytes are required.

## Rights and interpretation
- The original author reserves rights to the gh-pages game's original art, models, audio, writing, and creative content. This QS3D wrapper loads the live author-hosted game directly in the user's browser and includes author credit.
- 84/84 PASS describes defined tests; it is not universal 100% coverage of browsers, operating systems, or future uptime.
