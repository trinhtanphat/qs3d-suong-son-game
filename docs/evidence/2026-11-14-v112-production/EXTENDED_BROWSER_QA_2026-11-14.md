# QS3D Guizang v1.1.2 — kiểm thử trình duyệt mở rộng (14/11/2026)

## Kết quả cuối

**Chrome headless độc lập trên WIN11-181: 34/34 PASS, 0 JavaScript exceptions, exit 0.**
Đây là những kiểm thử mở rộng bổ sung; các báo cáo nghiệm thu v1.1.2 trước đó vẫn là 98/98 theo bộ tiêu chí gốc.

| Thành phần | Kết quả | Điều kiện |
| --- | --- | --- |
| Viewer và iframe URL | PASS | Mở https://guizang.qs3d.site/ HTTP 200; iframe tác giả được chặn bằng route và đáp ứng bằng HTML stub |
| Điều khiển phím Enter/Escape | PASS | Mở/hủy dialog tải lại; không thay iframe khi người dùng hủy |
| Gián đoạn & hồi phục mạng | PASS | Playwright `browserContext.setOffline(true/false)`, giữ nguyên iframe; thông báo phục hồi tự ẩn |
| Responsive 320, 360, 390, 768, 1024, 1440 px | 24/24 PASS | HTTP 200; không tràn ngang; toàn bộ nút trong viewport; khung game đạt chiều cao tối thiểu |
| JavaScript runtime | PASS | 0 page errors |
| **Tổng các assertion** | **34/34 PASS** | `extended-browser-chrome181.json` |

**Định nghĩa đúng phạm vi:** `setOffline` mô phỏng mất mạng trong Chromium context; không phải ngắt cáp/Wi-Fi của máy thật. Nội dung iframe được thay bằng stub riêng trong QA, vì vậy phép thử này **không** chứng nhận toàn bộ gameplay hay tài nguyên WebGL từ máy chủ gốc. Toàn bộ tương tác diễn ra trong Chrome headless QA tách biệt; không sử dụng hoặc đóng tab Session 2.

## Chạy kiểm thử và truy xuất nguồn

- Ứng dụng: `https://guizang.qs3d.site/`, commit main và bản immutable release: `8490b8358e0abe658cc74902d219f952f74ae922`.
- Thiết bị: WIN11-181; Chrome `157.0.8103.51`; Playwright Core `1.65.0`.
- `extended-browser-chrome181.cjs`: bản sao byte-identical của **script thực tế đã chạy**, không phải bản viết lại sau khi có kết quả.
- `extended-browser-chrome181.json`: báo cáo 34/34 với 34 tên bài kiểm thử, không có lỗi JavaScript. SHA-256 `A0A6A86E8403866853572ED99FE1910605B0C174562115A6DD2A157216C65B3A`.
- SHA-256 script: `761D70A1866CC418425A9E4141CF8EEB1C3E067447A99952B4E0A6A6BF71FC79`.
- Command đã sử dụng trên 181: `$env:NODE_PATH='C:\QS3D-QA\guizang-embed-20261113\node_modules'; node C:\QS3D-QA\guizang-v112-ux-20261114-out\extended-network-isolated181.cjs`. Bản đã lưu tại đây dùng cùng nội dung. Đầu ra trong script được gán đường dẫn tuyệt đối vào thư mục QA riêng của máy 181; khi chạy trên máy khác cần điều chỉnh đường dẫn QA và Chrome trước.
- Không chạy GitHub Actions.

## Kiểm tra chéo Edge — CHƯA ĐẠT ĐIỀU KIỆN KHỞI CHẠY

Đã thử bằng Edge `157.0.4341.46`, dùng profile tạm và không đụng tới Edge đang mở. Playwright `browserType.launch` thoát ngay với exit code `1002` (**0/0 assertions executed**, không phải các bài test bị fail). Bằng chứng nguyên trạng: `extended-browser-edge181.cjs` và `extended-browser-edge181.json`. Không thể suy diễn từ lỗi startup này rằng game lỗi trên Edge; cũng không được tính Edge là PASS.

## Trạng thái PHA — bảo toàn hạ tầng

Trước khi thử QA lần này, `DESKTOP-PHA1S90` vừa khởi động lại lúc **20:10:53 +07:00 ngày 14/11/2026**. Kiểm tra nhật ký System cho thấy nhiều sự kiện WHEA-Logger 17 trong khoảng 20:12–20:13. Không xác định chắc chắn nguyên nhân reboot chỉ từ các cảnh báo này. Vì vậy **không chạy GPU/Chrome QA, không reboot/reset phần cứng/mạng trên PHA**.

## Đối chiếu bổ sung

- Bộ unit HTTP/CSP trong immutable release v1.1.2 được chạy lại trên WIN11-181: **17/17 PASS, exit 0**.
- 13/13 kiểm thử VM logic được lưu ở `controls-vm-regression.test.cjs` và `controls-vm-qa.txt`.
- Các PNG QA production gốc đã có đủ 3/3 với SHA-256 trong `screenshot-delivery-status.csv`.
- Không có thay đổi mã nguồn runtime hoặc phát hành mới. Chỉ cập nhật nhánh audit riêng để lưu bằng chứng.

## Các giới hạn chưa chứng nhận

Edge chạy QA độc lập chưa khởi tạo được; máy PHA có cảnh báo WHEA; việc mất mạng trên **phần cứng mạng thật** và trải nghiệm người chơi trên mọi GPU/thiết bị chưa được kiểm chứng. Vì vậy “34/34 PASS” chỉ áp dụng đúng 34 assertion được mô tả ở trên.
