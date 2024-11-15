"use strict";

exports.__esModule = true;
exports.default = useRefEffect;
var _react = require("react");
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 */

/**
 * Constructs a callback ref that provides similar semantics as `useEffect`. The
 * supplied `effect` callback will be called with non-null component instances.
 * The `effect` callback can also optionally return a cleanup function.
 *
 * When a component is updated or unmounted, the cleanup function is called. The
 * `effect` callback will then be called again, if applicable.
 *
 * When a new `effect` callback is supplied, the previously returned cleanup
 * function will be called before the new `effect` callback is called with the
 * same instance.
 *
 * WARNING: The `effect` callback should be stable (e.g. using `useCallback`).
 */
function useRefEffect(effect) {
  var cleanupRef = (0, _react.useRef)(undefined);
  return (0, _react.useCallback)(instance => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = undefined;
    }
    if (instance != null) {
      cleanupRef.current = effect(instance);
    }
  }, [effect]);
}
module.exports = exports.default;