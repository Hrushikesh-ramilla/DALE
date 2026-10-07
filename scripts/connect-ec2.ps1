# Open an IAM-authorized SSM tunnel to the existing instance. No inbound SSH rule is required.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^i-[0-9a-f]{8,17}$')]
    [string]$InstanceId,
    [ValidatePattern('^[a-z]{2}-[a-z]+-[0-9]+$')]
    [string]$Region = 'ap-south-1',
    [string]$Profile,
    [ValidateRange(1024, 65535)]
    [int]$LocalPort = 2222
)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) { throw 'Install AWS CLI v2 first.' }
if (-not (Get-Command session-manager-plugin -ErrorAction SilentlyContinue)) { throw 'Install the AWS Session Manager plugin first.' }
$awsArguments = @('--region', $Region)
if ($Profile) { $awsArguments += @('--profile', $Profile) }
# Authenticate without writing account IDs or credentials to output.
& aws @awsArguments sts get-caller-identity --output json 1>$null
if ($LASTEXITCODE -ne 0) { throw 'AWS login is required. Use your configured AWS SSO profile; do not paste access keys.' }
$status = & aws @awsArguments ssm describe-instance-information --filters "Key=InstanceIds,Values=$InstanceId" --query 'InstanceInformationList[0].PingStatus' --output text
if ($LASTEXITCODE -ne 0 -or $status.Trim() -ne 'Online') { throw 'The instance is not an online SSM managed node, or the AWS identity lacks access. Check its instance role, agent and outbound HTTPS.' }
# AWS shorthand avoids embedded JSON quote differences between Windows PowerShell and pwsh.
$parameters = "portNumber=22,localPortNumber=$LocalPort"
Write-Host "Opening a localhost:$LocalPort tunnel. Keep this terminal open; Ctrl+C closes it."
& aws @awsArguments ssm start-session --target $InstanceId --document-name AWS-StartPortForwardingSession --parameters $parameters
if ($LASTEXITCODE -ne 0) { throw 'SSM tunnel ended with an error. Check session permissions and agent logs.' }
