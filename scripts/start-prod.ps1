$root = (Get-Location).Path
$env:LOCAL_DATA_DIR = "$root\.data\local-final"
$env:NODE_ENV = "production"
$env:PORT = "3000"
$env:HOSTNAME = "127.0.0.1"
$env:ALLOW_EMBEDDED_DATABASE = "true"
node .next/standalone/server.js
