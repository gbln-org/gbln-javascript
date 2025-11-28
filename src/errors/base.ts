// Copyright (c) 2025 Vivian Burkhard Voss
// SPDX-License-Identifier: Apache-2.0

/**
 * Error codes from C FFI (matches gbln.h).
 *
 * These correspond to the GblnErrorCode enum in the C FFI layer.
 */
export enum GblnErrorCode {
    Ok = 0,
    ErrorUnexpectedChar = 1,
    ErrorUnterminatedString = 2,
    ErrorUnexpectedToken = 3,
    ErrorUnexpectedEof = 4,
    ErrorInvalidSyntax = 5,
    ErrorIntOutOfRange = 6,
    ErrorStringTooLong = 7,
    ErrorTypeMismatch = 8,
    ErrorInvalidTypeHint = 9,
    ErrorDuplicateKey = 10,
    ErrorNullPointer = 11,
    ErrorIo = 12,
}

/**
 * Base error class for all GBLN errors.
 *
 * All GBLN-specific errors extend this class.
 */
export class GblnError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'GblnError'

        // Maintain proper stack trace (V8 engines)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

/**
 * Raised when parsing fails.
 *
 * Includes line/column information when available from the C FFI layer.
 *
 * @example
 * ```typescript
 * try {
 *     parse('invalid{')
 * } catch (e) {
 *     if (e instanceof ParseError) {
 *         console.log(e.message) // Detailed error with location
 *     }
 * }
 * ```
 */
export class ParseError extends GblnError {
    constructor(message: string) {
        super(message)
        this.name = 'ParseError'
    }
}

/**
 * Raised when validation fails.
 *
 * Examples: integer out of range, string too long, type mismatch.
 *
 * @example
 * ```typescript
 * // age<i8>(999) → ValidationError: 999 out of range [-128, 127]
 * // name<s8>(VeryLongName) → ValidationError: string too long
 * ```
 */
export class ValidationError extends GblnError {
    constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
    }
}

/**
 * Raised when I/O operations fail.
 *
 * Examples: file not found, permission denied, compression error.
 *
 * @example
 * ```typescript
 * try {
 *     await parseFile('nonexistent.gbln')
 * } catch (e) {
 *     if (e instanceof IoError) {
 *         console.log('File not found')
 *     }
 * }
 * ```
 */
export class IoError extends GblnError {
    constructor(message: string) {
        super(message)
        this.name = 'IoError'
    }
}

/**
 * Raised when serialisation fails.
 *
 * Examples: unsupported type, circular reference.
 *
 * @example
 * ```typescript
 * // Circular reference detection
 * const obj: any = {}
 * obj.self = obj
 * toString(obj) // → SerialiseError: circular reference
 * ```
 */
export class SerialiseError extends GblnError {
    constructor(message: string) {
        super(message)
        this.name = 'SerialiseError'
    }
}
