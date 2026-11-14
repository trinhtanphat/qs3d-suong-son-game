# Guizang QS3D — Nghiệm thu production v1.1.1 (14/11/2026)

## Phát hành
- Website: https://guizang.qs3d.site/
- Source: https://github.com/trinhtanphat/qs3d-suong-son-game
- Commit main/release: 0d8a06bcd7a2f1d017b42e4d90e5ba1b16b3c2df
- Git tag: v1.1.1-guizang-20261114
- Bản trước: 0658ac2e18a0ebae2273bc852a2bad172c0aad86 (v1.1.0)
- Release dir: C:\QS3D\GuizangReleases\suongson-0d8a06bcd7
- Launcher: C:\QS3D\GuizangPortal\server.cjs
- Rollback launcher: C:\QS3D\GuizangPortal\server.cjs.before-reloadsafe-20261114

## Tính năng
- Hộp thoại xác nhận trước khi tải lại iframe, nút hủy giữ nguyên game đang chơi.
- Cảnh báo offline/online; kết nối phục hồi không tự reload, tránh mất tiến trình.
- Test công cụ chờ frame của tác giả có URL và tiêu đề thực, không nhầm Loading placeholder.

## Kết quả kiểm thử
| Bộ kiểm thử | Môi trường | Kết quả |
| --- | --- | ---: |
| HTTP/CSP/allowlist/HEAD và bảo vệ reload | Release trên máy 181 | 16/16 PASS |
| Hộp thoại, cancel/confirm reload, offline/online và mobile | Production | 22/22 PASS |
| Sương Sơn WebGL2, desktop/mobile và gameplay | Production | 40/40 PASS |
| Game gốc trực tiếp từ máy chủ tác giả, click bắt đầu, WebGL, mobile | Production | 12/12 PASS |
| **Tổng** | | **90/90 PASS** |
- Bài chơi trọn vẹn Sương Sơn qua 3 ải, thắng boss và chơi lại: PASS trên staging QA.
- Các bộ browser QA thành công trả exit code 0; không ghi nhận lỗi JavaScript hoặc failed HTTP asset trong phạm vi bài kiểm tra.
- Offline/online trong smoke test được phát sự kiện mô phỏng; không tuyên bố bao phủ mọi loại mất kết nối thật.

## Đối chiếu phát hành
- 51/51 tệp theo git tracked được sao vào release bất biến và kiểm tra SHA-256; riêng 16/16 bài kiểm thử HTTP đã chạy trong release.
- 8/8 tài nguyên public khớp với release: 6 static assets SHA-256 chính xác, 2 HTML khớp sau khi bỏ riêng beacon thống kê được Cloudflare chèn.
- Trang chủ, controls JS, Sương Sơn và healthz HTTP 200; đường /original 302 tới website tác giả.
- Nông Trại và Painted Valley HTTP 200 sau cập nhật.
- QS3D-GuizangPortal-Server181 và QS3D-GuizangPortal-Tunnel181 Running; chỉ task server Guizang được restart.
- Session 2 và các tunnel khác không được chủ động can thiệp; staging port 5413 đã được dừng sau nghiệm thu.

## Chứng cứ và quyền tác giả
- Chứng cứ production: C:\QS3D\GuizangPortal\QA-20261114-v111
- Manifest SHA-256: QA-20261114-v111\sha256-manifest.csv
- Game nguyên bản và toàn bộ hình/âm thanh/mô hình của tác giả được tải trực tiếp từ https://op7418.github.io/guizang-game-skill/. QS3D không độc lập tái phát hành.
- 90/90 PASS biểu thị các kịch bản đã chạy, không bảo đảm 100% thiết bị, GPU, trình duyệt hoặc thời gian hoạt động của nguồn bên ngoài.

## Rollback trong trường hợp sự cố
1. Phục hồi launcher từ server.cjs.before-reloadsafe-20261114 sang server.cjs.
2. Chỉ restart QS3D-GuizangPortal-Server181, không chạm tunnel.
3. Kiểm tra trang chủ 200, Sương Sơn 200, healthz 200 và giao diện v1.1.0 được phục hồi.
