# PHA PCIe AER — xác định loại lỗi và ánh xạ thiết bị, 15/11/2026

## Kết quả mới có giá trị chẩn đoán

**Thiết bị:** Dell Inspiron 3476 `DESKTOP-PHA1S90`, Windows 11 Pro 26H2, build `26300.9974` (CIM báo Windows 11; khóa `ProductName` legacy của Windows có thể còn chuỗi Windows 10). Card WLAN Qualcomm QCA9377 `168C:0042`, driver `12.0.0.1118`.

**Kiểm tra đọc trực tiếp lúc 06:47:54 +07:00:** 114 WHEA-Logger Event 17 trong khoảng hai giờ tra cứu. Đây chủ yếu là sự kiện từ phiên khởi động mới lúc 06:14:18, không phải 114 lỗi trong hai giờ hoạt động liên tục.

| Correctable AER status | Uncorrectable register | Số event | Diễn giải các bit trạng thái |
| --- | --- | ---: | --- |
| `0x1000` | `0x0` | **106/114** | Bit 12: **Replay Timer Timeout** (lỗi lớp PCIe Data Link) |
| `0x3000` | `0x10000` | 4 | Correctable bit 12 Replay Timer Timeout + bit 13 Advisory Non-Fatal; trong snapshot cũng có uncorrectable register bit 16 |
| `0x2000` | `0x10000` | 2 | Correctable bit 13 Advisory Non-Fatal; uncorrectable register bit 16 |
| `0x81` | `0x0` | 1 | Bit 0 Receiver Error + bit 7 Bad DLLP |
| `0x1041` | `0x0` | 1 | Bit 0 Receiver Error + bit 6 Bad TLP + bit 12 Replay Timer Timeout |

**106/114 = ~93,0%** bản ghi thuần `0x1000`. Cả 114 bản ghi được Windows phân loại **WHEA corrected Event 17**. `UncorrectableErrorStatus=0x10000` là giá trị thanh ghi AER đã đọc trong **sáu snapshot**; mã bit 16 là *Unexpected Completion*, **không đủ để kết luận một sự kiện uncorrected fatal thực sự đã xảy ra**. Trong truy vấn kèm theo không tìm thấy bản ghi WHEA 18, 19 hay 47 trong 24 giờ. Không thay đổi thanh ghi PCIe nào.

