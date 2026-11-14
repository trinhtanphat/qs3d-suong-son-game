# QS3D Guizang Portal — final deployment acceptance 2026-11-14

## Deployment identity
- Repository: https://github.com/trinhtanphat/qs3d-suong-son-game
- Production GitHub main and released source commit: 0658ac2e18a0ebae2273bc852a2bad172c0aad86
- Annotated Git tag: v1.1.0-guizang-20261114
- Previous commit: ace51516693550a21f74922ff73f0c5d1ca3e119
- Immutable release folder: C:\QS3D\GuizangReleases\suongson-0658ac2e18
- Dedicated launcher: C:\QS3D\GuizangPortal\server.cjs
- Rollback launcher snapshot: C:\QS3D\GuizangPortal\server.cjs.before-controls-20261114
- Switched only task QS3D-GuizangPortal-Server181; dedicated tunnel QS3D-GuizangPortal-Tunnel181 was left running.

## User-visible improvements
- Focus mode (reversible), fullscreen toggle (browser-permission dependent), reload original game frame, contextual help.
- Slow-load feedback and original-game direct-link fallback; corrected a fast iframe load race.
- Accessibility: skip link, keyboard focus visibility, aria states, mobile responsive buttons, prefers-reduced-motion.
- /healthz method enforcement: POST is rejected; HEAD is bodyless.

## Fresh test evidence
| Scope | Result | Evidence |
| --- | ---: | --- |
| 15 HTTP/security tests on immutable release | 15/15 PASS | docs/evidence/2026-11-14-upgrade/http-tests.txt on GitHub |
| 17 controls tests on PUBLIC production | 17/17 PASS | QA-20261114/production-controls.json |
| 40 Sương Sơn regression tests on PUBLIC production | 40/40 PASS | QA-20261114/production-regression.json and desktop/mobile screenshots |
| 12 original game browser tests on PUBLIC production | 12/12 PASS | QA-20261114/production-official.json |
| Total scoped checks | 84/84 PASS | Combined test suite results |
- Completed browser suites returned exit code 0, zero JavaScript exceptions and zero HTTP asset failures in the measured scopes.
- Production QA evidence folder: C:\QS3D\GuizangPortal\QA-20261114
- SHA256 hashes of production QA evidence: QA-20261114/sha256-manifest.csv.
- Original game frame was tested with real author-hosted content and actual mouse start; controls QA additionally uses a fake iframe only for deterministic testing of controls.

## Live production integrity
- https://guizang.qs3d.site/ HTTP 200, upgraded interface present.
- https://guizang.qs3d.site/official-controls.js HTTP 200.
- https://guizang.qs3d.site/suong-son HTTP 200.
- https://nongtrai.qs3d.site/ and https://painted-valley.qs3d.site/ HTTP 200 after deployment.
- 8/8 public runtime assets compared successfully against immutable release: six static resources byte-for-byte SHA256, two HTML pages semantically/byte-equivalent after stripping the exact Cloudflare analytics beacon injected at delivery.
- /healthz HTTP 200 and server + tunnel scheduled tasks Running.
- Temporary dedicated staging server PID 39240, identified by 5412 listener and command, was stopped after successful production QA. No unrelated Chrome tabs or tunnels were operated on intentionally.

## Failure transparency
- Some standalone headless Chrome QA attempts crashed or encountered temporary staging process expiry. Isolated CDP browser contexts passed all post-release browser suites.
- Browser and 3D test results are scoped to the enumerated checks, not proof of 100% compatibility on every GPU/browser or guaranteed future availability of the author host.
- Upstream original game assets (art, meshes, audio, writing) are copyright-protected. The QS3D site embeds the author's official host rather than republishing the original game's bundles.

## Rollback (only for an incident)
1. Restore C:\QS3D\GuizangPortal\server.cjs.before-controls-20261114 over C:\QS3D\GuizangPortal\server.cjs.
2. Restart ONLY scheduled task QS3D-GuizangPortal-Server181; do not touch the tunnel or other QS3D services.
3. Verify / HTTP 200, /suong-son HTTP 200 and the previous release reactivated.
