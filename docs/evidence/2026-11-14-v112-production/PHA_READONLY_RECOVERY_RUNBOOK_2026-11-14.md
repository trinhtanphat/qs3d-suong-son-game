# PHA PCIe/WHEA — chẩn đoán chỉ đọc và tiêu chí khôi phục (14/11/2026)

## Trạng thái đã xác minh

- Máy `DESKTOP-PHA1S90` khởi động lại lúc **20:10:53 +07:00 ngày 14/11/2026**.
- Snapshot trực tiếp trên PHA lúc 20:31:40 cho thấy **82 WHEA-Logger 17 / 15 phút**, nguồn Intel PCI Express Root Port #6 `8086:9D15`; Qualcomm QCA9377 WLAN `168C:0042` trên nhánh tương ứng.
- Các sự kiện Kernel-Power 41, EventLog 6008 cho thấy mất điện/tắt máy không bình thường từng xảy ra, nhưng **không chứng minh** chính các sự kiện WHEA gây ra reboot.
- Trong phiên kiểm tra tiếp theo, PHA **offline** với Private Commander. Không có kết quả sửa lỗi phần cứng nào được xác nhận, nên [issue #2](https://github.com/trinhtanphat/qs3d-suong-son-game/issues/2) phải tiếp tục mở.

Theo Microsoft, lỗi WHEA corrected đã được phần cứng/firmware khắc phục trước khi OS nhận thông báo; điều đó không có nghĩa đường kết nối PCIe chắc chắn ổn định khi sự kiện lặp lại liên tục. [Microsoft Learn](https://learn.microsoft.com/en-us/windows-hardware/drivers/whea/hardware-errors-and-error-sources).

## Bộ collector an toàn đã chuẩn bị

Tệp `pha-whea-readonly-collector.ps1` chỉ truy vấn Windows: uptime, model, phiên bản BIOS, bộ đếm WHEA 17 15 phút/2 giờ, có/không trong 24 giờ, Kernel-Power 41/6008, PnP Root Port/WLAN, Wi-Fi driver đã cài và trạng thái network adapter. Tạo JSON tại thư mục QA được chỉ định.

**Không có** câu lệnh restart/reboot, sửa registry, quản trị thiết bị, cập nhật driver, đặt lại Wi-Fi, thay đổi route, cập nhật BIOS, chỉnh quyền hay triển khai production.

Cú pháp collector đã được kiểm tra và chạy thử thành công trên **WIN11-181**, chỉ để chứng minh collector hoạt động. Kết quả đó là trạng thái máy 181, **không được dùng làm bằng chứng PHA đã ổn định**.

### Khi PHA kết nối lại

1. Xác nhận đường truy cập dự phòng trước khi thao tác. Bản gốc QA và log phải được giữ nguyên.
2. Chỉ chạy collector trên PHA ở chế độ đọc, ví dụ `powershell.exe -NoProfile -File .\pha-whea-readonly-collector.ps1 -OutputDirectory C:\Temp\PHA-PCIe-ReadOnly` (chuyển script sang thư mục QA được phép trước).
3. Kiểm tra `whea17Last15Min`, `whea17Last2H`, `anyWhea17Last24H`, `unexpectedShutdownEvents24H`, `uptimeHours` và `wifiDrivers`; đối chiếu tên model để tìm trang trình điều khiển chính xác theo model.
4. Nếu có WHEA liên tục hoặc reset/mất mạng, giữ trạng thái issue mở; chuyển tới kỹ thuật viên có khả năng truy cập vật lý.
5. **Sau** xử lý tại máy có rollback, chỉ đánh dấu cổng ổn định sơ bộ khi: uptime ít nhất 24 giờ, WHEA 17 trong 24 giờ = 0, không có sự kiện tắt máy bất thường trong 24 giờ, network ổn định. Cần thêm thử nghiệm thực tế và xác nhận nguyên nhân để đóng issue, không chỉ dựa trên một JSON.

Dell có gói Qualcomm QCA61x4A/QCA9377 nhưng **tùy model Dell và hệ điều hành**. Không tự lấy một gói theo tên card rồi cài vào PHA khi chưa đối chiếu model cụ thể: [Dell Driver Details](https://www.dell.com/support/home/en-us/drivers/driversdetails?driverId=PRGRM).

## Giới hạn hành động từ xa

Mình không thể xác minh hoặc sửa phần cứng khi PHA offline. Không tự reset module Wi-Fi hay BIOS qua đường điều khiển đang không ổn định. Một kỹ thuật viên tại máy có thể kiểm tra card WLAN, đường PCIe, nguồn, nhiệt độ, firmware và driver đúng model trong điều kiện có kết nối dự phòng.

**Chỉ tiêu 100% cho issue #2 chưa đạt.** Issue #1 Edge đã PASS 34/34 trên tài khoản QA không đặc quyền, không liên quan đến sự cố PCIe này.


## 15 Nov 2026 PHA follow-up — ongoing hardware failure

Direct PHA inspection after a new boot at 06:14:18+07:00 found **576 WHEA 17 events / 24h**, **5 Kernel-Power 41** and **5 EventLog 6008**, with a five-minute WHEA count increasing from 36 to 41. Wi-Fi is the only connected physical network adapter (Ethernet disconnected); PCIe power saving is already Off. Hardware remains unsafe to modify remotely. See `PHA_WHEA_INVESTIGATION_2026-11-15.md`, `pha-whea-2026-11-15-direct-snapshot.json` and `pha-kernelpower-powerplan-2026-11-15.json`. Issue #2 stays open.