Nguồn giải mã các bit từ mã kernel Linux:
- [Linux PCIe AER error names — kernel source](https://github.com/torvalds/linux/blob/master/drivers/pci/pcie/aer.c)
- [Linux PCIe AER status bit decoder](https://kernel.googlesource.com/pub/scm/linux/kernel/git/stable/linux-stable/+/58995a9a5b292458f94a2356b8c878230fa56fe0/drivers/pci/pcie/aer/aerdrv_errprint.c)

### Xác nhận cha–con PCIe trực tiếp từ PnP

```text
Root Port #6:
  PCI\VEN_8086&DEV_9D15&SUBSYS_083C1028&REV_F1
  Bus 0, Device 0x1c, Function 0x5
       |
       +-- Qualcomm QCA9377 Wi-Fi:
           PCI\VEN_168C&DEV_0042&SUBSYS_18101028&REV_31
           Location: PCI bus 3, device 0, function 0
           Location path: PCIROOT(0)#PCI(1C05)#PCI(0000)
           Parent: exact Intel Root Port #6 instance
```

Điều này xác nhận QCA9377 **thực sự nằm sau Root Port báo lỗi**. Tuy nhiên chưa xác định linh kiện gây lỗi là card, đầu nối PCIe, root port/chipset, firmware/driver hay nguồn.

## Đánh giá an toàn

- Lúc 06:46:25: 15 WHEA 17 trong 5 phút, 29 trong 15 phút, 100 trong 30 phút; 111 từ phiên boot hiện tại.
- SSD `CT120BX500SSD1` hiện báo `Healthy / OK`. Đó chỉ là trạng thái CIM, không phải chứng nhận SMART chuyên sâu.
- Wi-Fi **Up**; Ethernet **Disconnected**. Máy có Tailscale nhưng không có đường mạng vật lý độc lập. Không được disable/reset Wi-Fi hay flash BIOS từ xa.
- BIOS đang `1.16.0` và driver Wi-Fi `12.0.0.1118`; các gói Dell cho Inspiron 3476 đã công bố những phiên bản này:
  - [Dell BIOS 1.16.0](https://www.dell.com/support/home/en-us/drivers/driversdetails?driverid=2ntr2)
  - [Dell QCA9377 Wi-Fi driver 12.0.0.1118](https://www.dell.com/support/home/en-us/drivers/driversdetails?driverid=v5jjk)
- Dell ghi driver QCA9377 trong gói V5JJK có chứng nhận Windows 10 2018/2019/2020. PHA chạy Windows 11 build 26300.9974; cần kiểm tra khả năng tương thích hệ điều hành với trang Dell theo model/Service Tag tại chỗ. **Sự khác biệt hệ điều hành không chứng minh driver là nguyên nhân**, chỉ là một giả thuyết phải thử có kiểm soát sau khi có mạng dự phòng.
- Windows cho phép S3 và Hibernate, không có S0 Low Power Idle, Hybrid Sleep không hỗ trợ do hypervisor. Event Kernel-Power 41 cho thấy một số lần `SleepInProgress` khác 0, chưa đủ chứng minh sleep gây reboot.

## Quy trình cô lập nguyên nhân có kiểm soát

1. Tạo kết nối **Ethernet có dây** thật sự trên PHA, xác nhận `Get-NetAdapter -Name Ethernet` trả `Up` và điều khiển được máy qua đường này khi Wi-Fi ngắt. Nếu không có Ethernet, cần người trực tiếp ở máy cùng phương án phục hồi.
2. Backup hồ sơ QA và cấu hình hiện hành. Ghi lại mẫu WHEA trước khi thay bất kỳ thành phần nào.
3. Khi kỹ thuật viên có mặt, thực hiện kiểm tra nguồn adapter, nhiệt độ, ổ cắm, tiếp xúc card QCA9377, antenna/WLAN và tình trạng khe/mainboard. Giữ dữ liệu nguyên trạng.
4. **Chỉ sau khi có mạng dự phòng**, thử cô lập thiết bị WLAN một cách có kiểm soát, so sánh WHEA trước/sau; nếu tần suất giảm, vẫn cần phân biệt card, khe, driver và tương tác chipset. Không coi kết quả duy nhất là bằng chứng tuyệt đối.
5. Sửa đúng nguyên nhân; không lặp lại cài đặt driver/BIOS cùng phiên bản một cách mù quáng. Có kế hoạch rollback trước mọi thay đổi.
6. Nghiệm thu dự án: **24 giờ uptime không WHEA Event 17 mới, không shutdown bất thường, kết nối ổn định**, rồi chạy lại QA phần cứng. Đây là ngưỡng nghiệm thu nội bộ, không phải quy định chung của Dell.

## Chứng cứ

- `pha-pcie-aer-status-2026-11-15.json`: được tổng hợp trực tiếp từ Event XML trên PHA, gồm tất cả nhóm thanh ghi AER, parent/child PnP, trạng thái adapter, disk, WHEA 18/19/47.
- `pha-whea-2026-11-15-direct-snapshot.json`: 576 WHEA 17/24h và năm shutdown bất thường.
- `pha-kernelpower-powerplan-2026-11-15.json`: five Kernel-Power 41 (`BugcheckCode=0`), ASPM Off.
- Không sửa driver/BIOS/powercfg/mạng/tunnel/production và không đóng issue #2.

**Trạng thái: đang điều tra, chưa sửa được phần cứng từ xa.**
