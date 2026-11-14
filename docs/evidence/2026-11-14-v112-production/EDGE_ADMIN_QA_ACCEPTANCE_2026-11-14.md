# Edge QA — nghiệm thu đầy đủ dưới Admin quyền hạn chế (14/11/2026)

## Kết luận

**Issue #1 đủ điều kiện hoàn tất trong phạm vi Edge headless và viewer QS3D.** Mình đã khởi động Edge độc lập thành công, không sử dụng tài khoản SYSTEM, và chạy được cả hai bộ kiểm thử:

| Bộ kiểm thử | Kết quả | Máy/tài khoản |
|---|---|---|
| Edge smoke — 8 trường hợp | **8/8 PASS** | WIN11-181, `DESKTOP-B8SN1EF\Admin` |
| Edge responsive/network/keyboard — 34 trường hợp | **34/34 PASS** | WIN11-181, `DESKTOP-B8SN1EF\Admin` |
| JavaScript page exceptions | **0** | Edge headless |
| Windows Task Scheduler action | **LastTaskResult = 0** | `Admin`, `Interactive`, `Limited` |

### Nguyên nhân trở ngại cũ

Private Commander chạy dưới `NT AUTHORITY\SYSTEM`; thư mục Node riêng của dịch vụ `C:\ProgramData\PrivateCommander\win181\node` chỉ cấp quyền cho SYSTEM/Administrators. Chạy Node trực tiếp từ đó qua tác vụ `Admin / Limited` trả Access denied `0x80070005`, đã xác minh trong Task Scheduler. Sau khi chuyển sang Node dành cho người dùng thông thường tại `C:\Program Files\nodejs\node.exe`, lịch tác vụ chạy được. Không sửa ACL của Private Commander.

Trước đó, Playwright mở Edge dưới SYSTEM đã exit code 1002; đây là **sự kiện ở ngữ cảnh cũ**, không còn là trở ngại khi dùng ngữ cảnh QA mới. Việc chuyển ngữ cảnh cho phép QA Edge chạy thành công; không khẳng định đây là nguyên nhân duy nhất của exit 1002.

### Môi trường đã sử dụng

- Microsoft Edge `157.0.4341.46`
- Node `v24.20.0` trong `C:\Program Files\nodejs`
- Playwright Core `1.65.0` trong thư mục QA riêng
- Tác vụ tạm `QS3D-GuizangEdgeQA-NonSystem-20261114`, principal `Admin`, logon `Interactive`, run level `Limited`
- Chạy `chromium.launch({channel:'msedge', headless:true, args:['--disable-gpu']})`
- Không dùng profile Edge thật, không điều khiển tab có sẵn, không restart server/tunnel

### Bằng chứng lưu trên GitHub

- `edge-admin-limited-34-runner.cjs`: bản nguyên văn script 34 checks thực tế.
- `edge-admin-limited-34-report.json`: báo cáo **34/34 PASS** với principal xác minh.
- `edge-admin-limited-8-report.json`: kiểm thử smoke **8/8 PASS**.
- `edge-admin-limited-task-proof.json`: cấu hình principal, trạng thái LastTaskResult, Edge/Node version và số bài kiểm thử.
- Script SHA-256 `4DBBF368F09FEBC73CEB9770F8CC891B4E1A8BE5DBFF33B39A88873DF8F8AC96`.
- Báo cáo 34 checks SHA-256 `27971A24A19C5E4043F0D655A4C52D06211C5C2A2F4BA1E1AA7237A767F5CF7C`.
- Báo cáo smoke SHA-256 `CCB9F68F66FEA87F3B7CC897047458514898EE6EE32997ECAE942EFBA2EBACB6`.

### Phạm vi test

Bộ 34 kiểm thử truy cập URL production nhưng **nhúng iframe gốc qua HTML stub trong ngữ cảnh Playwright**, để nghiệm thu viewer, không tải gameplay/tài nguyên bên thứ ba. `browserContext.setOffline(true/false)` mô phỏng ngắt mạng ở trình duyệt, không rút cáp mạng thật. Sáu độ rộng 320, 360, 390, 768, 1024, 1440 px đều qua kiểm tra HTTP 200, tràn ngang, vị trí thanh nút và chiều cao iframe. Enter/Escape hủy tải lại an toàn, không tự reload khi mạng phục hồi. Không có lỗi JavaScript.

**Giới hạn:** chưa chứng nhận tất cả phiên bản Edge, mọi GPU, chính sách doanh nghiệp hoặc nội dung gameplay gốc. Phần cứng PCIe PHA vẫn là vấn đề độc lập thuộc [issue #2](https://github.com/trinhtanphat/qs3d-suong-son-game/issues/2).

### Hậu kiểm

Sau khi lưu và xác minh chứng cứ trên GitHub, tác vụ QA tạm được gỡ khỏi Task Scheduler. Không sử dụng GitHub Actions hay thay đổi nhánh main/production.
