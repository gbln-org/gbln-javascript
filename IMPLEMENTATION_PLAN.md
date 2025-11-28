# JavaScript/TypeScript Bindings - Implementation Plan

**Created**: 2025-11-28
**Status**: Planning Phase
**Ticket**: #101

---

## Overview

This document provides a step-by-step implementation plan for JavaScript/TypeScript bindings using WASM compiled from C FFI.

**Architecture**: Rust Core → C FFI → Emscripten → WASM → JavaScript Wrapper → User API

---

## Prerequisites

### Tools Required
1. **Emscripten SDK** (latest)
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. **Node.js** ≥18.0.0
3. **TypeScript** ≥5.2.0
4. **Rust toolchain** (already installed for C FFI)

### Dependencies
- C FFI library from `core/ffi` (already built)
- All 15+ C FFI extension functions (Ticket #005B)

---

## Implementation Phases

### Phase 1: Emscripten Build Setup (2-3 hours)

**Goal**: Compile C FFI to WASM

**Steps**:
1. Create `scripts/build-wasm.sh` ✅ (DONE)
2. Configure Emscripten exports:
   - All `gbln_*` functions from #005B
   - Memory management functions (`malloc`, `free`)
   - Runtime methods (`ccall`, `cwrap`, `UTF8ToString`)
3. Build static library from Rust FFI:
   ```bash
   cd ../../core/ffi
   cargo build --release --lib
   ```
4. Compile to WASM:
   ```bash
   emcc -I include target/release/libgbln.a -o dist/wasm/gbln.js
   ```
5. Optimize WASM size (target: <300 KB)
6. Test WASM loads in Node.js and browser

**Output**:
- `dist/wasm/gbln.wasm` (<300 KB)
- `dist/wasm/gbln.js` (glue code)

**Files**:
- ✅ `scripts/build-wasm.sh`
- `scripts/check-wasm-size.sh`

---

### Phase 2: WASM Wrapper Layer (4-5 hours)

**Goal**: JavaScript wrapper around WASM C functions

**Steps**:
1. Create `src/wasm/loader.ts`:
   - Load WASM module (Node.js + browser)
   - Initialize Emscripten module
   - Export wrapped functions

2. Create `src/ffi/bindings.ts`:
   - Wrap all C FFI functions
   - Handle pointer conversion (JS ↔ WASM)
   - Memory management helpers

3. Create `src/ffi/memory.ts`:
   - `allocateString()` - JS string → WASM memory
   - `readString()` - WASM pointer → JS string
   - `freePointer()` - Free WASM memory
   - Automatic cleanup with FinalizationRegistry

**Functions to wrap** (from #005B):
```typescript
// Core parsing/serialization
function wasmParse(input: string): WasmPointer
function wasmToString(value: WasmPointer): string
function wasmToStringPretty(value: WasmPointer): string

// Memory management
function wasmValueFree(value: WasmPointer): void
function wasmStringFree(str: WasmPointer): void

// Type introspection
function wasmValueType(value: WasmPointer): number

// Object operations
function wasmObjectKeys(value: WasmPointer): string[]
function wasmObjectLen(value: WasmPointer): number
function wasmObjectGet(value: WasmPointer, key: string): WasmPointer

// Array operations
function wasmArrayLen(value: WasmPointer): number
function wasmArrayGet(value: WasmPointer, index: number): WasmPointer

// Value constructors (15 functions)
function wasmValueNewI8(value: number): WasmPointer
// ... i16, i32, i64, u8, u16, u32, u64, f32, f64
function wasmValueNewStr(value: string, maxLen: number): WasmPointer
function wasmValueNewBool(value: boolean): WasmPointer
function wasmValueNewNull(): WasmPointer

// Builders
function wasmValueNewObject(): WasmPointer
function wasmObjectInsert(obj: WasmPointer, key: string, value: WasmPointer): void
function wasmValueNewArray(): WasmPointer
function wasmArrayPush(arr: WasmPointer, value: WasmPointer): void
```

**Files**:
- `src/wasm/loader.ts`
- `src/ffi/bindings.ts`
- `src/ffi/memory.ts`

---

### Phase 3: Value Conversion Layer (5-6 hours)

**Goal**: Bidirectional conversion between JS and GBLN

**Pattern** (from Python #100):
```typescript
// GBLN → JavaScript
function gblnToJs(value: WasmPointer): unknown {
  const type = wasmValueType(value)
  
  switch (type) {
    case GblnValueType.I8:
    case GblnValueType.I16:
    // ... extract primitives
    
    case GblnValueType.OBJECT:
      // Use wasmObjectKeys() + iterate
      
    case GblnValueType.ARRAY:
      // Use wasmArrayLen() + iterate
  }
}

// JavaScript → GBLN
function jsToGbln(value: unknown): WasmPointer {
  if (value === null) return wasmValueNewNull()
  if (typeof value === 'boolean') return wasmValueNewBool(value)
  if (typeof value === 'number') {
    // Auto-select smallest type
    if (Number.isInteger(value)) {
      if (value >= -128 && value <= 127) return wasmValueNewI8(value)
      // ... i16, i32, i64, u8, u16, u32, u64
    }
    return wasmValueNewF64(value)
  }
  if (typeof value === 'string') {
    // Auto-select string size
    const len = value.length
    const maxLen = len <= 64 ? 64 : len <= 256 ? 256 : 1024
    return wasmValueNewStr(value, maxLen)
  }
  if (Array.isArray(value)) {
    const arr = wasmValueNewArray()
    for (const item of value) {
      const gblnItem = jsToGbln(item)
      wasmArrayPush(arr, gblnItem)
    }
    return arr
  }
  if (typeof value === 'object') {
    const obj = wasmValueNewObject()
    for (const [key, val] of Object.entries(value)) {
      const gblnVal = jsToGbln(val)
      wasmObjectInsert(obj, key, gblnVal)
    }
    return obj
  }
}
```

**Files**:
- `src/api/convert.ts` (conversion logic)
- `src/types/value.ts` (GblnValueType enum)

---

### Phase 4: High-Level API (3-4 hours)

**Goal**: User-facing API

**Implementation**:

```typescript
// src/api/parse.ts
export function parse(gblnString: string): unknown {
  const ptr = wasmParse(gblnString)
  try {
    return gblnToJs(ptr)
  } finally {
    wasmValueFree(ptr)
  }
}

// src/api/serialise.ts
export function toString(value: unknown): string {
  const ptr = jsToGbln(value)
  try {
    const strPtr = wasmToString(ptr)
    const result = readString(strPtr)
    wasmStringFree(strPtr)
    return result
  } finally {
    wasmValueFree(ptr)
  }
}

export function toStringPretty(value: unknown, indent = 2): string {
  // Similar to toString but uses wasmToStringPretty
}
```

**Files**:
- `src/api/parse.ts`
- `src/api/serialise.ts`
- `src/index.ts` (main entry point)

---

### Phase 5: Error Handling (2-3 hours)

**Goal**: Custom error classes

```typescript
// src/errors/base.ts
export class GblnError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GblnError'
  }
}

export class ParseError extends GblnError {
  constructor(message: string, public line?: number, public column?: number) {
    super(message)
    this.name = 'ParseError'
  }
}

export class ValidationError extends GblnError {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

**Files**:
- `src/errors/base.ts`
- `src/errors/parse.ts`
- `src/errors/validation.ts`

---

### Phase 6: TypeScript Definitions (2 hours)

**Goal**: Full type safety

```typescript
// src/types/config.ts
export interface GblnConfig {
  miniMode?: boolean
  compress?: boolean
  compressionLevel?: number
  indent?: number
  stripComments?: boolean
}

// src/types/api.ts
export function parse(input: string): unknown
export function toString(value: unknown): string
export function toStringPretty(value: unknown, indent?: number): string
```

**Files**:
- `src/types/config.ts`
- `src/types/api.ts`
- `src/types/value.ts`
- `dist/index.d.ts` (generated)

---

### Phase 7: Testing (6-8 hours)

**Goal**: 44+ tests minimum (from Python reference)

**Test Structure**:
```
tests/
├── wasm/
│   └── loader.test.ts        # WASM loading
├── ffi/
│   ├── bindings.test.ts      # FFI function wrapping
│   └── memory.test.ts        # Memory management
├── api/
│   ├── parse.test.ts         # Parsing tests
│   ├── serialise.test.ts     # Serialization tests
│   └── convert.test.ts       # Conversion tests
└── integration/
    ├── primitives.test.ts    # All 13 GBLN types
    ├── objects.test.ts       # Object parsing/creation
    ├── arrays.test.ts        # Array parsing/creation
    ├── roundtrip.test.ts     # Parse → serialize → parse
    └── errors.test.ts        # Error handling
```

**Test Categories** (from Python #100):
1. ✅ WASM Loading (module loads in Node.js/browser)
2. ✅ FFI Functions (all 15+ functions work)
3. ✅ Primitive Parsing (i8-i64, u8-u64, f32-f64, str, bool, null)
4. ✅ Object Parsing (simple, nested, empty)
5. ✅ Array Parsing (simple, typed, object-array, empty)
6. ✅ Object Creation (simple, nested, empty)
7. ✅ Array Creation (simple, object-array, empty)
8. ✅ Round-Trip (equality after parse → serialize → parse)
9. ✅ UTF-8 Handling (emoji, multi-byte characters)
10. ✅ Error Handling (parse errors, validation errors)

**Files**:
- `jest.config.js`
- `tests/**/*.test.ts`

---

### Phase 8: Build & Distribution (3-4 hours)

**Goal**: NPM package

**Steps**:
1. Create `rollup.config.js`:
   - Bundle for CommonJS + ESM
   - Minify for production
   - Include WASM in bundle

2. Build pipeline:
   ```bash
   npm run build:wasm    # Compile WASM
   npm run build:js      # Compile TypeScript + bundle
   ```

3. Test package:
   ```bash
   npm pack
   npm install ./gbln-core-0.1.0.tgz
   ```

4. Publish to NPM:
   ```bash
   npm publish --access public
   ```

**Files**:
- `rollup.config.js`
- `.npmignore`

---

### Phase 9: Documentation (2-3 hours)

**Files**:
- `README.md` (usage examples)
- `docs/API.md` (full API reference)
- `docs/WASM_BUILD.md` (Emscripten setup)
- `CHANGELOG.md`

---

## Total Estimated Time

- Phase 1: 2-3 hours (Emscripten)
- Phase 2: 4-5 hours (WASM wrapper)
- Phase 3: 5-6 hours (Value conversion)
- Phase 4: 3-4 hours (API)
- Phase 5: 2-3 hours (Errors)
- Phase 6: 2 hours (TypeScript)
- Phase 7: 6-8 hours (Tests)
- Phase 8: 3-4 hours (Build)
- Phase 9: 2-3 hours (Docs)

**Total**: 29-38 hours

---

## Critical Success Factors

1. **Use Python binding (#100) as reference** for patterns
2. **Memory management is critical** - use FinalizationRegistry
3. **Test both Node.js and browser** environments
4. **WASM size optimization** - target <300 KB
5. **All 15+ FFI extension functions** must be wrapped

---

## Known Challenges

1. **WASM Memory Management**:
   - JS garbage collection doesn't free WASM memory
   - Must use FinalizationRegistry for cleanup
   - Manual free on errors

2. **Pointer Conversion**:
   - C pointers are numbers in WASM
   - Must track allocations carefully

3. **Browser vs Node.js**:
   - Different WASM loading mechanisms
   - File I/O only in Node.js
   - Must test both environments

4. **Build Complexity**:
   - Emscripten compilation can be tricky
   - WASM optimization flags important
   - Bundle size matters for browser

---

## Next Steps (When Resuming)

1. ✅ Read this plan completely
2. Install Emscripten SDK
3. Build Rust C FFI static library
4. Start Phase 1 (Emscripten build)
5. Follow phases sequentially
6. Reference Python binding for patterns

---

**Status**: READY TO START - All prerequisites documented
