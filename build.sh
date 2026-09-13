#!/bin/bash
set -euo pipefail

# Netlify provides the Node version pinned in netlify.toml.
# Use the same lockfile and build command as local mise tasks.
npm ci --include=dev
npm run build
