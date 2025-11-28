// Copyright (c) 2025 Vivian Burkhard Voss
// SPDX-License-Identifier: Apache-2.0

/**
 * Simple test for GBLN JavaScript bindings
 */

import { parse, toString, toStringPretty, roundtrip } from '../src/index.js';

console.log('🧪 GBLN JavaScript Tests\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (e) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${e.message}`);
        failed++;
    }
}

// Test 1: Parse simple value
test('Parse simple object', () => {
    const input = 'user{id<u32>(12345)name<s64>(Alice)}';
    const value = parse(input);

    if (!value.user) throw new Error('Missing user object');
    if (value.user.id !== 12345) throw new Error(`Expected id=12345, got ${value.user.id}`);
    if (value.user.name !== 'Alice') throw new Error(`Expected name=Alice, got ${value.user.name}`);
});

// Test 2: Serialize to string
test('Serialize to compact string', () => {
    const data = {
        user: {
            id: 123,
            name: 'Bob'
        }
    };

    const gbln = toString(data);
    if (!gbln.includes('user{')) throw new Error('Missing user object in output');
    if (!gbln.includes('123')) throw new Error('Missing id value');
    if (!gbln.includes('Bob')) throw new Error('Missing name value');
});

// Test 3: Pretty print
test('Serialize to pretty string', () => {
    const data = {
        config: {
            port: 8080,
            debug: true
        }
    };

    const gbln = toStringPretty(data);
    if (!gbln.includes('\n')) throw new Error('Pretty output should have newlines');
    if (!gbln.includes('config{')) throw new Error('Missing config object');
});

// Test 4: Round-trip
test('Round-trip parse and serialize', () => {
    const input = 'data{x<i32>(42)y<s32>(test)}';
    const output = roundtrip(input);

    // Parse both to compare values
    const v1 = parse(input);
    const v2 = parse(output);

    if (v1.data.x !== v2.data.x) throw new Error('Round-trip failed for x');
    if (v1.data.y !== v2.data.y) throw new Error('Round-trip failed for y');
});

// Test 5: Parse array
test('Parse array', () => {
    const input = 'tags<s16>[rust python golang]';
    const value = parse(input);

    if (!Array.isArray(value.tags)) throw new Error('Expected array');
    if (value.tags.length !== 3) throw new Error(`Expected 3 items, got ${value.tags.length}`);
    if (value.tags[0] !== 'rust') throw new Error('First element should be "rust"');
});

// Test 6: Parse nested objects
test('Parse nested objects', () => {
    const input = 'server{host<s64>(localhost)database{name<s32>(app_db)port<u16>(5432)}}';
    const value = parse(input);

    if (!value.server) throw new Error('Missing server object');
    if (!value.server.database) throw new Error('Missing database object');
    if (value.server.database.port !== 5432) throw new Error('Wrong port value');
});

// Test 7: Parse integers
test('Parse different integer types', () => {
    const input = 'numbers{i8<i8>(-128)u8<u8>(255)i32<i32>(-2147483648)u32<u32>(4294967295)}';
    const value = parse(input);

    if (value.numbers.i8 !== -128) throw new Error('Wrong i8 value');
    if (value.numbers.u8 !== 255) throw new Error('Wrong u8 value');
});

// Test 8: Parse floats
test('Parse float types', () => {
    const input = 'floats{pi<f32>(3.14159)e<f64>(2.71828)}';
    const value = parse(input);

    if (Math.abs(value.floats.pi - 3.14159) > 0.0001) throw new Error('Wrong pi value');
    if (Math.abs(value.floats.e - 2.71828) > 0.0001) throw new Error('Wrong e value');
});

// Test 9: Parse boolean
test('Parse boolean values', () => {
    const input = 'flags{active<b>(t)disabled<b>(f)}';
    const value = parse(input);

    if (value.flags.active !== true) throw new Error('active should be true');
    if (value.flags.disabled !== false) throw new Error('disabled should be false');
});

// Test 10: Parse null
test('Parse null value', () => {
    const input = 'data{optional<n>()}';
    const value = parse(input);

    if (value.data.optional !== null) throw new Error('optional should be null');
});

// Summary
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
}

console.log('✨ All tests passed!');
