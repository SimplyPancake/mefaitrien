#!/bin/sh
set -e

echo "Running Prisma migrations..."
(cd /opt/prisma && node node_modules/prisma/build/index.js migrate deploy)

echo "Starting Nuxt..."
exec node .output/server/index.mjs