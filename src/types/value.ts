// Copyright (c) 2025 Vivian Burkhard Voss
// SPDX-License-Identifier: Apache-2.0

/**
 * GBLN value type enum (matches C FFI GblnValueType).
 *
 * Used for type introspection when converting GBLN values to JavaScript.
 */
export enum GblnValueType {
    I8 = 0,
    I16 = 1,
    I32 = 2,
    I64 = 3,
    U8 = 4,
    U16 = 5,
    U32 = 6,
    U64 = 7,
    F32 = 8,
    F64 = 9,
    Str = 10,
    Bool = 11,
    Null = 12,
    Object = 13,
    Array = 14,
}

/**
 * WASM pointer type (represented as number in JavaScript).
 *
 * This is an opaque pointer to a GblnValue in WASM memory.
 * Must be freed with gbln_value_free() when no longer needed.
 */
export type WasmPointer = number

/**
 * Emscripten module interface.
 *
 * This interface defines the WASM module created by Emscripten.
 * It provides access to exported C functions and runtime methods.
 */
export interface EmscriptenModule {
    // Runtime methods (exported by Emscripten)
    ccall: (
        name: string,
        returnType: string | null,
        argTypes: string[],
        args: any[]
    ) => any

    cwrap: (
        name: string,
        returnType: string | null,
        argTypes: string[]
    ) => Function

    UTF8ToString: (ptr: WasmPointer, maxBytesToRead?: number) => string
    stringToUTF8: (str: string, ptr: WasmPointer, maxBytes: number) => void
    lengthBytesUTF8: (str: string) => number
    getValue: (ptr: WasmPointer, type: string) => any
    setValue: (ptr: WasmPointer, value: any, type: string) => void

    // Memory management
    _malloc: (size: number) => WasmPointer
    _free: (ptr: WasmPointer) => void

    // Exported C functions (will be available after module initialization)
    _gbln_parse?: Function
    _gbln_to_string?: Function
    _gbln_to_string_pretty?: Function
    _gbln_value_free?: Function
    _gbln_string_free?: Function
    _gbln_last_error_message?: Function
    _gbln_last_error_suggestion?: Function
    _gbln_value_type?: Function
    _gbln_object_keys?: Function
    _gbln_object_len?: Function
    _gbln_object_get?: Function
    _gbln_object_insert?: Function
    _gbln_keys_free?: Function
    _gbln_array_len?: Function
    _gbln_array_get?: Function
    _gbln_array_push?: Function
    _gbln_value_as_i8?: Function
    _gbln_value_as_i16?: Function
    _gbln_value_as_i32?: Function
    _gbln_value_as_i64?: Function
    _gbln_value_as_u8?: Function
    _gbln_value_as_u16?: Function
    _gbln_value_as_u32?: Function
    _gbln_value_as_u64?: Function
    _gbln_value_as_f32?: Function
    _gbln_value_as_f64?: Function
    _gbln_value_as_string?: Function
    _gbln_value_as_bool?: Function
    _gbln_value_is_null?: Function
    _gbln_value_new_i8?: Function
    _gbln_value_new_i16?: Function
    _gbln_value_new_i32?: Function
    _gbln_value_new_i64?: Function
    _gbln_value_new_u8?: Function
    _gbln_value_new_u16?: Function
    _gbln_value_new_u32?: Function
    _gbln_value_new_u64?: Function
    _gbln_value_new_f32?: Function
    _gbln_value_new_f64?: Function
    _gbln_value_new_str?: Function
    _gbln_value_new_bool?: Function
    _gbln_value_new_null?: Function
    _gbln_value_new_object?: Function
    _gbln_value_new_array?: Function
}

/**
 * Module factory function type.
 *
 * This is the function exported by Emscripten that creates the WASM module.
 */
export type CreateGblnModule = () => Promise<EmscriptenModule>
