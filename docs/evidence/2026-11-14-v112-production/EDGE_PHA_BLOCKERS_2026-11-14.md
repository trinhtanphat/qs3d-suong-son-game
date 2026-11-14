# Audit chặn QA Edge và cảnh báo PCIe trên PHA — 14/11/2026

## Trạng thái hiện tại

- Production Guizang v1.1.2 vẫn hoạt động (HTTP 200), bản phát hành và GitHub main `8490b8358e0abe658cc74902d219f952f74ae922`.
- Bộ kiểm thử Chrome đã nghiệm thu: **34/34 PASS**, HTTP kiểm thử lại trên release: **17/17 PASS**, logic VM bổ sung: **13/13 PASS**.
- **Edge chưa được nghiệm thu**: Playwright Edge thoát khi khởi tạo, `exitCode=1002`. Hai phép thử cấu hình mới (channel `msedge` mặc định và headless/no-GPU) đều thất bại trước khi bắt đầu các assertion; xem `edge-launch-system-diagnostics.json`.
- Kiểm tra Windows cho thấy Private Commander trên WIN11-181 đang chạy bằng tài khoản `NT AUTHORITY\SYSTEM`, thuộc nhóm quản trị. Điều này là **nghi vấn nguyên nhân môi trường**, không phải xác nhận chính thức rằng exit code 1002 luôn có nghĩa là bị chính sách tài khoản SYSTEM từ chối.
- `edge-qa-non-system.cjs` là runner tái lập an toàn, kiểm tra danh tính trước khi khởi chạy Edge; nếu là SYSTEM thì lưu `edge-qa-non-system-result.json` với trạng thái `SKIPPED_SYSTEM_CONTEXT`, hoàn toàn không khởi chạy browser.

## Bằng chứng phần cứng DESKTOP-PHA1S90

Snapshot đọc trực tiếp từ Windows System log: `pha-whea-readonly-snapshot.json`.

- Boot ghi nhận: `2026-11-14T20:10:53.5000000+07:00`.
- Snapshot lúc `2026-11-14T20:31:40.9567676+07:00`: **82 WHEA-Logger ID 17 trong 15 phút trước đó**, có cảnh báo mới nhất lúc `20:31:37+07:00`.
- Điểm phát hiện: Intel PCI Express Root Port #6, `PCI\VEN_8086&DEV_9D15`, `0&E5`. Thiết bị downstream liên quan: Qualcomm QCA9377 Wi-Fi, `PCI\VEN_168C&DEV_0042`, `0&00E5`.
- Windows PnP báo cả hai thiết bị `Status=OK`; điều đó chỉ nói máy đang nhận diện được thiết bị, **không loại trừ lỗi vật lý, driver hoặc đường PCIe**.
- System log còn có các bản ghi Kernel-Power 41 và EventLog 6008 trong giai đoạn được xem, phù hợp với việc máy trước đó bị tắt/khởi động lại bất thường; **chưa đủ dữ kiện quy kết nguyên nhân cụ thể**.

**Biện pháp bảo toàn:** Không reboot/reset Wi-Fi, không disable device, không cập nhật driver/BIOS, không chạy GPU/Chrome QA trên PHA, không đổi tunnel/production.

## Cách tiếp tục Edge QA an toàn

Chỉ thực hiện từ một tài khoản QA Windows **không elevated**, trong phiên riêng, không lấy Session 2 hoặc profile Edge đang mở:

