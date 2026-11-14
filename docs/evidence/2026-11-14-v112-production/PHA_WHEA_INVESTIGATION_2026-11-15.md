# DESKTOP-PHA1S90 — cập nhật điều tra PCIe/WHEA ngày 15/11/2026

## Tóm tắt kiểm chứng

Máy **Dell Inspiron 3476** đã trở lại trực tuyến, nhưng **chưa được sửa**. Bản log trực tiếp cho thấy lỗi WHEA tái diễn ngay sau khi máy reboot không bình thường; do không có đường Ethernet dự phòng, mọi thay đổi card Wi-Fi/BIOS từ xa đều có nguy cơ cắt đường truy cập.

| Tham số | Kết quả |
| --- | --- |
| Lần boot hiện tại | `2026-11-15T06:14:18.5000000+07:00` |
| Snapshot WHEA | `2026-11-15T06:17:52.2373682+07:00` |
| WHEA Event 17 trong 5 phút tại snapshot | **36** |
| WHEA Event 17 trong 24 giờ | **576** |
| Chụp lại lúc 06:18:36, WHEA trong 5 phút | **41** |
| Kernel-Power Event 41 trong 24 giờ | **5** |
| EventLog 6008 trong 24 giờ | **5** |
| BugcheckCode của cả 5 Event 41 | **0** |
| Wi-Fi | `Up`, Qualcomm QCA9377; driver **12.0.0.1118**, 19/05/2021 |
| Ethernet | **Disconnected** — không có đường mạng vật lý dự phòng |
| Tailscale | `Up`, nhưng chạy trên mạng máy hiện có, không là đường NIC độc lập |
| BIOS | Dell **1.16.0**, 16/12/2021 theo Windows |
| Power plan | **High performance** |
| PCIe Link State Power Management | **Off** trên AC và DC (index `0`) |
| PnP Device Status | `OK` cho Intel Root Port #6 và Wi-Fi QCA9377; không chứng minh link PCIe khỏe |

Các event WHEA chỉ ra **Intel PCI Express Root Port #6 (8086:9D15)**; thiết bị WLAN phía sau là **Qualcomm QCA9377 (168C:0042)**. Trong thông báo của Windows, đây là **corrected PCIe Advanced Error Reporting**. Chúng cho thấy lỗi đã xảy ra và được sửa tại tầng phần cứng; chúng không chứng minh card WLAN là thủ phạm cuối cùng.

### Phân tích reboot

Năm Kernel-Power 41 theo thứ tự mới nhất: `06:14:32 15/11`, `20:11:04 14/11`, `17:04:46 14/11`, `15:33:38 14/11`, `14:20:41 14/11` (+07:00). `BugcheckCode=0` ở cả năm; `SleepInProgress` lần lượt 6, 1, 6, 6, 0; `LongPowerButtonPressDetected=false`. Điều này **không** xác định dứt khoát nguồn điện, driver, sleep transition hay thiết bị PCIe là nguyên nhân. Nên kiểm tra nguồn và sleep/resume có giám sát tại máy.

Sự kiện Kernel-Boot 29 vào 06:14 có lỗi Fast Startup `0xC000007B`; chưa có căn cứ quy lỗi đó là nguồn gốc WHEA.

## Bằng chứng máy

- `pha-whea-2026-11-15-direct-snapshot.json`: snapshot đọc trực tiếp trên PHA 06:17:52, gồm WHEA 5 phút/24 giờ, lịch sử shutdown và trạng thái Ethernet/Wi-Fi/driver.
- `pha-kernelpower-powerplan-2026-11-15.json`: 5 Kernel-Power 41 với mã BugCheck và trạng thái PCIe power plan. Dữ liệu lấy bằng PowerShell đọc trực tiếp trên PHA; không thay đổi cấu hình.
- Snapshot cũ và collector: `pha-whea-readonly-snapshot.json`, `pha-whea-readonly-collector.ps1`.

## Đối chiếu nhà sản xuất

Dell công bố gói Qualcomm QCA9377 driver **12.0.0.1118 / A45** cho danh sách hệ thống tương thích có Inspiron 3476:
https://www.dell.com/support/home/en-us/drivers/driversdetails?driverid=v5jjk

Dell cũng có trang tải BIOS **1.16.0** dành cho Inspiron 3476:
https://www.dell.com/support/home/en-us/drivers/driversdetails?driverid=2ntr2

**Không khuyến nghị cài lại ngay**: đúng phiên bản Wi-Fi driver và BIOS đã có trên máy. Danh sách công khai chưa đủ để chứng minh đó là bản tối ưu cho từng Service Tag, cũng không có bằng chứng cài lại sẽ giải quyết lỗi PCIe. Đặc biệt Dell cảnh báo BIOS update phải có nguồn ổn định và sẽ restart; máy vừa reboot bất thường và không có đường truy cập dự phòng, nên **không được flash BIOS từ xa**.

## Biện pháp đã thực hiện

- Thu thập đọc trực tiếp EventLog, CIM PnP, driver, BIOS, powercfg và trạng thái adapter.
- Đối chiếu với các gói Dell có hỗ trợ model tương ứng.
- Bảo toàn production, tunnel và Session 2.
- Không disable/re-enable WLAN, không thay driver, BIOS, powercfg, registry hoặc reboot.
- Lưu và push bằng chứng vào nhánh kiểm toán, không trộn vào mã production.

## Điều kiện để hoàn tất issue #2

1. **Đảm bảo đường truy cập dự phòng thực sự độc lập với QCA9377**, tốt nhất kết nối Ethernet có dây đang `Up`, và người hỗ trợ ở cạnh máy.
2. Kiểm tra vật lý card WLAN PCIe, khe/tiếp xúc, nguồn/adapter, nhiệt độ, dây anten; ghi nhận nguyên nhân và phương án rollback.
3. Kiểm tra/sửa bằng driver hoặc linh kiện phù hợp model Dell sau khi có backup/khả năng phục hồi. Không mặc định đổ lỗi riêng cho Wi-Fi card khi lỗi xuất hiện trên Root Port.
4. Theo dõi tối thiểu **24 giờ** không WHEA 17 và không shutdown bất thường, cùng kiểm tra hoạt động mạng sau sửa. Đây là ngưỡng nghiệm thu vận hành do dự án đặt ra, không phải tiêu chuẩn chính thức của Dell.
5. Chỉ sau khi có biên bản thực nghiệm mới đóng [issue #2](https://github.com/trinhtanphat/qs3d-suong-son-game/issues/2).

## Kết luận

**Chưa thể xác nhận 100% sửa phần cứng.** Máy vẫn phát sinh corrected PCIe errors và đã có nhiều lần reboot. Việc buộc cài lại driver hoặc khởi động lại trong trạng thái hiện tại có thể làm mất truy cập và ảnh hưởng dữ liệu QA. Các mục Edge 34/34 và Chrome 34/34 PASS của Guizang không bị thay đổi.
