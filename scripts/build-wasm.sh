#!/usr/bin/env bash
# Copyright (c) 2025 Vivian Burkhard Voss
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

echo "=== Building GBLN WASM Module with wasm-pack ==="
echo ""

# Ensure cargo/rustup are in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Check for wasm-pack
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

echo "Using wasm-pack version:"
wasm-pack --version

# Paths
WASM_CRATE="./rust-wasm"
OUTPUT_DIR="./pkg"

echo ""
echo "Building Rust WASM with wasm-bindgen..."

# Build for Node.js
echo "Building for Node.js..."
wasm-pack build "$WASM_CRATE" \
  --target nodejs \
  --out-dir "../pkg/nodejs" \
  --out-name gbln \
  --release

# Build for browser
echo "Building for browser..."
wasm-pack build "$WASM_CRATE" \
  --target web \
  --out-dir "../pkg/web" \
  --out-name gbln \
  --release

# Build for bundler (webpack, rollup, etc.)
echo "Building for bundler..."
wasm-pack build "$WASM_CRATE" \
  --target bundler \
  --out-dir "../pkg/bundler" \
  --out-name gbln \
  --release

echo ""
echo "✅ WASM builds complete!"
echo ""
echo "Output directories:"
echo "  - Node.js: pkg/nodejs/"
echo "  - Browser: pkg/web/"
echo "  - Bundler: pkg/bundler/"
echo ""
echo "File sizes:"
find pkg -name "*.wasm" -exec ls -lh {} \;
