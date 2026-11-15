# PHA hardware issue #2 acceptance verdict. Reads a previously captured JSON snapshot only.
# It NEVER changes adapters, drivers, BIOS, tasks, services, power settings or production.
param(
  [Parameter(Mandatory = $true)][string]$EvidencePath,
  [switch]$IndependentRecoveryVerified,
  [switch]$OnsiteRepairVerified,
  [switch]$HardwareQaVerified,
  [string]$RecoveryEvidenceReference = '',
  [string]$RepairEvidenceReference = '',
  [string]$QaEvidenceReference = '',
  [int]$FreshnessMinutes = 15
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if($FreshnessMinutes -lt 1 -or $FreshnessMinutes -gt 60){throw 'FreshnessMinutes must be between 1 and 60.'}
$resolved=(Resolve-Path -LiteralPath $EvidencePath -ErrorAction Stop).Path
$evidence=Get-Content -LiteralPath $resolved -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
$required=@('device','collectedAt','bootAt','whea17Last15Min','whea17Last2H','anyWhea17Last24H','unexpectedShutdownEvents24H','last2HWindowPossiblyTruncated','readOnly')
foreach($name in $required){
  if(-not ($evidence.PSObject.Properties.Name -contains $name)){throw ('Missing snapshot field: '+$name)}
}
$captured=[datetimeoffset]::Parse([string]$evidence.collectedAt)
$boot=[datetimeoffset]::Parse([string]$evidence.bootAt)
$now=[datetimeoffset]::Now
$age=($now-$captured).TotalMinutes
$uptime=($captured-$boot).TotalHours
$unexpected=@($evidence.unexpectedShutdownEvents24H)
$checks=[ordered]@{
  expectedDevice=([string]$evidence.device -eq 'DESKTOP-PHA1S90')
  trustedReadOnlySnapshot=([bool]$evidence.readOnly)
  snapshotFresh=($age -ge -2 -and $age -le $FreshnessMinutes)
  uptimeAtLeast24h=($uptime -ge 24)
  noWhea15m=([int]$evidence.whea17Last15Min -eq 0)
  noWhea2h=([int]$evidence.whea17Last2H -eq 0)
  noWhea24h=(-not [bool]$evidence.anyWhea17Last24H)
  noAbnormalShutdown24h=($unexpected.Count -eq 0)
  completeWhea2hWindow=(-not [bool]$evidence.last2HWindowPossiblyTruncated)
  independentRecoveryVerified=($IndependentRecoveryVerified.IsPresent -and -not [string]::IsNullOrWhiteSpace($RecoveryEvidenceReference))
  actualOnsiteRepairVerified=($OnsiteRepairVerified.IsPresent -and -not [string]::IsNullOrWhiteSpace($RepairEvidenceReference))
  postRepairHardwareQaVerified=($HardwareQaVerified.IsPresent -and -not [string]::IsNullOrWhiteSpace($QaEvidenceReference))
}
$failed=@($checks.GetEnumerator() | Where-Object {-not $_.Value} | ForEach-Object {$_.Key})
$status=if($failed.Count -eq 0){'READY_FOR_MANUAL_ISSUE_REVIEW'}else{'BLOCKED_NOT_VERIFIED'}
$result=[ordered]@{
  device=[string]$evidence.device
  evaluatedAt=$now.ToString('o')
  snapshotAt=$captured.ToString('o')
  snapshotAgeMinutes=[math]::Round($age,2)
  observedUptimeHours=[math]::Round($uptime,2)
  status=$status
  issueCanBeAutoClosed=$false
  checks=$checks
  failedChecks=$failed
  references=[ordered]@{
    recovery=$RecoveryEvidenceReference
    repair=$RepairEvidenceReference
    hardwareQa=$QaEvidenceReference
  }
  readOnly=$true
}
$result|ConvertTo-Json -Depth 7
