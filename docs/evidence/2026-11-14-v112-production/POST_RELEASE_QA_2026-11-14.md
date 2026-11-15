# QA mở rộng sau phát hành — 14/11/2026 (v1.1.2)

## Mục tiêu
Kiểm tra các đường xử lý tải lại game có xác nhận, trạng thái mạng, tự ẩn thông báo, cài đặt tập trung, dự phòng khi lưu trữ bị chặn và giao diện ở nhiều kích thước.

## Kết quả được xác nhận
- **13/13 PASS**: bộ kiểm thử Node.js VM sử dụng nguyên tệp `official-controls.js` tại commit phát hành `8490b8358e0abe658cc74902d219f952f74ae922`.
- Script độc lập: `controls-vm-regression.test.cjs`. Log gốc: `controls-vm-qa.txt`.
- Không yêu cầu Chrome, không truy cập hoặc sửa tài khoản game, không phát sinh tải tài nguyên bản quyền.

Các hành vi VM được xác nhận: tải lại chỉ sau xác nhận; hủy không tải lại; trạng thái offline vẫn hiển thị sau iframe load; mạng phục hồi không tự tải lại; banner kết nối tự ẩn sau 12 giây; banner tải khung tự ẩn; cảnh báo chậm sau 18 giây; ghi nhớ Tập trung và xử lý localStorage bị từ chối; fallback khi thiếu dialog API; trợ giúp aria-expanded; báo lỗi toàn màn hình.

## Kiểm thử **chưa đạt điều kiện thực hiện**
- **Chrome/Playwright real offline, keyboard & responsive 320/360/390/768/1024/1440 px**: không có kết quả PASS.
- PHA chậm/mất phản hồi khi chạy script mở rộng, sau đó thiết bị hiển thị offline; không thu được báo cáo hoàn thành.
- WIN11-181: chạy `extended-network-win181.cjs` bị `browserType.connectOverCDP: read ECONNRESET` ngay khi kết nối Chromium debugger ở 127.0.0.1:9222; **0 bài kiểm thử trình duyệt mới đã chạy**.
- JSON gốc lỗi thử ở 181 lưu kèm là `extended-browser-attempt-win181.json`. Điều này không khẳng định game lỗi, nhưng cũng không chứng nhận thao tác real offline hoặc CSS trên tất cả khung hình.

## Phạm vi đã được nghiệm thu trước đó
- Production v1.1.2 đã có 98/98 bài kiểm thử HTTP/Chrome trên release và máy Intel PHA (xem các báo cáo JSON gốc).
- 3/3 ảnh QA production đã được khớp byte và SHA-256 và lưu ở nhánh kiểm toán.
- Không thêm 13 trường hợp VM vào 98 bài trước như thể đó là các bài browser thực tế.

## Trạng thái phát hành
Không phát hiện lỗi trong logic điều khiển đã kiểm tra, vì thế **không tạo bản phát hành mới**, không đụng production launcher, không restart tunnel, không thay đổi Session 2.


## Cập nhật tối 14/11/2026: Chrome đã chạy được, Edge chưa

Dòng mô tả “real browser expansion inconclusive” ở phần trước là **trạng thái của lần chạy ban đầu**, không còn mô tả kết quả cuối đối với Chrome. Sau khi dùng tiến trình headless Chrome riêng trên WIN11-181, **34/34 bài QA trình duyệt mở rộng PASS**, gồm Enter/Escape, mất/kết nối lại mạng bằng Playwright context, không tự reload iframe, 6 độ rộng responsive và 0 JavaScript errors. Tệp thực thi và JSON lưu tại `extended-browser-chrome181.cjs` / `extended-browser-chrome181.json`; phương pháp được ghi ở `EXTENDED_BROWSER_QA_2026-11-14.md`.

Đã thử Edge riêng nhưng browser exit code 1002 trước khi chạy bài test: **0/0, chưa chứng nhận Edge**. PHA có reboot gần đây và WHEA-Logger 17 nên không dùng để chạy kiểm thử lần này. Bộ HTTP trên release gốc chạy lại **17/17 PASS**. Không thay đổi production.