1. Cài/chuẩn bị Node.js và `playwright-core` trong thư mục QA riêng (không dùng GitHub Actions).
2. Tạo `QA_OUT_DIR` có thể ghi và đặt `NODE_PATH` trỏ tới thư mục `node_modules` chứa `playwright-core`, hoặc cài dependency trong thư mục cùng script.
3. Chạy `node edge-qa-non-system.cjs`. Script dùng `channel: 'msedge'`, headless và trang QS3D, thay iframe gốc bằng stub chỉ trong ngữ cảnh kiểm thử.
4. Chỉ ghi **PASS** khi báo cáo trả `status: PASS` và toàn bộ assertion đạt. `SKIPPED_SYSTEM_CONTEXT` hoặc `FAILED` không được đổi tên thành PASS.
5. Nếu Edge tiếp tục không khởi chạy, đọc Event Viewer Application errors, kiểm tra chính sách Edge và thử profile tạm độc lập; **không xóa hoặc đóng profile đang dùng**.

Các tham khảo:
- [Playwright – branded browsers and enterprise policies](https://playwright.dev/docs/browsers)
- [Microsoft Learn – Edge cannot start, diagnostic and temporary profile](https://learn.microsoft.com/en-us/troubleshoot/microsoft-edge/performance/edge-crashes-fails-to-launch)

## Cách tiếp tục phần cứng PHA an toàn

- Ưu tiên lưu bản sao dữ liệu QA và kiểm tra hạ tầng kết nối dự phòng trước khi thao tác thiết bị PCIe.
- Với kỹ thuật viên tại máy: kiểm tra trạng thái phần cứng, cáp/khe hoặc module WLAN, thermal, nguồn và driver đã được nhà sản xuất công bố; thử nghiệm theo quy trình có thể rollback và có người giám sát.
- Sau khi phần cứng ổn định, thu thập lại EventLog trước–sau và chỉ chạy GPU QA khi máy không còn có cảnh báo WHEA liên tục.
- Không dùng PHA như đường thử duy nhất; Chrome 34/34 đã chạy trên WIN11-181.

## Kết luận phạm vi

**Không có thay đổi runtime**; 34/34 Chrome QA, 17/17 HTTP và 13/13 VM logic trước đó vẫn hợp lệ trong phạm vi ghi rõ. Hai điều kiện chưa thể coi là 100%: Edge chạy trên môi trường người dùng bình thường và kiểm tra/sửa nguyên nhân cảnh báo phần cứng PHA. Báo cáo này lưu bằng chứng, không tự nhận đã xử lý hai vấn đề đó.


## Tracking actions

- [Issue #1 — Edge QA under a dedicated non-SYSTEM account](https://github.com/trinhtanphat/qs3d-suong-son-game/issues/1): Edge currently unverified because launch attempts exit 1002 under SYSTEM. Reproduce with `edge-qa-non-system.cjs` without touching active sessions.
- [Issue #2 — PHA PCIe/WHEA hardware blocker](https://github.com/trinhtanphat/qs3d-suong-son-game/issues/2): repeated WHEA ID 17 on Intel Root Port #6 / Qualcomm QCA9377. Requires onsite investigation and observed stabilization before PHA GPU QA.


## Edge issue #1 resolution — later update, 14/11/2026

**Edge browser QA is now passing.** Using a user-accessible Node executable from `C:\Program Files\nodejs` and a dedicated temporary scheduled task with principal `Admin`, logon `Interactive`, run level `Limited`, the Edge headless viewer checks passed **8/8 smoke and 34/34 full tests**. The earlier failure under SYSTEM is no longer a blocker for scoped Edge QA. Machine-produced evidence and setup details are preserved in `EDGE_ADMIN_QA_ACCEPTANCE_2026-11-14.md`.

**Only the PHA PCIe WHEA hardware issue remains open**. No Wi-Fi/driver/BIOS/device reset was performed.


## PHA read-only readiness collector

`pha-whea-readonly-collector.ps1` and `PHA_READONLY_RECOVERY_RUNBOOK_2026-11-14.md` provide a safe method to collect Intel PCIe Root Port #6 / Qualcomm QCA9377 WHEA evidence when PHA reconnects. Only tested on WIN11-181 for script execution correctness; no PHA hardware health is inferred. This is an **unresolved** issue #2 and must remain open until hardware has been stabilized and independently checked.
