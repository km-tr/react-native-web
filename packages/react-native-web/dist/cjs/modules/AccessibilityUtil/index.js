"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _isDisabled = _interopRequireDefault(require("./isDisabled"));
var _propsToAccessibilityComponent = _interopRequireDefault(require("./propsToAccessibilityComponent"));
var _propsToAriaRole = _interopRequireDefault(require("./propsToAriaRole"));
/**
 * Copyright (c) Nicolas Gallagher.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

var AccessibilityUtil = {
  isDisabled: _isDisabled.default,
  propsToAccessibilityComponent: _propsToAccessibilityComponent.default,
  propsToAriaRole: _propsToAriaRole.default
};
var _default = exports.default = AccessibilityUtil;
module.exports = exports.default;