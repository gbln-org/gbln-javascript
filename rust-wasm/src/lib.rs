// Copyright (c) 2025 Vivian Burkhard Voss
// SPDX-License-Identifier: Apache-2.0

use gbln::{parse as gbln_parse, to_string, to_string_pretty, Value};
use wasm_bindgen::prelude::*;

/// Parse GBLN string to JavaScript value.
///
/// # Arguments
/// * `input` - GBLN-formatted string
///
/// # Returns
/// JavaScript object/array/primitive value
///
/// # Errors
/// Throws JsValue error if parsing fails
///
/// # Example (JavaScript)
/// ```js
/// import { parse } from 'gbln';
///
/// const data = parse('user{id<u32>(123)name<s64>(Alice)}');
/// console.log(data.user.name); // 'Alice'
/// ```
#[wasm_bindgen]
pub fn parse(input: &str) -> Result<JsValue, JsValue> {
    let value = gbln_parse(input).map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

    value_to_js(&value)
}

/// Serialise JavaScript value to GBLN string (compact format).
///
/// # Arguments
/// * `value` - JavaScript object/array/primitive
///
/// # Returns
/// Compact GBLN string
///
/// # Errors
/// Throws JsValue error if serialisation fails
///
/// # Example (JavaScript)
/// ```js
/// import { toString } from 'gbln';
///
/// const data = { user: { id: 123, name: 'Alice' } };
/// const gbln = toString(data);
/// // Returns: "user{id<u32>(123)name<s64>(Alice)}"
/// ```
#[wasm_bindgen(js_name = toString)]
pub fn to_string_js(value: JsValue) -> Result<String, JsValue> {
    let gbln_value = js_to_value(value)?;
    Ok(to_string(&gbln_value))
}

/// Serialise JavaScript value to pretty-printed GBLN string.
///
/// # Arguments
/// * `value` - JavaScript object/array/primitive
///
/// # Returns
/// Pretty-printed GBLN string with newlines and indentation
///
/// # Example (JavaScript)
/// ```js
/// import { toStringPretty } from 'gbln';
///
/// const data = { user: { id: 123, name: 'Alice' } };
/// const gbln = toStringPretty(data);
/// ```
#[wasm_bindgen(js_name = toStringPretty)]
pub fn to_string_pretty_js(value: JsValue) -> Result<String, JsValue> {
    let gbln_value = js_to_value(value)?;
    Ok(to_string_pretty(&gbln_value))
}

/// Convert GBLN Value to JavaScript value.
///
/// Recursively converts GBLN types to JavaScript equivalents:
/// - I8-I64, U8-U64, F32-F64 → number
/// - Str → string
/// - Bool → boolean
/// - Null → null
/// - Object → object
/// - Array → array
fn value_to_js(value: &Value) -> Result<JsValue, JsValue> {
    match value {
        Value::I8(n) => Ok(JsValue::from(*n)),
        Value::I16(n) => Ok(JsValue::from(*n)),
        Value::I32(n) => Ok(JsValue::from(*n)),
        Value::I64(n) => Ok(JsValue::from(*n as f64)), // i64 → f64 (JS limitation)
        Value::U8(n) => Ok(JsValue::from(*n)),
        Value::U16(n) => Ok(JsValue::from(*n)),
        Value::U32(n) => Ok(JsValue::from(*n)),
        Value::U64(n) => Ok(JsValue::from(*n as f64)), // u64 → f64 (JS limitation)
        Value::F32(n) => Ok(JsValue::from(*n)),
        Value::F64(n) => Ok(JsValue::from(*n)),
        Value::Str(s) => Ok(JsValue::from_str(s)),
        Value::Bool(b) => Ok(JsValue::from(*b)),
        Value::Null => Ok(JsValue::NULL),

        Value::Object(map) => {
            let obj = js_sys::Object::new();
            for (key, val) in map {
                let js_val = value_to_js(val)?;
                js_sys::Reflect::set(&obj, &JsValue::from_str(key), &js_val).map_err(|e| {
                    JsValue::from_str(&format!("Failed to set object property: {:?}", e))
                })?;
            }
            Ok(obj.into())
        }

        Value::Array(vec) => {
            let arr = js_sys::Array::new();
            for val in vec {
                let js_val = value_to_js(val)?;
                arr.push(&js_val);
            }
            Ok(arr.into())
        }
    }
}

/// Convert JavaScript value to GBLN Value.
///
/// Auto-detects appropriate GBLN type based on JavaScript value:
/// - number (integer) → smallest fitting signed/unsigned int type
/// - number (float) → f64
/// - string → s64/s256/s1024 based on length
/// - boolean → Bool
/// - null/undefined → Null
/// - object → Object
/// - array → Array
fn js_to_value(js_val: JsValue) -> Result<Value, JsValue> {
    // Null or undefined
    if js_val.is_null() || js_val.is_undefined() {
        return Ok(Value::Null);
    }

    // Boolean
    if let Some(b) = js_val.as_bool() {
        return Ok(Value::Bool(b));
    }

    // Number
    if let Some(n) = js_val.as_f64() {
        // Check if it's an integer
        if n.fract() == 0.0 && n.is_finite() {
            let n_i64 = n as i64;

            // Auto-select smallest type that fits
            if n >= 0.0 {
                // Unsigned
                if n <= u8::MAX as f64 {
                    return Ok(Value::U8(n as u8));
                } else if n <= u16::MAX as f64 {
                    return Ok(Value::U16(n as u16));
                } else if n <= u32::MAX as f64 {
                    return Ok(Value::U32(n as u32));
                } else {
                    return Ok(Value::U64(n as u64));
                }
            } else {
                // Signed
                if n >= i8::MIN as f64 && n <= i8::MAX as f64 {
                    return Ok(Value::I8(n as i8));
                } else if n >= i16::MIN as f64 && n <= i16::MAX as f64 {
                    return Ok(Value::I16(n as i16));
                } else if n >= i32::MIN as f64 && n <= i32::MAX as f64 {
                    return Ok(Value::I32(n as i32));
                } else {
                    return Ok(Value::I64(n as i64));
                }
            }
        } else {
            // Float
            return Ok(Value::F64(n));
        }
    }

    // String
    if let Some(s) = js_val.as_string() {
        return Ok(Value::Str(s));
    }

    // Array
    if js_sys::Array::is_array(&js_val) {
        let arr = js_sys::Array::from(&js_val);
        let mut values = Vec::new();

        for i in 0..arr.length() {
            let item = arr.get(i);
            let value = js_to_value(item)?;
            values.push(value);
        }

        return Ok(Value::Array(values));
    }

    // Object
    if js_val.is_object() {
        let obj = js_sys::Object::from(js_val);
        let entries = js_sys::Object::entries(&obj);
        let mut map = std::collections::HashMap::new();

        for i in 0..entries.length() {
            let entry = js_sys::Array::from(&entries.get(i));
            let key = entry
                .get(0)
                .as_string()
                .ok_or_else(|| JsValue::from_str("Object key must be string"))?;
            let val = js_to_value(entry.get(1))?;
            map.insert(key, val);
        }

        return Ok(Value::Object(map));
    }

    Err(JsValue::from_str(&format!(
        "Unsupported JavaScript type: {:?}",
        js_val
    )))
}
