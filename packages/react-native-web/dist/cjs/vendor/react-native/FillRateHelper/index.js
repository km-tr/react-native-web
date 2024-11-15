/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 */

'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));
class Info {
  constructor() {
    this.any_blank_count = 0;
    this.any_blank_ms = 0;
    this.any_blank_speed_sum = 0;
    this.mostly_blank_count = 0;
    this.mostly_blank_ms = 0;
    this.pixels_blank = 0;
    this.pixels_sampled = 0;
    this.pixels_scrolled = 0;
    this.total_time_spent = 0;
    this.sample_count = 0;
  }
}
var DEBUG = false;
var _listeners = [];
var _minSampleCount = 10;
var _sampleRate = DEBUG ? 1 : null;

/**
 * A helper class for detecting when the maximem fill rate of `VirtualizedList` is exceeded.
 * By default the sampling rate is set to zero and this will do nothing. If you want to collect
 * samples (e.g. to log them), make sure to call `FillRateHelper.setSampleRate(0.0-1.0)`.
 *
 * Listeners and sample rate are global for all `VirtualizedList`s - typical usage will combine with
 * `SceneTracker.getActiveScene` to determine the context of the events.
 */
class FillRateHelper {
  static addListener(callback) {
    if (_sampleRate === null) {
      console.warn('Call `FillRateHelper.setSampleRate` before `addListener`.');
    }
    _listeners.push(callback);
    return {
      remove: () => {
        _listeners = _listeners.filter(listener => callback !== listener);
      }
    };
  }
  static setSampleRate(sampleRate) {
    _sampleRate = sampleRate;
  }
  static setMinSampleCount(minSampleCount) {
    _minSampleCount = minSampleCount;
  }
  constructor(getFrameMetrics) {
    this._anyBlankStartTime = null;
    this._enabled = false;
    this._info = new Info();
    this._mostlyBlankStartTime = null;
    this._samplesStartTime = null;
    this._getFrameMetrics = getFrameMetrics;
    this._enabled = (_sampleRate || 0) > Math.random();
    this._resetData();
  }
  activate() {
    if (this._enabled && this._samplesStartTime == null) {
      DEBUG && console.debug('FillRateHelper: activate');
      this._samplesStartTime = global.performance.now();
    }
  }
  deactivateAndFlush() {
    if (!this._enabled) {
      return;
    }
    var start = this._samplesStartTime; // const for flow
    if (start == null) {
      DEBUG && console.debug('FillRateHelper: bail on deactivate with no start time');
      return;
    }
    if (this._info.sample_count < _minSampleCount) {
      // Don't bother with under-sampled events.
      this._resetData();
      return;
    }
    var total_time_spent = global.performance.now() - start;
    var info = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, this._info), {}, {
      total_time_spent
    });
    if (DEBUG) {
      var derived = {
        avg_blankness: this._info.pixels_blank / this._info.pixels_sampled,
        avg_speed: this._info.pixels_scrolled / (total_time_spent / 1000),
        avg_speed_when_any_blank: this._info.any_blank_speed_sum / this._info.any_blank_count,
        any_blank_per_min: this._info.any_blank_count / (total_time_spent / 1000 / 60),
        any_blank_time_frac: this._info.any_blank_ms / total_time_spent,
        mostly_blank_per_min: this._info.mostly_blank_count / (total_time_spent / 1000 / 60),
        mostly_blank_time_frac: this._info.mostly_blank_ms / total_time_spent
      };
      for (var key in derived) {
        // $FlowFixMe[prop-missing]
        derived[key] = Math.round(1000 * derived[key]) / 1000;
      }
      console.debug('FillRateHelper deactivateAndFlush: ', {
        derived,
        info
      });
    }
    _listeners.forEach(listener => listener(info));
    this._resetData();
  }
  computeBlankness(props, cellsAroundViewport, scrollMetrics) {
    if (!this._enabled || props.getItemCount(props.data) === 0 || cellsAroundViewport.last < cellsAroundViewport.first || this._samplesStartTime == null) {
      return 0;
    }
    var dOffset = scrollMetrics.dOffset,
      offset = scrollMetrics.offset,
      velocity = scrollMetrics.velocity,
      visibleLength = scrollMetrics.visibleLength;

    // Denominator metrics that we track for all events - most of the time there is no blankness and
    // we want to capture that.
    this._info.sample_count++;
    this._info.pixels_sampled += Math.round(visibleLength);
    this._info.pixels_scrolled += Math.round(Math.abs(dOffset));
    var scrollSpeed = Math.round(Math.abs(velocity) * 1000); // px / sec

    // Whether blank now or not, record the elapsed time blank if we were blank last time.
    var now = global.performance.now();
    if (this._anyBlankStartTime != null) {
      this._info.any_blank_ms += now - this._anyBlankStartTime;
    }
    this._anyBlankStartTime = null;
    if (this._mostlyBlankStartTime != null) {
      this._info.mostly_blank_ms += now - this._mostlyBlankStartTime;
    }
    this._mostlyBlankStartTime = null;
    var blankTop = 0;
    var first = cellsAroundViewport.first;
    var firstFrame = this._getFrameMetrics(first, props);
    while (first <= cellsAroundViewport.last && (!firstFrame || !firstFrame.inLayout)) {
      firstFrame = this._getFrameMetrics(first, props);
      first++;
    }
    // Only count blankTop if we aren't rendering the first item, otherwise we will count the header
    // as blank.
    if (firstFrame && first > 0) {
      blankTop = Math.min(visibleLength, Math.max(0, firstFrame.offset - offset));
    }
    var blankBottom = 0;
    var last = cellsAroundViewport.last;
    var lastFrame = this._getFrameMetrics(last, props);
    while (last >= cellsAroundViewport.first && (!lastFrame || !lastFrame.inLayout)) {
      lastFrame = this._getFrameMetrics(last, props);
      last--;
    }
    // Only count blankBottom if we aren't rendering the last item, otherwise we will count the
    // footer as blank.
    if (lastFrame && last < props.getItemCount(props.data) - 1) {
      var bottomEdge = lastFrame.offset + lastFrame.length;
      blankBottom = Math.min(visibleLength, Math.max(0, offset + visibleLength - bottomEdge));
    }
    var pixels_blank = Math.round(blankTop + blankBottom);
    var blankness = pixels_blank / visibleLength;
    if (blankness > 0) {
      this._anyBlankStartTime = now;
      this._info.any_blank_speed_sum += scrollSpeed;
      this._info.any_blank_count++;
      this._info.pixels_blank += pixels_blank;
      if (blankness > 0.5) {
        this._mostlyBlankStartTime = now;
        this._info.mostly_blank_count++;
      }
    } else if (scrollSpeed < 0.01 || Math.abs(dOffset) < 1) {
      this.deactivateAndFlush();
    }
    return blankness;
  }
  enabled() {
    return this._enabled;
  }
  _resetData() {
    this._anyBlankStartTime = null;
    this._info = new Info();
    this._mostlyBlankStartTime = null;
    this._samplesStartTime = null;
  }
}
var _default = exports.default = FillRateHelper;
module.exports = exports.default;