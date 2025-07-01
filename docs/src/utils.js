/// <reference path='./types.js' />

import {
  globals,
} from './globals.js';

import {
  noop,
  minValue,
  compositionTypes,
  valueTypes,
  K,
  tweenTypes,
} from './consts.js';

import {
  isUnd,
  floor,
  PI,
  snap,
  clamp,
  round,
  interpolate,
  removeChild,
  forEachChildren,
} from './helpers.js';

import {
  engine,
} from './engine.js';

import {
  Timer,
} from './timer.js';

import {
  JSAnimation,
  cleanInlineStyles,
} from './animation.js';

import {
  removeWAAPIAnimation,
} from './waapi.js';

import {
  parseTargets,
  registerTargets,
} from './targets.js';

import {
  sanitizePropertyName,
} from './properties.js';

import {
  setValue,
  getTweenType,
  getOriginalAnimatableValue,
  decomposeRawValue,
  decomposedOriginalValue,
} from './values.js';

import {
  convertValueUnit,
} from './units.js';

import {
  removeTweenSliblings,
} from './compositions.js';

/**
 * @param  {Callback<Timer>} [callback]
 * @return {Timer}
 */
export const sync = (callback = noop) => {
  return new Timer({ duration: 1 * globals.timeScale, onComplete: callback }, null, 0).resume(); // 创建同步定时器
} // 同步函数

/**
 * @overload
 * @param  {DOMTargetSelector} targetSelector
 * @param  {String}            propName
 * @return {String}
 *
 * @overload
 * @param  {JSTargetsParam} targetSelector
 * @param  {String}         propName
 * @return {Number|String}
 *
 * @overload
 * @param  {DOMTargetsParam} targetSelector
 * @param  {String}          propName
 * @param  {String}          unit
 * @return {String}
 *
 * @overload
 * @param  {TargetsParam} targetSelector
 * @param  {String}       propName
 * @param  {Boolean}      unit
 * @return {Number}
 *
 * @param  {TargetsParam}   targetSelector
 * @param  {String}         propName
 * @param  {String|Boolean} [unit]
 */
export function getTargetValue(targetSelector, propName, unit) {
  const targets = registerTargets(targetSelector); // 注册目标
  if (!targets.length) return; // 如果没有目标，返回
  const [ target ] = targets; // 获取第一个目标
  const tweenType = getTweenType(target, propName); // 获取补间类型
  const normalizePropName = sanitizePropertyName(propName, target, tweenType); // 标准化属性名
  let originalValue = getOriginalAnimatableValue(target, normalizePropName); // 获取原始可动画值
  if (isUnd(unit)) {
    return originalValue; // 如果单位未定义，返回原始值
  } else {
    decomposeRawValue(originalValue, decomposedOriginalValue); // 分解原始值
    if (decomposedOriginalValue.t === valueTypes.NUMBER || decomposedOriginalValue.t === valueTypes.UNIT) {
      if (unit === false) {
        return decomposedOriginalValue.n; // 如果单位为false，返回数字部分
      } else {
        const convertedValue = convertValueUnit(/** @type {DOMTarget} */(target), decomposedOriginalValue, /** @type {String} */(unit), false); // 转换值单位
        return `${round(convertedValue.n, globals.precision)}${convertedValue.u}`; // 返回转换后的值
      }
    }
  }
} // 获取目标值

/**
 * @param  {TargetsParam}    targets
 * @param  {AnimationParams} parameters
 * @return {JSAnimation}
 */
export const setTargetValues = (targets, parameters) => {
  if (isUnd(parameters)) return; // 如果参数未定义，返回
  parameters.duration = minValue; // 设置持续时间为最小值
  // Do not overrides currently active tweens by default
  parameters.composition = setValue(parameters.composition, compositionTypes.none); // 设置组合类型为无
  // Skip init() and force rendering by playing the animation
  return new JSAnimation(targets, parameters, null, 0, true).resume(); // 创建动画并恢复
} // 设置目标值

