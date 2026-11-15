# PHA: tình trạng nguồn, lỗi PCIe và phân biệt nhật ký GPU cũ
*Hồ sơ bàn giao kỹ thuật tại máy, ngày 15/11/2026, giờ Việt Nam.*

## 1. Kết quả trực tiếp, chưa sửa phần cứng

Thiết bị: **Dell Inspiron 3476**, Windows 11 Pro, tên PHA `DESKTOP-PHA1S90`. Phạm vi công việc: [issue #2](https://github.com/trinhtanphat/qs3d-suong-son-game/issues/2).

- Mới boot lúc **08:45:33.500 +07:00**, sau những lần bất thường trước đó tại 07:02 và 06:14 ngày 15/11. Tại 08:48:42 có **23 WHEA-Logger 17 trong 5 phút**. Trong 8 giờ gần nhất, có **3 Kernel-Power 41**, không ghi nhận Event 1074 (reboot có kế hoạch), 6006 (shutdown sạch), 1001 (BugCheck trong System) hoặc 46 (volmgr) khi lọc theo ID.
- Snapshot PHA lúc **08:52:38 +07:00** (máy mới chạy 7,1 phút) ghi **563 WHEA 17 trong cửa sổ hai giờ**. *Đây là cửa sổ nhật ký bao trùm nhiều lần khởi động*, không có nghĩa 563 sự kiện đều phát sinh kể từ 08:45. Nhóm AER `0x1000` chiếm **514/563**, là dấu hiệu Replay Timer Timeout trên đường PCIe Data Link.
- Qualcomm QCA9377 `PCI\VEN_168C&DEV_0042` là thiết bị con của Intel PCIe Root Port #6 `PCI\VEN_8086&DEV_9D15` theo Windows PnP. Quan hệ cha/con **đã được chứng minh**, nhưng linh kiện lỗi vẫn **chưa được xác định**.
- `WiFi`: **Up**; `Ethernet`: **Disconnected**. Tailscale là adapter ảo dùng đường mạng hiện có, *không phải* đường điều khiển vật lý độc lập. **Không được vô hiệu hóa/cài lại WLAN/BIOS từ xa**, khi chưa có đường dự phòng và người hỗ trợ.
- Trạng thái ACPI: Device Manager nhận diện `Microsoft AC Adapter` và `Microsoft ACPI-Compliant Control Method Battery` với `Status=OK`. Tuy nhiên WMI `root\wmi:BatteryStatus` có một bản ghi `PowerOnline=False`, `Charging=False`, `Discharging=False`, `RemainingCapacity=0`. `Win32_Battery` không có bản ghi. **Đây là tín hiệu cần xác minh từ BIOS và kiểm tra vật lý**, không đủ kết luận adapter hết điện, pin hỏng hoặc pin đã tháo. WMI/ACPI có thể cho kết quả thiếu hoặc không nhất quán.
- Ổ SSD `CT120BX500SSD1` được Windows Storage báo `Healthy/OK`. Đây không thay thế phân tích SMART chuyên sâu.
- Dữ liệu `Kernel-Power 41` gần đây có `BugcheckCode=0`. Điều này không xác định nguyên nhân: có thể do ngắt nguồn, treo cứng không ghi được dump hoặc các sự cố ngoài OS. Theo hướng dẫn Microsoft cần kiểm tra nguồn, nhiệt và phần cứng, không suy luận đơn lẻ từ Event 41.

## 2. Đính chính về nhật ký GPU — tránh sửa nhầm driver

Nhật ký Windows Error Reporting (`Application`, Event 1001) trong 10 giờ chứa **16 mục LiveKernelEvent 141**, nhưng **không phải 16 lần GPU treo mới**. Cả 16 mục được ghi lại từ **chỉ hai tệp WATCHDOG có tên ngày 07/11/2026**:

| Tên dump được WER tham chiếu | Số bản ghi lặp |
| --- | ---: |
| `WATCHDOG-20261107-1545.dmp` | 8 |
| `WATCHDOG-20261107-1427.dmp` | 8 |

Hai tệp dump cũ không còn hiện diện ở đúng đường dẫn trong `C:\Windows\LiveKernelReports\WATCHDOG\` tại thời điểm kiểm tra. Do đó **không thể phân tích dump mới hoặc kết luận GPU đang gây ra reboot ngày 15/11**. Driver Intel UHD Graphics 620 hiện được Windows báo `OK`, phiên bản `31.0.101.2141`; trạng thái này cũng không chứng minh GPU hoàn toàn ổn định.

Mã **0x141** tương ứng `VIDEO_ENGINE_TIMEOUT_DETECTED` và được Microsoft mô tả là *live dump*, **không phải mã bugcheck gây khởi động lại trực tiếp**. Cần phân biệt thời điểm WER ghi báo cáo với thời điểm tạo tệp WATCHDOG.

Nguồn: [Microsoft về 0x141](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x141---video-engine-timeout-detected).

## 3. Trình tự can thiệp tại PHA — không tự động thực hiện từ xa

**Giai đoạn A — bảo đảm khả năng phục hồi**

1. Sao lưu tài liệu và hồ sơ QA quan trọng khỏi PHA. Ghi lại phiên bản driver WLAN, BIOS, trạng thái WHEA trước thay đổi.
2. Cắm **cáp mạng Ethernet** từ cổng Realtek của PHA tới router/switch có mạng; xác nhận `Get-NetAdapter -Name Ethernet` báo `Up` và điều khiển từ xa hoạt động *qua Ethernet* cả khi ngắt Wi-Fi. Chỉ hiển thị Tailscale `Up` là **không đủ**.
3. Có người trực tiếp bên máy, nguồn AC ổn định và phương án rollback.

**Giai đoạn B — kiểm tra nguồn và chẩn đoán Dell**

4. Kiểm tra bộ sạc đúng thông số Dell, đầu cắm DC, dây/ổ điện, mức pin và tình trạng adapter được BIOS nhận diện. Nếu cần thử adapter tương thích khác, thực hiện tại máy và ghi lại kết quả; không rút sạc trên máy chưa có pin dự phòng.
5. Chạy chẩn đoán phần cứng Dell ePSA tại máy (bật nguồn, tại logo Dell bấm **F12**, chọn **Diagnostics**); ghi ảnh hoặc mã lỗi và *validation number*. Theo tài liệu Dell, một số kiểm thử yêu cầu tương tác trực tiếp, không được thực hiện tự động từ xa.
6. Trên cơ sở kết quả chẩn đoán, kiểm tra nhiệt độ, module Wi-Fi và khe PCIe; có thể cần thợ kỹ thuật tháo và kiểm tra card theo tài liệu service manual Dell. Không tự ý thay BIOS hay driver cùng phiên bản để chạy thử khi đường mạng duy nhất chưa được bảo vệ.

**Giai đoạn C — nghiệm thu**

7. Sau khi sửa căn nguyên, theo dõi **ít nhất 24 giờ**: `WHEA 17` mới bằng 0, `Kernel-Power 41`/shutdown bất thường mới bằng 0, mạng ổn định; sau đó mới chạy lại GPU QA và đánh dấu issue #2 hoàn thành.
8. Nếu lỗi tiếp tục, giữ issue mở và chuyển Dell/đơn vị sửa chữa đến kiểm tra nguồn, mainboard/PCIe và WLAN có kiểm soát.

Tài liệu chính thức:
- [Dell Inspiron 3476 — hướng dẫn chạy ePSA/F12](https://www.dell.com/support/manuals/en-th/inspiron-14-3476-laptop/inspiron-14-3476-servicemanual/running-the-epsa-diagnostics?guid=guid-0b893eed-efbc-4831-a9c4-7298a7a9f619&lang=en-us)
- [Dell Inspiron 3476 — hướng dẫn tháo card Wi-Fi](https://www.dell.com/support/manuals/en-au/inspiron-14-3476-laptop/inspiron-14-3476-servicemanual/procedure?guid=guid-d7370e2c-e6cd-48a6-bee7-ca97ae8e2dca&lang=en-us)
- [Microsoft — Event 41 với BugcheckCode=0](https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/event-id-41-restart)

## 4. Mức hoàn thành

- **Đã làm:** kiểm tra lại PHA, lấy bằng chứng sự kiện WHEA/reboot, kiểm tra PnP battery/adapter, xác minh WER 141 tham chiếu dump cũ, kiểm tra mạng dự phòng và sao lưu JSON quan sát sang WIN11-181/GitHub.
- **Chưa làm được từ xa:** Ethernet vật lý chưa kết nối; chưa có kết quả Dell ePSA hoặc sửa/thay phần cứng; chưa đạt mốc 24 giờ vận hành ổn định.
- **Không tác động:** Guizang production, tunnel, browser Session 2; không reset WLAN, sửa driver/BIOS/power plan hoặc reboot PHA.

Dữ liệu gốc cùng hồ sơ: `pha-live-evidence-20261115-085238.json`. **Issue #2 phải tiếp tục mở.**
