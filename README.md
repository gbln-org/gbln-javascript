# GBLN for JavaScript/Node.js

**GBLN (Goblin Bounded Lean Notation)** - Type-safe, memory-efficient, LLM-native data format for JavaScript.

## Features

- ✅ **Type-safe**: Parse-time validation with inline type hints
- ✅ **Memory-efficient**: 70% smaller than JSON
- ✅ **LLM-optimized**: 84% fewer tokens than JSON for AI contexts  
- ✅ **WASM-powered**: Fast Rust parser compiled to WebAssembly
- ✅ **Zero dependencies**: Pure WASM, no native modules
- ✅ **Universal**: Works in Node.js and browsers

## Installation

```bash
npm install gbln
```

## Quick Start

### Parse GBLN to JavaScript

```javascript
import { parse } from 'gbln';

const gbln = 'user{id<u32>(12345)name<s64>(Alice Johnson)age<i8>(25)}';
const value = parse(gbln);

console.log(value);
// {
//   user: {
//     id: 12345,
//     name: 'Alice Johnson',
//     age: 25
//   }
// }
```

### Serialize JavaScript to GBLN

```javascript
import { toString, toStringPretty } from 'gbln';

const data = {
    user: {
        id: 123,
        name: 'Bob'
    }
};

// Compact format
const compact = toString(data);
console.log(compact);
// user{id<i32>(123)name<s64>(Bob)}

// Pretty-printed format
const pretty = toStringPretty(data);
console.log(pretty);
// user{
//   id<i32>(123)
//   name<s64>(Bob)
// }
```

### Arrays

```javascript
import { parse } from 'gbln';

const gbln = 'tags<s16>[rust python golang javascript]';
const value = parse(gbln);

console.log(value.tags);
// ['rust', 'python', 'golang', 'javascript']
```

### Nested Objects

```javascript
import { parse } from 'gbln';

const gbln = `
server{
  host<s64>(api.example.com)
  port<u16>(8080)
  database{
    name<s32>(app_db)
    port<u16>(5432)
  }
}
`;

const config = parse(gbln);
console.log(config.server.database.name); // 'app_db'
```

## Type System

GBLN provides inline type hints with parse-time validation:

| Type | Description | Example |
|------|-------------|---------|
| `i8`, `i16`, `i32`, `i64` | Signed integers | `age<i8>(25)` |
| `u8`, `u16`, `u32`, `u64` | Unsigned integers | `id<u32>(12345)` |
| `f32`, `f64` | Floating-point | `price<f32>(19.99)` |
| `s2`...`s1024` | Bounded strings | `name<s64>(Alice)` |
| `b` | Boolean | `active<b>(t)` |
| `n` | Null | `optional<n>()` |

### Type Safety Example

```javascript
import { parse } from 'gbln';

// This will throw an error - 999 out of range for i8 (-128 to 127)
try {
    parse('user{age<i8>(999)}');
} catch (e) {
    console.error(e.message);
    // "Integer out of range: 999 for type i8 (valid: -128 to 127)"
}
```

## API Reference

### `parse(input: string): any`

Parse GBLN string to JavaScript value.

**Throws**: `Error` on parse failure with detailed message

### `toString(value: any): string`

Serialize JavaScript value to compact GBLN string.

**Throws**: `Error` on serialization failure

### `toStringPretty(value: any): string`

Serialize JavaScript value to pretty-printed GBLN string with indentation.

**Throws**: `Error` on serialization failure

### `roundtrip(input: string): string`

Parse and re-serialize GBLN string (useful for normalization).

## Use Cases

### Configuration Files

```javascript
import { parse } from 'gbln';
import fs from 'fs';

const config = parse(fs.readFileSync('config.gbln', 'utf8'));
console.log(config.server.port); // Type-safe access
```

### API Responses

```javascript
import { toString } from 'gbln';

const response = {
    status: 200,
    data: {
        userId: 123,
        username: 'alice_dev'
    }
};

// 70% smaller than JSON
const gbln = toString(response);
```

### LLM Contexts

GBLN is optimized for AI/LLM usage with 84% fewer tokens than JSON:

```javascript
import { toString } from 'gbln';

// Prepare data for LLM prompt
const contextData = {
    user: { id: 1, role: 'admin' },
    permissions: ['read', 'write', 'delete']
};

// Compact format saves tokens
const llmContext = toString(contextData);
// user{id<i32>(1)role<s8>(admin)}permissions<s8>[read write delete]
```

## Browser Usage

```html
<script type="module">
import { parse, toString } from './pkg/web/gbln.js';

const data = parse('config{debug<b>(t)}');
console.log(data.config.debug); // true
</script>
```

## Building from Source

```bash
# Install Rust and wasm-pack
curl https://sh.rustup.rs -sSf | sh
cargo install wasm-pack

# Build WASM module
npm run build:wasm

# Run tests
npm test
```

## Performance

- **Parse speed**: ~65ms for 1000 records (competitive with JSON)
- **File size**: 70% smaller than JSON
- **Token efficiency**: 84% fewer tokens than JSON for LLM contexts
- **WASM binary**: ~128 KB (uncompressed)

## Comparison with JSON

### JSON (52 tokens)
```json
{
  "user": {
    "id": 12345,
    "name": "Alice",
    "age": 25
  }
}
```

### GBLN (8 tokens, 84% reduction)
```gbln
user{id<u32>(12345)name<s64>(Alice)age<i8>(25)}
```

## Documentation

- [Specification](https://github.com/gbln-org/gbln/blob/main/docs/01-specification.md)
- [Examples](https://github.com/gbln-org/gbln/blob/main/docs/02-examples.md)
- [LLM Optimization](https://github.com/gbln-org/gbln/blob/main/docs/04-llm-optimisation.md)

## License

Apache 2.0

## Author

Vivian Burkhard Voss <ask+gbln@vvoss.dev>

## Links

- [GitHub](https://github.com/gbln-org/gbln-javascript)
- [GBLN Specification](https://github.com/gbln-org/gbln)
- [NPM Package](https://www.npmjs.com/package/gbln) *(coming soon)*