/**
 * @param  {TargetsArray} targetsArray
 * @param  {JSAnimation}    animation
 * @param  {String}       [propertyName]
 * @return {Boolean}
 */
const removeTargetsFromAnimation = (targetsArray, animation, propertyName) => {
  let tweensMatchesTargets = false; // 补间匹配目标标志
  forEachChildren(animation, (/**@type {Tween} */tween) => {
    const tweenTarget = tween.target; // 获取补间目标
    if (targetsArray.includes(tweenTarget)) {
      const tweenName = tween.property; // 获取补间属性名
      const tweenType = tween._tweenType; // 获取补间类型
      const normalizePropName = sanitizePropertyName(propertyName, tweenTarget, tweenType); // 标准化属性名
      if (!normalizePropName || normalizePropName && normalizePropName === tweenName) {
        // Make sure to flag the previous CSS transform tween to renderTransform
        if (tween.parent._tail === tween &&
            tween._tweenType === tweenTypes.TRANSFORM &&
            tween._prev &&
            tween._prev._tweenType === tweenTypes.TRANSFORM
        ) {
          tween._prev._renderTransforms = 1; // 标记前一个CSS变换补间渲染变换
        }
        // Removes the tween from the selected animation
        removeChild(animation, tween); // 从选定的动画中移除补间
        // Detach the tween from its siblings to make sure blended tweens are correctlly removed
        removeTweenSliblings(tween); // 从兄弟中分离补间，确保混合补间被正确移除
        tweensMatchesTargets = true; // 设置匹配标志
      }
    }
  }, true);
  return tweensMatchesTargets; // 返回匹配标志
} // 从动画中移除目标

/**
 * @param  {TargetsParam} targets
 * @param  {Renderable|WAAPIAnimation} [renderable]
 * @param  {String}                    [propertyName]
 * @return {TargetsArray}
 */
export const remove = (targets, renderable, propertyName) => {
  const targetsArray = parseTargets(targets); // 解析目标
  const parent = /** @type {Renderable|typeof engine} **/(renderable ? renderable : engine); // 获取父对象
  const waapiAnimation = renderable && /** @type {WAAPIAnimation} */(renderable).controlAnimation && /** @type {WAAPIAnimation} */(renderable); // 获取WAAPI动画
  for (let i = 0, l = targetsArray.length; i < l; i++) {
    const $el = /** @type {DOMTarget}  */(targetsArray[i]); // 获取DOM目标
    removeWAAPIAnimation($el, propertyName, waapiAnimation); // 移除WAAPI动画
  }
  let removeMatches; // 移除匹配标志
  if (parent._hasChildren) {
    let iterationDuration = 0; // 迭代持续时间
    forEachChildren(parent, (/** @type {Renderable} */child) => {
      if (!child._hasChildren) {
        removeMatches = removeTargetsFromAnimation(targetsArray, /** @type {JSAnimation} */(child), propertyName); // 从动画中移除目标
        // Remove the child from its parent if no tweens and no children left after the removal
        if (removeMatches && !child._head) {
          child.cancel(); // 取消子对象
          removeChild(parent, child); // 从父对象中移除子对象
        } else {
          // Calculate the new iterationDuration value to handle onComplete with last child in render()
          const childTLOffset = child._offset + child._delay;
          const childDur = childTLOffset + child.duration;
          if (childDur > iterationDuration) {
            iterationDuration = childDur;
          }
        }
      }
      // Make sure to also remove engine's children targets
      // NOTE: Avoid recursion?
      if (child._head) {
        remove(targets, child, propertyName);
      } else {
        child._hasChildren = false;
      }
    }, true);
    // Update iterationDuration value to handle onComplete with last child in render()
    if (!isUnd(/** @type {Renderable} */(parent).iterationDuration)) {
      /** @type {Renderable} */(parent).iterationDuration = iterationDuration;
    }
  } else {
    removeMatches = removeTargetsFromAnimation(
      targetsArray,
      /** @type {JSAnimation} */(parent),
      propertyName
    );
  }

  if (removeMatches && !parent._head) {
    parent._hasChildren = false;
    // Cancel the parent if there are no tweens and no children left after the removal
    // We have to check if the .cancel() method exist to handle cases where the parent is the engine itself
    if (/** @type {Renderable} */(parent).cancel) /** @type {Renderable} */(parent).cancel();
  }

  return targetsArray;
}

