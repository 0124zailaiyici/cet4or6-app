#!/bin/bash
cd /opt/cet4
mkdir -p audio
TOKEN=$(openssl rand -hex 16 2>/dev/null || node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
cat > .env << ENVEOF
DEEPSEEK_API_KEY=not-set-yet
API_ACCESS_TOKEN=${TOKEN}
PORT=3001
ENVEOF
echo "Token: ${TOKEN}"
