# Sương Sơn · Đấu Trường Kiếm Khách (QS3D)

Original, playable WebGL2 3D action-game demo created for QS3D. **Not a rehost or copy of the copyrighted 雾锁山门 game**.

## Play

- Production: https://guizang.qs3d.site/
- Reference game by Guizang: https://op7418.github.io/guizang-game-skill/
- Full historical fork of the skill and the unpublished demo assets: https://github.com/trinhtanphat/guizang-game-skill

This repository contains independently written mechanics and procedural geometry. It does not import the other game's art, models, music, voice, scripts, or writing.

## Controls

| Control | Action |
| --- | --- |
| W/A/S/D or arrow keys | Walk |
| Left click / J | Sword three-hit combo |
| Hold right click / K | Block |
| Space | Dodge |
| Q | Sword energy |
| F | Heal when injured |
| E | Ultimate |
| Touch buttons | All above actions on mobile |

Fight through 3 waves (3 enemies, 5 enemies, boss), manage health, stamina and mana, then win or retry.

## Run offline / host

Requires Node.js 18+ (no npm install required).

~~~powershell
node server.cjs
~~~

Browse to http://127.0.0.1:5400/. The vendored Three.js module is included, so the graphics work without a CDN; optional external fonts fall back to system fonts.

Run tests with: node --test tests/*.test.cjs

## License and attribution

- All new original game source and procedural artwork in this repository: MIT License, see LICENSE.
- Vendor three.js JavaScript module: MIT License, see THIRD_PARTY_NOTICES.md.
- This project does not grant rights to reproduce the original Guizang game's creative assets.
- The original developer's main skill docs/scripts are AGPL-3.0; upstream gh-pages game creative content is ©2026 Guizang, all rights reserved. They are preserved in a separate Git mirror, not distributed by this site.

## Deploy

On WIN11-181 the standalone staging server runs on port 5400. The dedicated tunnel for guizang.qs3d.site connects to the portal server on port 5398. No unrelated tunnel or production site needs changes.

## QA log

2026-11-13: WebGL2 Chromium Desktop + mobile 13/13 QA PASS. Screenshots and report are in local workspace C:\QS3D-QA\guizang\.
