# Guizang QS3D — Safe reload + network resilience QA (14/11/2026)

## Phạm vi thay đổi
- Version 1.1.1: yêu cầu xác nhận trước khi tải lại iframe game gốc, cho phép hủy để tránh mất tiến trình chưa lưu.
- Giao diện cảnh báo khi mất mạng, thông báo mạng phục hồi nhưng không tự tải lại game đang chơi.
- Cải tiến QA: chờ iframe navigates đúng URL và tiêu đề game gốc; bỏ qua trang Loading tạm trong Chromium/CDP.
- Không sao chép, proxy hoặc phát hành lại tệp trò chơi có bản quyền của tác giả.

## Bằng chứng staging thực tế (WIN11-181; không dùng GitHub Actions)
| Kiểm thử | Kết quả | Bằng chứng |
| --- | --- | --- |
| HTTP, CSP và các route | 16/16 PASS | docs/evidence/2026-11-14-reload-safe/http-tests.txt |
| UI, cảnh báo mạng, xác nhận/cancel reload, mobile | 22/22 PASS | controls-qa.json; controls-mobile.png |
| Sương Sơn hồi quy desktop/mobile | 40/40 PASS | regression.json; regression-desktop.png; regression-mobile.png |
| Chạy game gốc từ máy chủ tác giả, click bắt đầu, WebGL, mobile | 12/12 PASS | official-iframe-qa.json |
| Tổng kiểm thử định lượng | **90/90 PASS** | 4 bộ riêng biệt |
| Sương Sơn đủ 3 ải + chiến thắng boss + chơi lại | PASS | full-playthrough-result.json; full-playthrough-final.png |

## Sự cố và xử lý
- Lượt QA game gốc đầu tiên bắt gặp title trung gian 'Loading https://...' khi Chromium chưa hoàn tất navigation. Bộ QA đã được nâng cấp để chờ frame thực tế có URL và title chính xác.
- Thao tác 'offline/online' trong UI smoke test được kích bằng sự kiện mô phỏng có kiểm soát; không được hiểu là kiểm chứng mất mạng thực tế ở mọi trình duyệt.
- Bài kiểm thử click bắt đầu game gốc dùng tài nguyên thực từ website tác giả. Test điều khiển chỉ stub frame để kiểm tra logic QS3D một cách tách biệt.

## Điều kiện phát hành
- Branch QA sạch, kiểm tra JS syntax và git diff --check.
- Hash tệp runtime trên release phải khớp source SHA-256, HTTP test pass ngay trong thư mục release.
- Chỉ restart task QS3D-GuizangPortal-Server181; không restart tunnel hoặc tác động ứng dụng khác.
- Xác nhận production HTTP 200, client JS 200, trang /suong-son 200, bản origin redirect 302.
- Giữ launcher cũ và release cũ để có thể rollback nếu readiness thất bại.

## Giới hạn
- 90/90 PASS chỉ có nghĩa tất cả trường hợp đã định nghĩa đều đạt, không phải chứng nhận tương thích 100% mọi GPU/trình duyệt.
- Máy chủ và game gốc là của tác giả; QS3D chỉ là giao diện nhúng và liên kết dự phòng, không được quyền tự tái phát hành tài nguyên.
