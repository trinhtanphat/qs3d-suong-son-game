# Read-only WHEA/PCIe readiness collector for DESKTOP-PHA1S90 (or another Windows host).
# NO reboot, driver change, service restart, device disable, or network reset.
param(
  [string]$OutputDirectory = "$env:TEMP\QS3D-PHA-Readonly-QA"
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$now=Get-Date
function Read-Whea([datetime]$since,[int]$maxCount) {
  try {
    return @(
      Get-WinEvent -FilterHashtable @{LogName='System';Id=17;StartTime=$since} -MaxEvents $maxCount -ErrorAction Stop |
      Where-Object {$_.ProviderName -eq 'Microsoft-Windows-WHEA-Logger'}
    )
  } catch {
    if($_.Exception.Message -match 'No events were found|matching the specified selection criteria') { return @() }
    throw
  }
}
$os=Get-CimInstance Win32_OperatingSystem
$computer=Get-CimInstance Win32_ComputerSystem
$bios=Get-CimInstance Win32_BIOS
$events15=@(Read-Whea ($now.AddMinutes(-15)) 2500)
$events120=@(Read-Whea ($now.AddHours(-2)) 6000)
$last24=@(Read-Whea ($now.AddHours(-24)) 1)
try {
  $unplanned=@(Get-WinEvent -FilterHashtable @{LogName='System';Id=41,6008;StartTime=$now.AddHours(-24)} -MaxEvents 50 -ErrorAction Stop)
} catch {
  if($_.Exception.Message -match 'No events were found|matching the specified selection criteria') {$unplanned=@()}else{throw}
}
$devices=@(
  Get-CimInstance Win32_PnPEntity |
  Where-Object { $_.PNPDeviceID -match 'VEN_8086&DEV_9D15|VEN_168C&DEV_0042' } |
  ForEach-Object {[ordered]@{Name=$_.Name;InstanceId=$_.PNPDeviceID;Status=$_.Status}}
)
$wifiDrivers=@(
  Get-CimInstance Win32_PnPSignedDriver |
  Where-Object {$_.DeviceName -match 'QCA9377'} |
  ForEach-Object {[ordered]@{DeviceName=$_.DeviceName;DriverVersion=$_.DriverVersion;DriverDate=$_.DriverDate;Manufacturer=$_.Manufacturer;InfName=$_.InfName}}
)
$wifi=@(
  Get-NetAdapter -ErrorAction SilentlyContinue |
  Where-Object {$_.InterfaceDescription -match 'QCA9377'} |
  ForEach-Object {[ordered]@{InterfaceAlias=$_.Name;Status=[string]$_.Status;LinkSpeed=[string]$_.LinkSpeed;InterfaceDescription=$_.InterfaceDescription}}
)
$last=$events15 | Select-Object -First 1
$snapshot=[ordered]@{
  device=$env:COMPUTERNAME
  collectedAt=$now.ToString('o')
  manufacturer=$computer.Manufacturer
  model=$computer.Model
  biosVersion=$bios.SMBIOSBIOSVersion
  osCaption=$os.Caption
  bootAt=$os.LastBootUpTime.ToString('o')
  uptimeHours=[math]::Round(($now-$os.LastBootUpTime).TotalHours,2)
  whea17Last15Min=$events15.Count
  whea17Last2H=$events120.Count
  last2HWindowPossiblyTruncated=($events120.Count -ge 6000)
  anyWhea17Last24H=($last24.Count -gt 0)
  lastWhea17Time=if($last){$last.TimeCreated.ToString('o')}else{$null}
  lastWhea17PciePort=if($last){([regex]::Match($last.Message,'PCI\\VEN_[0-9A-Fa-f]+&DEV_[0-9A-Fa-f]+')).Value}else{$null}
  unexpectedShutdownEvents24H=@($unplanned|ForEach-Object{[ordered]@{At=$_.TimeCreated.ToString('o');EventId=$_.Id}} )
  pciDevices=$devices
  wifiDrivers=$wifiDrivers
  wifiInterfaces=$wifi
  readinessGate=[ordered]@{
    minUptime24H=([math]::Round(($now-$os.LastBootUpTime).TotalHours,2) -ge 24)
    zeroWhea15M=($events15.Count -eq 0)
    zeroWhea2H=($events120.Count -eq 0)
    zeroWhea24H=($last24.Count -eq 0)
    zeroUnexpectedShutdown24H=($unplanned.Count -eq 0)
  }
  readOnly=$true
}
$snapshot.readinessGate['allChecksPass']=($snapshot.readinessGate.minUptime24H -and $snapshot.readinessGate.zeroWhea15M -and $snapshot.readinessGate.zeroWhea2H -and $snapshot.readinessGate.zeroWhea24H -and $snapshot.readinessGate.zeroUnexpectedShutdown24H)
if(!(Test-Path $OutputDirectory)) { [IO.Directory]::CreateDirectory($OutputDirectory) | Out-Null }
$dest=Join-Path $OutputDirectory ('whea-readonly-'+$env:COMPUTERNAME+'-'+$now.ToString('yyyyMMdd-HHmmss')+'.json')
$json=$snapshot|ConvertTo-Json -Depth 7
[IO.File]::WriteAllText($dest,$json,[Text.UTF8Encoding]::new($false))
Write-Output ('WHEA_READONLY_FILE='+$dest)
Write-Output ('WHEA_READONLY_WHEA15='+$events15.Count+' WHEA2H='+$events120.Count+' ANY24H='+($last24.Count -gt 0)+' UPTIME_HOURS='+$snapshot.uptimeHours+' GATE_PASS='+$snapshot.readinessGate.allChecksPass)
