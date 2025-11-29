#!/bin/bash
set -e

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for this session
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Install dependencies and build
bun install
bun run build
