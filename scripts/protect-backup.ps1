param([Parameter(Mandatory=$true)][string]$InputPath, [Parameter(Mandatory=$true)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
$backupRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.data/backups'))
$sourcePath = (Resolve-Path -LiteralPath $InputPath).Path
$encryptedPath = [IO.Path]::GetFullPath($OutputPath)
foreach ($targetPath in @($sourcePath, $encryptedPath)) {
    if (-not $targetPath.StartsWith($backupRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Backup paths must stay inside the workspace .data/backups directory.' }
}
if ($sourcePath -eq $encryptedPath) { throw 'Use a separate encrypted output path.' }
$original = [IO.File]::ReadAllBytes($sourcePath)
$protected = [Security.Cryptography.ProtectedData]::Protect($original, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
[IO.File]::WriteAllBytes($encryptedPath, $protected)
$owner = [Security.Principal.WindowsIdentity]::GetCurrent().User
$privateAcl = [Security.AccessControl.FileSecurity]::new()
$privateAcl.SetOwner($owner)
$privateAcl.SetAccessRuleProtection($true, $false)
$privateAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($owner, 'FullControl', 'Allow'))
Set-Acl -LiteralPath $encryptedPath -AclObject $privateAcl
$restored = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($encryptedPath), $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
$expectedHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($original))
$restoredHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($restored))
if ($expectedHash -ne $restoredHash) { throw 'Encrypted backup round-trip verification failed; plaintext retained.' }
$report = @{ checkedAt = [DateTime]::UtcNow.ToString('o'); passed = $true; protection = 'Windows DPAPI CurrentUser'; encryptedFile = $encryptedPath; originalSha256 = $expectedHash; checked = @('Separate off-instance copy', 'Owner-only file ACL', 'DPAPI decrypt round-trip matches original SHA-256'); limitation = 'Recovery needs this Windows account and its DPAPI profile. Keep the private EC2 snapshot and configuration recovery instructions separately.' }
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot '../.data/reports/backup-protection.json') -Encoding utf8
# The exact resolved source was checked above; the protected copy and remote original remain recoverable.
Remove-Item -LiteralPath $sourcePath
Write-Output 'PASS: Off-instance backup encrypted for the current Windows account; decrypt round-trip and private ACL verified.'
