#!/bin/bash
set -euo pipefail

# Install the audited dependency tree from the committed npm lockfile.
npm ci --include=dev
npm run build
