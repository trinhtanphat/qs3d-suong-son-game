# 雾锁山门 — chơi bản gốc qua QS3D

**Website chính:** https://guizang.qs3d.site/

Trang chủ QS3D hiển thị **trò chơi 雾锁山门 / Mist-Locked Gate chính thức của 歸藏 (Guizang)** trong một iframe. Chương trình và tài nguyên trò chơi được trình duyệt tải trực tiếp từ máy chủ chính thức op7418.github.io, **không sao chép, proxy hoặc host lại tài nguyên game gốc trên QS3D**.

## Đường dẫn

| Đường dẫn | Nội dung |
| --- | --- |
| https://guizang.qs3d.site/ | Chơi game gốc trong khung QS3D, hiển thị tên tác giả |
| https://guizang.qs3d.site/play-original | Bí danh trang chơi game gốc |
| https://guizang.qs3d.site/original | Chuyển hướng HTTP 302 đến website chính thức |
| https://op7418.github.io/guizang-game-skill/ | Bản gốc do tác giả cung cấp, dự phòng nếu iframe không chạy |
| https://guizang.qs3d.site/suong-son | **Sương Sơn**, game 3D khác do QS3D tự phát triển |

## Repository GitHub

- **Fork đầy đủ** lịch sử Git, cả main và gh-pages của dự án gốc: https://github.com/trinhtanphat/guizang-game-skill
- Mã nguồn của **trang chơi QS3D** và game Sương Sơn độc lập: https://github.com/trinhtanphat/qs3d-suong-son-game

Không đồng nhất hai trò chơi và không đổi tên game gốc thành Sương Sơn. File tài nguyên có bản quyền của Guizang không được phân phối qua repo web QS3D.

## Bản quyền và ghi công

Tác giả của 雾锁山门 là **歸藏 / Guizang**, © 2026. Tài liệu và script Skill trên nhánh main của kho upstream dùng AGPL-3.0; tác giả giữ toàn quyền đối với đồ họa, mô hình, âm thanh, lồng tiếng và nội dung sáng tạo game trong gh-pages, và ghi rõ không cho re-host/rebrand nếu chưa được phép. Trang nhúng này chỉ tải URL do tác giả phát hành. Nếu tác giả tắt hỗ trợ iframe hoặc thay đổi điều khoản, mở liên kết chính thức hoặc rút trang nhúng.

**Sương Sơn** ở đường /suong-son là một trò chơi **riêng biệt**, có mã nguồn và hình học tạo độc lập, dùng Three.js theo MIT. Xem LICENSE và THIRD_PARTY_NOTICES.md.

## Cài đặt và kiểm thử

Chạy server địa phương bằng Node.js 18+:

~~~bash
node server.cjs
~~~

Trang / cần mạng để tải game gốc từ GitHub Pages. Để chơi Sương Sơn offline, mở http://127.0.0.1:5400/suong-son (Three.js được vendor nội bộ); font tùy chọn có fallback.

~~~bash
npm install
npm test
~~~

Kiểm thử browser dùng Chromium trong **profile QA riêng biệt**, không đóng tab làm việc nào:

~~~bash
# Đặt QA_CHROME_PATH trỏ tới chrome.exe trên Windows.
# Đặt GAME_URL trỏ tới /suong-son khi thử game độc lập.
npm run test:browser
npm run test:regression

# Đặt VIEWER_URL trỏ tới trang / hoặc /play-original.
npm run test:official
~~~

Các biến môi trường: QA_CHROME_PATH, GAME_URL, VIEWER_URL, QA_OUT_DIR. Lựa chọn khác là CDP_URL trỏ tới một Chromium QA riêng, không dùng session làm việc chung.

## QA và vận hành

- Kiểm thử HTTP xác nhận trang chủ là iframe game gốc, /suong-son là game riêng, không lộ file nhạy cảm, CSP giới hạn iframe tại op7418.github.io.
- Kiểm thử iframe xác nhận trang đúng nguồn, tài nguyên tải xong, click chuột vào “点击开始” và mobile có kích thước đúng.
- Kiểm thử Sương Sơn bao gồm desktop/mobile, di chuyển, tấn công, phòng thủ, hồi máu, hồi quy, và full playthrough 3 ải thắng Boss.
- Tác vụ server và tunnel QS3D được quản lý riêng, có bản phát hành bất biến và rollback không ảnh hưởng production khác.
- Các bài PASS chỉ chứng minh phạm vi đã kiểm tra, không có nghĩa bao phủ 100% mọi thiết bị hay bảo đảm máy chủ tác giả luôn trực tuyến.

Chi tiết kết quả phát hành và biên bản QA nằm trong thư mục docs/.

## Công cụ chơi nâng cấp (14/11/2026)

Thanh điều khiển QS3D của trang game gốc có **Tập trung** (thu gọn phần mô tả), **Toàn màn hình** (khi trình duyệt cho phép), **Tải lại game** (sẽ khởi động lại khung, có thể mất tiến trình chưa lưu), và **Trợ giúp**. Khi tải chậm, liên kết chính thức luôn sẵn có. Trình duyệt chỉ tải game từ máy chủ tác giả; nút điều khiển và cảnh báo thuộc giao diện QS3D riêng.

Mã mới: `official-controls.js`. Khung chính `official-frame.html` không truy cập trạng thái game nội bộ do khác origin. Các bài QA mới dùng iframe thay thế giả lập để kiểm tra nút, **không** coi đó là bằng chứng game thực đã tải. Bộ `test:official` vẫn kiểm tra game gốc thực sự và `test:regression` vẫn kiểm tra game Sương Sơn.

```bash
node --test tests/http.test.cjs
node qa/portal-controls.cjs
```
## v1.1.1: Tải lại có xác nhận và hỗ trợ khi mất mạng (14/11/2026)

Nút **Tải lại game** yêu cầu xác nhận, cho phép tiếp tục chơi nếu nhấn nhầm; điều này tránh vô tình mất tiến trình chưa lưu trong iframe của tác giả. Trình xem cũng thông báo khi trình duyệt chuyển ngoại tuyến hoặc khôi phục mạng, **không tự động tải lại**, tránh mất dữ liệu game. Dùng `npm run test:controls` để kiểm thử điều khiển bằng iframe giả lập và `npm run test:official` để kiểm chứng nội dung tác giả thực tế.