/**
 * @param  {Number} min
 * @param  {Number} max
 * @param  {Number} [decimalLength]
 * @return {Number}
 */
const random = (min, max, decimalLength) => { const m = 10 ** (decimalLength || 0); return floor((Math.random() * (max - min + (1 / m)) + min) * m) / m };

/**
 * @param  {String|Array} items
 * @return {any}
 */
const randomPick = items => items[random(0, items.length - 1)];

/**
 * Adapted from https://bost.ocks.org/mike/shuffle/
 * @param  {Array} items
 * @return {Array}
 */
const shuffle = items => {
  let m = items.length, t, i;
  while (m) { i = random(0, --m); t = items[m]; items[m] = items[i]; items[i] = t; }
  return items;
}

/**
 * @param  {Number|String} v
 * @param  {Number} decimalLength
 * @return {String}
 */
const roundPad = (v, decimalLength) => (+v).toFixed(decimalLength);

/**
 * @param  {Number} v
 * @param  {Number} totalLength
 * @param  {String} padString
 * @return {String}
 */
const padStart = (v, totalLength, padString) => `${v}`.padStart(totalLength, padString);

/**
 * @param  {Number} v
 * @param  {Number} totalLength
 * @param  {String} padString
 * @return {String}
 */
const padEnd = (v, totalLength, padString) => `${v}`.padEnd(totalLength, padString);

/**
 * @param  {Number} v
 * @param  {Number} min
 * @param  {Number} max
 * @return {Number}
 */
const wrap = (v, min, max) => (((v - min) % (max - min) + (max - min)) % (max - min)) + min;

/**
 * @param  {Number} value
 * @param  {Number} inLow
 * @param  {Number} inHigh
 * @param  {Number} outLow
 * @param  {Number} outHigh
 * @return {Number}
 */
export const mapRange = (value, inLow, inHigh, outLow, outHigh) => outLow + ((value - inLow) / (inHigh - inLow)) * (outHigh - outLow);

/**
 * @param  {Number} degrees
 * @return {Number}
 */
const degToRad = degrees => degrees * PI / 180;

/**
 * @param  {Number} radians
 * @return {Number}
 */
const radToDeg = radians => radians * 180 / PI;

/**
 * https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
 * @param  {Number} start
 * @param  {Number} end
 * @param  {Number} amount
 * @param  {Renderable|Boolean} [renderable]
 * @return {Number}
 */
export const lerp = (start, end, amount, renderable) => {
  let dt = K / globals.defaults.frameRate;
  if (renderable !== false) {
    const ticker = /** @type Renderable */
                   (renderable) ||
                   (engine._hasChildren && engine);
    if (ticker && ticker.deltaTime) {
      dt = ticker.deltaTime;
    }
  }
  const t = 1 - Math.exp(-amount * dt * .1);
  return !amount ? start : amount === 1 ? end : (1 - t) * start + t * end;
}

// Chain-able utilities

/**
 * @callback UtilityFunction
 * @param {...*} args
 * @return {Number|String}
 *
 * @param {UtilityFunction} fn
 * @param {Number} [last=0]
 * @return {function(...(Number|String)): function(Number|String): (Number|String)}
 */
const curry = (fn, last = 0) => (...args) => last ? v => fn(...args, v) : v => fn(v, ...args);

/**
 * @param {Function} fn
 * @return {function(...(Number|String))}
 */
