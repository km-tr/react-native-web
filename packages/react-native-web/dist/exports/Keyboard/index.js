/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

import dismissKeyboard from '../../modules/dismissKeyboard';

// in the future we can use https://github.com/w3c/virtual-keyboard
var Keyboard = {
  isVisible() {
    return false;
  },
  addListener() {
    return {
      remove: () => {}
    };
  },
  dismiss() {
    dismissKeyboard();
  },
  removeAllListeners() {},
  removeListener() {}
};
export default Keyboard;