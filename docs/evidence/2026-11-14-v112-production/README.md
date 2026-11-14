# Raw production QA on DESKTOP-PHA1S90 — v1.1.2

## Provenance and integrity

These artifacts were generated on DESKTOP-PHA1S90 using Google Chrome and the released QS3D domain (not a local staging domain). The three **unmodified raw JSON reports** were copied to WIN11-181 by transmitting GZIP-compressed bytes, then decompressed and verified by both SHA-256 and exact byte count. The originating files remain on the PHA device.

- `pha-controls.json`: **29/29 PASS**, isolated Chrome, unmodified `qa/portal-controls.cjs` from commit `8490b8358e0abe658cc74902d219f952f74ae922`.
- `pha-regression-d3d11.json`: **40/40 PASS**, independent Sương Sơn production URL, using `pha-regression-d3d11-runner.cjs`.
- `pha-official-d3d11.json`: **12/12 PASS**, real author-hosted original embedded through the production QS3D viewer, using `pha-official-d3d11-runner.cjs`.
- `pha-qa-summary.json`: earlier compact report with source paths, suite counts, timestamp, SHA-256 and GPU details.
- `raw-sha256-manifest.csv`: receiving machine's SHA-256 and sizes for all raw JSON reports and runner scripts.

## Reproduce on the Intel GPU machine

The PHA device has Intel UHD Graphics 620, driver 31.0.101.2141. In an isolated QA directory with Node.js and Playwright Core 1.65.0, use an installed Chrome binary:

```powershell
npm install --no-save --no-package-lock --ignore-scripts playwright-core@1.65.0
$env:QA_CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:GAME_URL='https://guizang.qs3d.site/suong-son'
$env:QA_OUT_DIR='C:\Temp\Guizang-QA-v112-20261114\production-regression-d3d11'
node .\pha-regression-d3d11-runner.cjs

$env:VIEWER_URL='https://guizang.qs3d.site/'
$env:QA_OUT_DIR='C:\Temp\Guizang-QA-v112-20261114\production-official-d3d11'
node .\pha-official-d3d11-runner.cjs
```

The two runner copies are archived in this directory and need `playwright-core` resolvable from the script location, for example by setting `NODE_PATH` to the isolated QA node_modules path. The commands above assume the runners have been copied alongside a resolvable dependency. **Do not run GitHub Actions** for these QA cases.

## Exact differences from source runners

Compared with `qa/regression.cjs` in release commit `8490b8358e`, the PHA regression runner changes only the Chrome ANGLE flag from `swiftshader` to `d3d11`, adds a 4-second initial WebGL shader warmup, extends W-key hold from 900 to 2200 ms, D-key hold from 650 to 1700 ms, and mobile directional hold from 1100 to 2000 ms. **All movement thresholds and expected gameplay outcomes remain unchanged.** The separate original iframe runner only changes ANGLE from `swiftshader` to `d3d11`.

The initial SwiftShader regression failed its W-key movement threshold (0.285 displacement with 900 ms; 0.855 with longer hold), so it is **not** recorded as a pass. The above Direct3D11 hardware run passed 40/40. This evidence does not certify all GPUs or frame rates.

## Screenshot retention

The full native Chrome screenshots remain on the original PHA QA machine (not included in this GitHub audit directory):

- `production-controls\controls-mobile.png`: 15,066 bytes, SHA-256 `43F5B567F537D7B0DC110E02E6B5228434A4C12D03E9512DFDDE32CFC5F3868E`.
- `production-regression-d3d11\regression-desktop.png`: 219,979 bytes, SHA-256 `8DB5187F490D2CA0ABE1125EE263459870E3AD93D6D66C0BCA48229CAEE5FB4D`.
- `production-regression-d3d11\regression-mobile-360.png`: 75,261 bytes, SHA-256 `7F7DF8AF528A758B59251CE4E862BAFC9A97BD7B725DEAF3FBA891976473FE9B`.

Staging screenshots and full three-wave playthrough artifacts are already preserved in `docs/evidence/2026-11-14-v112` on main. No original author's copyrighted game media was mirrored.

## Scope

Passing 98/98 defined checks does not mean universal 100% coverage or a guarantee of upstream author-host availability. Production server and release code were not changed while transferring these audit records.
