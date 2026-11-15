# PHA — Cổng nghiệm thu phần cứng chỉ đọc và kiểm thử

**Ngày:** 15/11/2026 (Asia/Ho_Chi_Minh)
**Thiết bị:** `DESKTOP-PHA1S90`, Dell Inspiron 3476
**Phạm vi:** [Issue #2 — lỗi WHEA PCIe Root Port #6/QCA9377](https://github.com/trinhtanphat/qs3d-suong-son-game/issues/2)

## Mục đích và giới hạn

`pha-readiness-verdict.ps1` đọc bản JSON do `pha-whea-readonly-collector.ps1` tạo ra để đánh giá các cổng *trước khi xét đóng issue*; không sửa registry, nguồn điện, driver, Wi-Fi, Ethernet, BIOS, lịch tác vụ, máy chủ hoặc hệ thống sản xuất.

**Không có chế độ tự động đóng issue.** Ngay cả khi tất cả cổng đạt, script trả `READY_FOR_MANUAL_ISSUE_REVIEW`, không phải `HARDWARE_REPAIRED` hay `100% COMPLETE`. Người nghiệm thu phải đối chiếu minh chứng sửa chữa và kiểm tra thực tế.

### Điều kiện bắt buộc

- Dữ liệu thuộc đúng `DESKTOP-PHA1S90`, được collector đánh dấu read-only, timestamp không nằm trong tương lai quá 2 phút và không cũ hơn 15 phút (có thể chỉnh ngưỡng 1–60 phút).
- Thời gian hoạt động tính từ `bootAt` đến `collectedAt` ít nhất 24 giờ, không dùng số giờ đã làm tròn.
- Không WHEA 17 trong 15 phút, 2 giờ, **hoặc 24 giờ**; không có shutdown bất thường 41/6008 trong 24 giờ; truy vấn WHEA hai giờ chưa vượt giới hạn `MaxEvents`.
- Đường khôi phục truy cập vật lý độc lập đã được người vận hành **thực sự kiểm chứng**, có tham chiếu bằng chứng (không suy ra chỉ từ `Tailscale Up`).
- Có xác nhận sửa chữa nguyên nhân phần cứng và tham chiếu biên bản; xác nhận QA phần cứng sau sửa và đường dẫn báo cáo.

**Lưu ý:** cờ xác nhận thủ công và chuỗi tham chiếu chỉ là khai báo của người vận hành, không phải chữ ký số hoặc chứng minh tự động; dữ liệu Event Log có thể thiếu khi log bị xóa, ghi đè hoặc không đủ retention. Vì vậy vẫn cần kiểm tra trực tiếp.

## Lệnh sử dụng

Trên PHA, sau khi có đường mạng dự phòng và sửa xong phần cứng, chạy collector sẵn có trong kho (nó chỉ đọc hệ thống và ghi JSON vào thư mục do người vận hành chọn):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\docs\evidence\2026-11-14-v112-production\pha-whea-readonly-collector.ps1" -OutputDirectory ".\pha-readonly-snapshots"
```

Chạy thử verdict **không có các xác nhận thủ công**; kết quả bắt buộc còn bị chặn:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\docs\evidence\2026-11-15-pha\pha-readiness-verdict.ps1" -EvidencePath ".\pha-readonly-snapshots\whea-readonly-DESKTOP-PHA1S90-YYYYMMDD-HHMMSS.json"
```

**Chỉ khi đã có toàn bộ bằng chứng thật**, người kiểm tra mới thêm xác nhận sau:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\docs\evidence\2026-11-15-pha\pha-readiness-verdict.ps1" -EvidencePath ".\pha-readonly-snapshots\whea-readonly-DESKTOP-PHA1S90-YYYYMMDD-HHMMSS.json" -IndependentRecoveryVerified -RecoveryEvidenceReference "evidence/ethernet-failover.txt" -OnsiteRepairVerified -RepairEvidenceReference "evidence/repair-ticket.pdf" -HardwareQaVerified -QaEvidenceReference "evidence/gpu-webgl-qa.json"
```

Các chuỗi tham chiếu ví dụ ở trên **không phải tài liệu đã tồn tại**. Không dùng cờ xác nhận trước khi có bằng chứng tương ứng.

## Thử nghiệm tự động trên WIN11-181

`pha-readiness-verdict.test.ps1` tạo các fixture **giả lập**, không chạm PHA hay production, kiểm tra 16 tình huống: chỉ PASS khi các cổng và chứng cứ thủ công đầy đủ; thiếu nguồn/trễ log/WHEA/reboot/thiếu recovery/mẫu khác host không được PASS; **không auto-close issue**.

Lệnh:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\docs\evidence\2026-11-15-pha\pha-readiness-verdict.test.ps1"
```

Kết quả: **16/16 PASS** sau khi sửa bộ test để xử lý đúng trường hợp Windows PowerShell ghi lỗi dự kiến ra stderr; bộ hồi quy game kèm theo **13/13 PASS**. Không có thay đổi mã ứng dụng.

### Đã chạy với dữ liệu PHA thật

Bản ghi `pha-readiness-live-20261115.json` lấy trực tiếp qua lệnh chỉ đọc trên PHA lúc **09:14:35+07:00**:

| Chỉ số | Kết quả |
| --- | ---: |
| Boot | 08:45:33+07:00 |
| Uptime tại thời điểm lấy snapshot | 0,48 giờ |
| WHEA 17 / 15 phút | 75 |
| WHEA 17 / 2 giờ | 562 |
| Có WHEA 17 trong 24 giờ | Có |
| Event 41/6008 trong 24 giờ | 13 |
| Wi-Fi | Up |
| Ethernet | Disconnected |
| Verdict mặc định | **`BLOCKED_NOT_VERIFIED`** |

**Lưu ý:** tổng WHEA 562/2 giờ bao trùm nhiều lần boot, không đồng nghĩa 562 lỗi từ 08:45. Mức WHEA 15 phút tiếp tục thay đổi theo cửa sổ quan sát.

SHA-256 snapshot: `2C6FB5570281B141BE622A1D7DC8A06812B4C8A6F8BCFFD1AA6B3CEEB048588D`. Cổng đánh giá với snapshot thật vừa lấy (tuổi dữ liệu 0,28 phút lúc chạy) vẫn bị chặn bởi chưa đủ uptime, còn WHEA/reboot, và thiếu minh chứng sửa chữa/đường khôi phục/QA.

## Điều kiện ngoại tuyến chưa được hoàn thành

Cần kết nối Ethernet vật lý hoặc kênh quản trị dự phòng thật sự độc lập, có người đứng cạnh PHA và kiểm tra bộ sạc/pin bằng Dell F12 ePSA, sau đó khoanh vùng/thay sửa phần cứng PCIe/WLAN theo kết quả. **Không chạy stress GPU hoặc reset Wi-Fi từ xa trong lúc máy liên tục reboot.**

Issue #2 **giữ mở** cho đến khi có biên bản sửa chữa và kiểm chứng 24 giờ vận hành không lỗi. Tài liệu và công cụ nghiệm thu này không đại diện cho việc sửa được phần cứng.
