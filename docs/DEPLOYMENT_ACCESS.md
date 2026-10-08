# Stable access to the existing EC2 instance

Current verified release: 69ac213 deployed through the pinned single-connection installer; checksum/backup, public build identity and observed upgrade/restart persistence pass. The existing snap SSM agent is active. AWS instance-role and local account authorization remain unverified; `--ssm-port` is implemented for the authenticated tunnel once that account setup is available. Deployment succeeded, but intermittent inbound SSH remains an operational limitation. The dated notes below preserve earlier attempts.

8 October: application 2c9b845 deployed successfully using the one-connection stream. Checksum verification, protected pre-upgrade snapshots, service activation, public HTTPS, the expected BUILD_ID and actual app/worker restart persistence pass. This successful SSH session does not establish a stable permanent connection; the SSM setup below remains pending.

7 October recovery: direct SSH became reachable again. The original OneDrive/Desktop key was rejected for broad local file permissions; the existing owner-restricted ignored copy at `.data/deploy/ssh-key.pem` works. Reuse that copy for deployment rather than reintroducing broad key access. This fixes local OpenSSH key loading, not the changing-IP architecture. SSM still requires the one-time authenticated AWS/IAM setup below.

`node scripts/deploy-existing-ec2.mjs <unique-release-id>` streams the prepared release/private configuration and runs the checksum/backup/rollback installer over one pinned SSH connection. It avoids opening a separate SCP connection after a successful SSH check. The transfer bundle streams through process pipes; no extra environment archive is written to disk. The connection still requires the current SSH source to be allowed; it is not a substitute for SSM.

The sourced-agent release's 7 October upload remained blocked by subsequent SSH timeouts. One successful read-only connection does not establish a deployed release. No installer, backup or rollback was executed during that attempt; do not infer hosted verification from local tests.

The local VPN has returned multiple egress IPv4 addresses while public HTTPS continues to work and new SSH connections time out. This is consistent with restricted inbound SSH plus changing egress. HTTP IP services do not establish the precise source address of an SSH connection; changing allowlist entries is therefore not a durable diagnosis or deployment method.

## Mechanism

Use AWS Systems Manager (SSM). Its instance agent connects outward to AWS over HTTPS. IAM authorizes administrative access; no deployment-machine IP allowlist or inbound port 22 is required. Keep the existing public HTTP/HTTPS configuration for the storefront. Session Manager provides interactive access; Run Command can execute release installation and health checks.

AWS documents [Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html), [prerequisites](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-prerequisites.html) and [Run Command](https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command.html). Run Command has no additional service charge. Use this instance's existing internet access; provisioning a NAT gateway, VPC endpoints, extra instances or paid logging is outside the authorized scope.

## One-time account setup

1. In EC2 in `ap-south-1`, select the existing instance at `16.4.25.181`. Record its `i-...` instance ID. Under Actions → Security → Modify IAM role, attach an EC2 instance role containing `AmazonSSMManagedInstanceCore`. Preserve any required existing permissions; do not replace an existing role blindly.
2. Verify SSM Agent is installed and running. Ubuntu images may already include it. In an existing owner SSH session, check `sudo snap services amazon-ssm-agent` or `sudo systemctl status amazon-ssm-agent`. Follow AWS's Ubuntu installation instructions if missing. Do not reboot a working application merely to activate access.
3. Keep outbound HTTPS available to `ssm.ap-south-1.amazonaws.com` and `ssmmessages.ap-south-1.amazonaws.com`, plus any endpoints required by the installed agent. Check the EC2 Connect → Session Manager tab or Systems Manager managed nodes until this instance is Online.
4. Configure a local AWS CLI login, preferably IAM Identity Center/SSO, with access restricted to this instance and the necessary SSM session documents. Do not grant account-wide AdministratorAccess for deployment. Do not commit AWS credentials. Install the Session Manager CLI plugin.

No authenticated AWS CLI session is currently available in this workspace; the instance's role and SSM status are not yet verified. The owner must provide account access or complete the one-time console setup. This is an external configuration gate, not an implemented cloud connection.

## Existing release tooling through SSM

Run in one PowerShell terminal:

```powershell
./scripts/connect-ec2.ps1 -InstanceId i-REPLACE_WITH_ACTUAL_ID -Profile YOUR_SSO_PROFILE
```

The script checks login and node status, then opens an SSM port-forwarding session to the instance's SSH service on localhost:2222. It preserves the existing key and pinned SSH host identity while removing dependence on inbound network access. In another terminal:

```powershell
ssh -p 2222 -o HostKeyAlias=ec2-16-4-25-181.ap-south-1.compute.amazonaws.com -o StrictHostKeyChecking=yes -i ".data/deploy/ssh-key.pem" ubuntu@127.0.0.1
```

Keep that tunnel terminal open and deploy the existing packaged release in another terminal:

```powershell
node scripts/deploy-existing-ec2.mjs dale-RELEASE_ID --ssm-port 2222
```

This uses the same pinned instance host identity, private key, one-stream transfer, checksum verification, pre-upgrade snapshots and rollback installer through loopback. The script accepts only a validated local tunnel port and does not add an inbound rule. Private configuration stays outside release archives and source control. Verify readiness, public TLS, served BUILD_ID, app/worker restart and browser journeys before declaring a hosted release complete. Tunnel transport is syntax/input-checked locally; an authenticated SSM deployment still requires the owner's instance/account setup and has not yet been exercised.

The script is prepared locally; an authenticated tunnel and hosted release have not yet been exercised. Once SSM access passes, deployment no longer requires new local-IP SSH rules. Retain owner recovery access until the replacement path is verified.

## Subsequent automated release path

Extend the existing GitHub quality/container checks with an explicitly authorized release job: build on a hosted runner, authenticate to AWS using GitHub OIDC with a short-lived role restricted to this repository/environment and instance, deliver a checksum-verified release, install through SSM Run Command and verify hosted health/build. Retain the previous release for rollback. Release artifact delivery needs an agreed private mechanism; do not publish environment files or introduce paid storage without authorization.

This CI deployment is a next operational milestone, not an existing configured workflow. A GitHub-hosted runner connecting directly over SSH would still have changing IPs and would repeat the underlying problem. Do not install a public pull-request runner on the production EC2 host.
