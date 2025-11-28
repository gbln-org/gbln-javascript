#!/usr/bin/env bash
# Copyright (c) 2025 Vivian Burkhard Voss
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

echo "=== Building GBLN WASM Module ==="
echo ""

# Check for emscripten
if ! command -v emcc &> /dev/null; then
    echo "❌ Emscripten not found. Please install:"
    echo "   git clone https://github.com/emscripten-core/emsdk.git"
    echo "   cd emsdk && ./emsdk install latest && ./emsdk activate latest"
    echo "   source ./emsdk_env.sh"
    exit 1
fi

echo "Using Emscripten version:"
emcc --version | head -1

# Paths
FFI_DIR="../../core/ffi"
BUILD_DIR="./build"
OUTPUT_DIR="./dist/wasm"

mkdir -p "$BUILD_DIR"
mkdir -p "$OUTPUT_DIR"

echo ""
echo "Compiling C FFI to WASM..."

# Compile C FFI to WASM
# - Use Rust's staticlib output as input
# - Export all gbln_* functions
# - Enable optimization (-O3)
# - Target both Node.js and browser
emcc \
  -I"$FFI_DIR/include" \
  "$FFI_DIR/target/release/libgbln.a" \
  -o "$OUTPUT_DIR/gbln.js" \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_gbln_parse", "_gbln_to_string", "_gbln_to_string_pretty", "_gbln_value_free", "_gbln_string_free", "_gbln_get_error_message", "_gbln_value_type", "_gbln_object_keys", "_gbln_object_len", "_gbln_keys_free", "_gbln_value_new_i8", "_gbln_value_new_i16", "_gbln_value_new_i32", "_gbln_value_new_i64", "_gbln_value_new_u8", "_gbln_value_new_u16", "_gbln_value_new_u32", "_gbln_value_new_u64", "_gbln_value_new_f32", "_gbln_value_new_f64", "_gbln_value_new_str", "_gbln_value_new_bool", "_gbln_value_new_null", "_gbln_value_new_object", "_gbln_object_insert", "_gbln_value_new_array", "_gbln_array_push", "_malloc", "_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "UTF8ToString", "stringToUTF8", "lengthBytesUTF8"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME='createGblnModule' \
  -s ENVIRONMENT='web,node' \
  -O3 \
  --no-entry

echo "✅ WASM compiled: $OUTPUT_DIR/gbln.wasm"
echo "✅ JS glue code: $OUTPUT_DIR/gbln.js"

# Show file sizes
echo ""
echo "File sizes:"
ls -lh "$OUTPUT_DIR"/*.wasm "$OUTPUT_DIR"/*.js

echo ""
echo "✅ WASM build complete!"