const chain = fn => {
   return (...args) => {
    const result = fn(...args);
    return new Proxy(noop, {
      apply: (_, __, [v]) => result(v),
      get: (_, prop) => chain(/**@param {...Number|String} nextArgs */(...nextArgs) => {
        const nextResult = utils[prop](...nextArgs);
        return (/**@type {Number|String} */v) => nextResult(result(v));
      })
    });
  }
}

/**
 * @param {UtilityFunction} fn
 * @param {Number} [right]
 * @return {function(...(Number|String)): UtilityFunction}
 */
const makeChainable = (fn, right = 0) => (...args) => (args.length < fn.length ? chain(curry(fn, right)) : fn)(...args);

/**
 * @callback ChainedUtilsResult
 * @param {Number} value
 * @return {Number}
 *
 * @typedef {Object} ChainableUtils
 * @property {ChainedClamp} clamp
 * @property {ChainedRound} round
 * @property {ChainedSnap} snap
 * @property {ChainedWrap} wrap
 * @property {ChainedInterpolate} interpolate
 * @property {ChainedMapRange} mapRange
 * @property {ChainedRoundPad} roundPad
 * @property {ChainedPadStart} padStart
 * @property {ChainedPadEnd} padEnd
 * @property {ChainedDegToRad} degToRad
 * @property {ChainedRadToDeg} radToDeg
 *
 * @typedef {ChainableUtils & ChainedUtilsResult} ChainableUtil
 *
 * @callback ChainedClamp
 * @param {Number} min
 * @param {Number} max
 * @return {ChainableUtil}
 *
 * @callback ChainedRound
 * @param {Number} decimalLength
 * @return {ChainableUtil}
 *
 * @callback ChainedSnap
 * @param {Number} increment
 * @return {ChainableUtil}
 *
 * @callback ChainedWrap
 * @param {Number} min
 * @param {Number} max
 * @return {ChainableUtil}
 *
 * @callback ChainedInterpolate
 * @param {Number} start
 * @param {Number} end
 * @return {ChainableUtil}
 *
 * @callback ChainedMapRange
 * @param {Number} inLow
 * @param {Number} inHigh
 * @param {Number} outLow
 * @param {Number} outHigh
 * @return {ChainableUtil}
 *
 * @callback ChainedRoundPad
 * @param {Number} decimalLength
 * @return {ChainableUtil}
 *
 * @callback ChainedPadStart
 * @param {Number} totalLength
 * @param {String} padString
 * @return {ChainableUtil}
 *
 * @callback ChainedPadEnd
 * @param {Number} totalLength
 * @param {String} padString
 * @return {ChainableUtil}
 *
 * @callback ChainedDegToRad
 * @return {ChainableUtil}
 *
 * @callback ChainedRadToDeg
 * @return {ChainableUtil}
 */

export const utils = {
  $: registerTargets,
  get: getTargetValue,
  set: setTargetValues,
  remove,
  cleanInlineStyles,
  random,
  randomPick,
  shuffle,
  lerp,
  sync,
  clamp: /** @type {typeof clamp & ChainedClamp} */(makeChainable(clamp)),
  round: /** @type {typeof round & ChainedRound} */(makeChainable(round)),
  snap: /** @type {typeof snap & ChainedSnap} */(makeChainable(snap)),
  wrap: /** @type {typeof wrap & ChainedWrap} */(makeChainable(wrap)),
  interpolate: /** @type {typeof interpolate & ChainedInterpolate} */(makeChainable(interpolate, 1)),
  mapRange: /** @type {typeof mapRange & ChainedMapRange} */(makeChainable(mapRange)),
  roundPad: /** @type {typeof roundPad & ChainedRoundPad} */(makeChainable(roundPad)),
  padStart: /** @type {typeof padStart & ChainedPadStart} */(makeChainable(padStart)),
  padEnd: /** @type {typeof padEnd & ChainedPadEnd} */(makeChainable(padEnd)),
  degToRad: /** @type {typeof degToRad & ChainedDegToRad} */(makeChainable(degToRad)),
  radToDeg: /** @type {typeof radToDeg & ChainedRadToDeg} */(makeChainable(radToDeg)),
}
