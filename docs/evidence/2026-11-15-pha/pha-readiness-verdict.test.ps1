# Deterministic tests for the read-only PHA acceptance verdict (synthetic fixtures only).
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$script=Join-Path $PSScriptRoot 'pha-readiness-verdict.ps1'
$tmp=Join-Path $env:TEMP ('qs3d-pha-verdict-tests-'+[guid]::NewGuid().ToString('n'))
[IO.Directory]::CreateDirectory($tmp)|Out-Null
$script:successes=0
$script:failures=0
function TestCase([string]$name,[bool]$actual,[bool]$expected){
 if($actual -eq $expected){$script:successes++;Write-Output ('PASS '+$name)}
 else{$script:failures++;Write-Output ('FAIL '+$name+' actual='+$actual+' expected='+$expected)}
}
$now=[datetimeoffset]::Now
function New-Sample {
 return [ordered]@{
  device='DESKTOP-PHA1S90'
  collectedAt=$now.AddMinutes(-1).ToString('o')
  bootAt=$now.AddHours(-26).ToString('o')
  whea17Last15Min=0
  whea17Last2H=0
  anyWhea17Last24H=$false
  unexpectedShutdownEvents24H=@()
  last2HWindowPossiblyTruncated=$false
  readOnly=$true
 }
}
function Evaluate($sample,[bool]$manual) {
 $path=Join-Path $tmp 'fixture.json'
 $sample|ConvertTo-Json -Depth 5|Set-Content -Path $path -Encoding utf8
 $arguments=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$script,'-EvidencePath',$path)
 if($manual){$arguments+=@('-IndependentRecoveryVerified','-OnsiteRepairVerified','-HardwareQaVerified','-RecoveryEvidenceReference','onsite-ethernet-test','-RepairEvidenceReference','ticket-hardware-repair','-QaEvidenceReference','qa-session-log')}
 $raw=(& powershell.exe @arguments 2>&1 | Out-String)
 if($LASTEXITCODE -ne 0){throw ('Unexpected script failure: '+$raw)}
 return ($raw|ConvertFrom-Json)
}
try {
 $s=New-Sample
 $v=Evaluate $s $true
 TestCase 'passes only with complete synthetic 24-hour evidence and manual signoffs' ($v.status -eq 'READY_FOR_MANUAL_ISSUE_REVIEW') $true
 TestCase 'never automatically closes issue' ([bool]$v.issueCanBeAutoClosed) $false
 $v=Evaluate (New-Sample) $false
 TestCase 'default gate blocks absent onsite attestations' ($v.status -eq 'BLOCKED_NOT_VERIFIED') $true
 TestCase 'default gate names recovery requirement' ('independentRecoveryVerified' -in $v.failedChecks) $true
 $s=New-Sample;$s.bootAt=$now.AddHours(-23).ToString('o')
 TestCase 'uptime under 24 hours blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample;$s.whea17Last15Min=1
 TestCase 'one WHEA in 15 minutes blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample;$s.whea17Last2H=1
 TestCase 'one WHEA in 2 hours blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample;$s.anyWhea17Last24H=$true
 TestCase 'one WHEA in 24 hours blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample;$s.unexpectedShutdownEvents24H=@(@{EventId=41;At=$now.AddMinutes(-3).ToString('o')})
 TestCase 'abnormal shutdown blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample;$s.last2HWindowPossiblyTruncated=$true
 TestCase 'truncated WHEA window blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample;$s.collectedAt=$now.AddHours(-2).ToString('o')
 TestCase 'stale snapshot blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample;$s.collectedAt=$now.AddMinutes(10).ToString('o')
 TestCase 'future-dated snapshot blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample;$s.device='WRONGHOST'
 TestCase 'wrong device blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample;$s.readOnly=$false
 TestCase 'non-read-only source blocks' ((Evaluate $s $true).status -eq 'BLOCKED_NOT_VERIFIED') $true
 $s=New-Sample
 $file=Join-Path $tmp 'fixture.json'
 $s|ConvertTo-Json -Depth 5|Set-Content -Path $file -Encoding utf8
 $arguments=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$script,'-EvidencePath',$file,'-IndependentRecoveryVerified','-OnsiteRepairVerified','-HardwareQaVerified','-RepairEvidenceReference','ticket','-QaEvidenceReference','qa')
 $raw=(& powershell.exe @arguments 2>&1|Out-String)
 if($LASTEXITCODE -ne 0){throw ('Expected blocking without recovery reference: '+$raw)}
 $v=$raw|ConvertFrom-Json
 TestCase 'attestation without supporting reference blocks' ('independentRecoveryVerified' -in $v.failedChecks) $true
 $s=New-Sample;$s.Remove('anyWhea17Last24H')
 $s|ConvertTo-Json -Depth 5|Set-Content -Path $file -Encoding utf8
 $previousPreference=$ErrorActionPreference
 $ErrorActionPreference='Continue'
 try {$raw=(& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script -EvidencePath $file 2>&1|Out-String);$invalidEvidenceRejected=($LASTEXITCODE -ne 0)}
 finally {$ErrorActionPreference=$previousPreference}
 TestCase 'missing required evidence fails closed' $invalidEvidenceRejected $true
}finally{
 if(Test-Path $tmp){Remove-Item -LiteralPath $tmp -Recurse -Force}
}
Write-Output ('QA_TOTAL='+($script:successes+$script:failures)+' PASS='+$script:successes+' FAIL='+$script:failures)
if($script:failures -gt 0){exit 1}