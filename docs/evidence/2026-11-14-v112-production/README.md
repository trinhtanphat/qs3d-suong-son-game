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

## Screenshot retention — 3/3 transferred and SHA-256 verified

All three original production PNG screenshots were transferred from DESKTOP-PHA1S90 to WIN11-181 and validated against the source byte length and SHA-256. The complete images are now archived alongside the raw JSON test reports and D3D11 runners in this audit branch.

| Screenshot | Size (bytes) | Original SHA-256 | Verification |
| --- | ---: | --- | --- |
| `pha-controls-mobile.png` | 15,066 | `43F5B567F537D7B0DC110E02E6B5228434A4C12D03E9512DFDDE32CFC5F3868E` | PASS |
| `pha-regression-desktop-d3d11.png` | 219,979 | `8DB5187F490D2CA0ABE1125EE263459870E3AD93D6D66C0BCA48229CAEE5FB4D` | PASS |
| `pha-regression-mobile-d3d11.png` | 75,261 | `7F7DF8AF528A758B59251CE4E862BAFC9A97BD7B725DEAF3FBA891976473FE9B` | PASS |

The original PHA files remain at `C:\Temp\Guizang-QA-v112-20261114` in `production-controls` and `production-regression-d3d11`. The previous interrupted 108,000-byte desktop partial was never treated as evidence; the successful full transfer was independently decoded and hash-checked. See `screenshot-delivery-status.csv` for the completed three-file manifest.

The upstream author's own media are not mirrored. Staging screenshots and the complete three-wave Sương Sơn playthrough are separately preserved in `docs/evidence/2026-11-14-v112` on main.

## Scope

98/98 defined checks passing means the tested scenarios passed; it is not a certification of every GPU, browser, device or uptime of the external author-hosted game. Production application binaries were not modified by this evidence-only update.

## Post-release VM regression — 14 November 2026

The published `official-controls.js` behavior was exercised in a deterministic Node VM harness: **13/13 PASS** (`controls-vm-regression.test.cjs`, `controls-vm-qa.txt`). This is not a real Chromium test.

The source file from the audit Git worktree and the immutable release differ **only in CRLF versus LF line endings**, which changes raw SHA-256. After line-ending normalization their content is identical; the immutable release file is unchanged.

The planned real-browser expansion on WIN11-181 did not start because Playwright's CDP handshake returned `ECONNRESET` (see `extended-browser-attempt-win181.json`, 0/0 tests). PHA could not be contacted reliably for the expansion. Neither attempt is reported as PASS. Existing 98/98 production suite results remain scoped to the earlier acceptance.

## Browser verification follow-up (14/11/2026 evening)

After the earlier unsuccessful debugger-based attempt, isolated **headless Chrome on WIN11-181 passed 34/34 extended browser assertions**, covering keyboard reload cancellation, network offline emulation, no silent iframe reload, transient status and 320–1440 px responsive checks. Original runner and JSON: `extended-browser-chrome181.cjs` and `extended-browser-chrome181.json`. Full method, SHA-256 and limitations: `EXTENDED_BROWSER_QA_2026-11-14.md`.

**Edge is NOT certified:** standalone Edge exited at startup with code 1002 (0 assertions). Raw attempt: `extended-browser-edge181.cjs` / `extended-browser-edge181.json`. Prior CDP failure evidence remains as chronological history. PHA was deliberately avoided because it had recently rebooted and WHEA events were observed. Production was unchanged.


## Outstanding QA infrastructure (read-only investigation)

As of 14 Nov evening, two additional independent `msedge` launches exited 1002 under the Private Commander `NT AUTHORITY\\SYSTEM` principal (0 tests); the new `edge-qa-non-system.cjs` guard safely skips browser launch in that context. A normal-user independent QA run is required before certifying Edge.

The PHA System log continues to report WHEA 17 on Intel PCIe Root Port #6 / Qualcomm QCA9377; the observed 15-minute count at the 20:31:40+07:00 snapshot was 82. `pha-whea-readonly-snapshot.json` preserves the raw status. No reboot or device/driver changes were performed.

See `EDGE_PHA_BLOCKERS_2026-11-14.md` for evidence and next steps. Existing 98/98 original, 34/34 Chrome extended, 17/17 HTTP rerun and 13/13 VM results remain unchanged and scoped.
