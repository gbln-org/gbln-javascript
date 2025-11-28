// Copyright (c) 2025 Vivian Burkhard Voss
// SPDX-License-Identifier: Apache-2.0

/**
 * GBLN - Goblin Bounded Lean Notation for JavaScript/Node.js
 *
 * Type-safe, memory-efficient, LLM-native data format.
 *
 * @module gbln
 */

import * as wasm from '../pkg/nodejs/gbln.js';

/**
 * Parse GBLN string to JavaScript value.
 *
 * @param {string} input - GBLN formatted string
 * @returns {any} Parsed JavaScript value
 * @throws {Error} On parse error
 *
 * @example
 * import { parse } from 'gbln';
 *
 * const value = parse('user{id<u32>(12345)name<s64>(Alice)}');
 * console.log(value);
 * // { user: { id: 12345, name: 'Alice' } }
 */
export function parse(input) {
    return wasm.parse(input);
}

/**
 * Serialize JavaScript value to GBLN string (compact format).
 *
 * @param {any} value - JavaScript value to serialize
 * @returns {string} Compact GBLN string
 * @throws {Error} On serialization error
 *
 * @example
 * import { toString } from 'gbln';
 *
 * const data = { user: { id: 123, name: 'Alice' } };
 * const gbln = toString(data);
 * console.log(gbln);
 * // user{id<i32>(123)name<s64>(Alice)}
 */
export function toString(value) {
    return wasm.toString(value);
}

/**
 * Serialize JavaScript value to GBLN string (pretty-printed format).
 *
 * @param {any} value - JavaScript value to serialize
 * @returns {string} Pretty-printed GBLN string with indentation
 * @throws {Error} On serialization error
 *
 * @example
 * import { toStringPretty } from 'gbln';
 *
 * const data = { user: { id: 123, name: 'Alice' } };
 * const gbln = toStringPretty(data);
 * console.log(gbln);
 * // user{
 * //   id<i32>(123)
 * //   name<s64>(Alice)
 * // }
 */
export function toStringPretty(value) {
    return wasm.toStringPretty(value);
}

/**
 * Parse and serialize round-trip helper.
 *
 * @param {string} input - GBLN string
 * @returns {string} Re-serialized GBLN string
 *
 * @example
 * import { roundtrip } from 'gbln';
 *
 * const input = 'user{id<u32>(123)}';
 * const output = roundtrip(input);
 * console.log(input === output); // true
 */
export function roundtrip(input) {
    const value = parse(input);
    return toString(value);
}

// Re-export WASM module for advanced usage
export { wasm };

// Default export
export default {
    parse,
    toString,
    toStringPretty,
    roundtrip,
    wasm
};
