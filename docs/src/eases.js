/// <reference path='./types.js' />

import {
  minValue,
  emptyString,
} from './consts.js';

import {
  isUnd,
  isStr,
  isFnc,
  parseNumber,
  clamp,
  sqrt,
  cos,
  sin,
  ceil,
  floor,
  abs,
  asin,
  PI,
  pow,
} from './helpers.js';

/** @type {EasingFunction} */
export const none = t => t; // 无缓动函数，直接返回输入值

// Cubic Bezier solver adapted from https://github.com/gre/bezier-ease © Gaëtan Renaudeau
// 三次贝塞尔曲线求解器，改编自 https://github.com/gre/bezier-ease © Gaëtan Renaudeau

/**
 * @param  {Number} aT
 * @param  {Number} aA1
 * @param  {Number} aA2
 * @return {Number}
 */
const calcBezier = (aT, aA1, aA2) => (((1 - 3 * aA2 + 3 * aA1) * aT + (3 * aA2 - 6 * aA1)) * aT + (3 * aA1)) * aT; // 计算贝塞尔曲线值

/**
 * @param  {Number} aX
 * @param  {Number} mX1
 * @param  {Number} mX2
 * @return {Number}
 */
const binarySubdivide = (aX, mX1, mX2) => {
  let aA = 0, aB = 1, currentX, currentT, i = 0; // 二分查找参数
  do {
    currentT = aA + (aB - aA) / 2; // 计算当前时间点
    currentX = calcBezier(currentT, mX1, mX2) - aX; // 计算当前X值与目标X值的差
    if (currentX > 0) {
      aB = currentT; // 如果差值大于0，调整上界
    } else {
      aA = currentT; // 如果差值小于等于0，调整下界
    }
  } while (abs(currentX) > .0000001 && ++i < 100); // 当差值足够小或迭代次数达到上限时停止
  return currentT; // 返回找到的时间点
} // 二分查找求解贝塞尔曲线

/**
 * @param  {Number} [mX1]
 * @param  {Number} [mY1]
 * @param  {Number} [mX2]
 * @param  {Number} [mY2]
 * @return {EasingFunction}
 */

export const cubicBezier = (mX1 = 0.5, mY1 = 0.0, mX2 = 0.5, mY2 = 1.0) => (mX1 === mY1 && mX2 === mY2) ? none :
  t => t === 0 || t === 1 ? t :
  calcBezier(binarySubdivide(t, mX1, mX2), mY1, mY2); // 三次贝塞尔曲线缓动函数

/**
 * Steps ease implementation https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function
 * Only covers 'end' and 'start' jumpterms
 * Steps缓动实现 https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function
 * 仅覆盖'end'和'start'跳跃项
 * @param  {Number} steps
 * @param  {Boolean} [fromStart]
 * @return {EasingFunction}
 */
export const steps = (steps = 10, fromStart) => {
  const roundMethod = fromStart ? ceil : floor; // 根据跳跃位置选择取整方法
  return t => roundMethod(clamp(t, 0, 1) * steps) * (1 / steps); // 返回阶梯式缓动函数
} // 阶梯式缓动函数

/**
 * Without parameters, the linear function creates a non-eased transition.
 * Parameters, if used, creates a piecewise linear easing by interpolating linearly between the specified points.
 * 没有参数时，linear函数创建无缓动的过渡。
 * 使用参数时，通过在指定点之间线性插值创建分段线性缓动。
 * @param  {...String|Number} [args] - Points
 * @return {EasingFunction}
 */
const linear = (...args) => {
  const argsLength = args.length; // 参数数量
  if (!argsLength) return none; // 如果没有参数，返回无缓动函数
  const totalPoints = argsLength - 1; // 总点数
  const firstArg = args[0]; // 第一个参数
  const lastArg = args[totalPoints]; // 最后一个参数
  const xPoints = [0]; // X坐标点数组
  const yPoints = [parseNumber(firstArg)]; // Y坐标点数组
  for (let i = 1; i < totalPoints; i++) {
    const arg = args[i]; // 当前参数
    const splitValue = isStr(arg) ?
    /** @type {String} */(arg).trim().split(' ') : // 如果是字符串，按空格分割
    [arg]; // 如果是数字，直接使用
    const value = splitValue[0]; // 值
    const percent = splitValue[1]; // 百分比
    xPoints.push(!isUnd(percent) ? parseNumber(percent) / 100 : i / totalPoints); // 添加X坐标点
    yPoints.push(parseNumber(value)); // 添加Y坐标点
  }
  yPoints.push(parseNumber(lastArg)); // 添加最后一个Y坐标点
  xPoints.push(1); // 添加最后一个X坐标点
  return function easeLinear(t) {
    for (let i = 1, l = xPoints.length; i < l; i++) {
      const currentX = xPoints[i]; // 当前X坐标
      if (t <= currentX) {
        const prevX = xPoints[i - 1]; // 前一个X坐标
        const prevY = yPoints[i - 1]; // 前一个Y坐标
        return prevY + (yPoints[i] - prevY) * (t - prevX) / (currentX - prevX); // 线性插值
      }
    }
    return yPoints[yPoints.length - 1]; // 返回最后一个Y坐标
  }
} // 线性缓动函数，支持分段线性

/**
 * Generate random steps
 * 生成随机阶梯
 * @param  {Number} [length] - The number of steps
 * @param  {Number} [randomness] - How strong the randomness is
 * @return {EasingFunction}
 */
const irregular = (length = 10, randomness = 1) => {
  const values = [0]; // 值数组，从0开始
  const total = length - 1; // 总步数
  for (let i = 1; i < total; i++) {
    const previousValue = values[i - 1]; // 前一个值
    const spacing = i / total; // 均匀间距
    const segmentEnd = (i + 1) / total; // 段结束位置
    const randomVariation = spacing + (segmentEnd - spacing) * Math.random(); // 随机变化
    // Mix the even spacing and random variation based on the randomness parameter
    // 根据随机性参数混合均匀间距和随机变化
    const randomValue = spacing * (1 - randomness) + randomVariation * randomness; // 计算随机值
    values.push(clamp(randomValue, previousValue, 1)); // 添加限制在范围内的随机值
  }
  values.push(1); // 添加结束值1
  return linear(...values); // 返回基于随机值的线性缓动函数
} // 不规则缓动函数

// Easing functions adapted from http://www.robertpenner.com/ease © Robert Penner
// 缓动函数改编自 http://www.robertpenner.com/ease © Robert Penner

/**
 * @callback PowerEasing
 * @param {Number|String} [power=1.675]
 * @return {EasingFunction}
 */

/**
 * @callback BackEasing
 * @param {Number|String} [overshoot=1.70158]
 * @return {EasingFunction}
 */

/**
 * @callback ElasticEasing
 * @param {Number|String} [amplitude=1]
 * @param {Number|String} [period=.3]
 * @return {EasingFunction}
 */

/**
 * @callback EaseFactory
 * @param {Number|String} [paramA]
 * @param {Number|String} [paramB]
 * @return {EasingFunction|Number}
 */

/** @typedef {PowerEasing|BackEasing|ElasticEasing} EasesFactory */

const halfPI = PI / 2; // 半圆周率
const doublePI = PI * 2; // 双圆周率
/** @type {PowerEasing} */
export const easeInPower = (p = 1.68) => t => pow(t, +p); // 幂次缓入函数

/** @type {Record<String, EasesFactory|EasingFunction>} */
const easeInFunctions = {
  [emptyString]: easeInPower, // 空字符串使用幂次缓入
  Quad: easeInPower(2),       // 二次缓入
  Cubic: easeInPower(3),      // 三次缓入
  Quart: easeInPower(4),      // 四次缓入
  Quint: easeInPower(5),      // 五次缓入
  /** @type {EasingFunction} */
  Sine: t => 1 - cos(t * halfPI), // 正弦缓入
  /** @type {EasingFunction} */
  Circ: t => 1 - sqrt(1 - t * t), // 圆形缓入
  /** @type {EasingFunction} */
  Expo: t => t ? pow(2, 10 * t - 10) : 0, // 指数缓入
  /** @type {EasingFunction} */
  Bounce: t => {
    let pow2, b = 4; // 弹跳缓入
    while (t < ((pow2 = pow(2, --b)) - 1) / 11); // 计算弹跳次数
    return 1 / pow(4, 3 - b) - 7.5625 * pow((pow2 * 3 - 2) / 22 - t, 2); // 返回弹跳值
  },
  /** @type {BackEasing} */
  Back: (overshoot = 1.70158) => t => (+overshoot + 1) * t * t * t - +overshoot * t * t, // 回弹缓入
  /** @type {ElasticEasing} */
  Elastic: (amplitude = 1, period = .3) => {
    const a = clamp(+amplitude, 1, 10);
    const p = clamp(+period, minValue, 2);
    const s = (p / doublePI) * asin(1 / a);
    const e = doublePI / p;
    return t => t === 0 || t === 1 ? t : -a * pow(2, -10 * (1 - t)) * sin(((1 - t) - s) * e);
  }
}

/**
 * @callback EaseType
 * @param {EasingFunction} Ease
 * @return {EasingFunction}
 */

/** @type {Record<String, EaseType>} */
export const easeTypes = {
  in: easeIn => t => easeIn(t),
  out: easeIn => t => 1 - easeIn(1 - t),
  inOut: easeIn => t => t < .5 ? easeIn(t * 2) / 2 : 1 - easeIn(t * -2 + 2) / 2,
  outIn: easeIn => t => t < .5 ? (1 - easeIn(1 - t * 2)) / 2 : (easeIn(t * 2 - 1) + 1) / 2,
}

/**
 * @param  {String} string
 * @param  {Record<String, EasesFactory|EasingFunction>} easesFunctions
 * @param  {Object} easesLookups
 * @return {EasingFunction}
 */
export const parseEaseString = (string, easesFunctions, easesLookups) => {
  if (easesLookups[string]) return easesLookups[string];
  if (string.indexOf('(') <= -1) {
    const hasParams = easeTypes[string] || string.includes('Back') || string.includes('Elastic');
    const parsedFn = /** @type {EasingFunction} */(hasParams ? /** @type {EasesFactory} */(easesFunctions[string])() : easesFunctions[string]);
    return parsedFn ? easesLookups[string] = parsedFn : none;
  } else {
    const split = string.slice(0, -1).split('(');
    const parsedFn = /** @type {EasesFactory} */(easesFunctions[split[0]]);
    return parsedFn ? easesLookups[string] = parsedFn(...split[1].split(',')) : none;
  }
}

/**
 * @typedef  {Object} EasesFunctions
 * @property {typeof linear} linear
 * @property {typeof irregular} irregular
 * @property {typeof steps} steps
 * @property {typeof cubicBezier} cubicBezier
 * @property {PowerEasing} in
 * @property {PowerEasing} out
 * @property {PowerEasing} inOut
 * @property {PowerEasing} outIn
 * @property {EasingFunction} inQuad
 * @property {EasingFunction} outQuad
 * @property {EasingFunction} inOutQuad
 * @property {EasingFunction} outInQuad
 * @property {EasingFunction} inCubic
 * @property {EasingFunction} outCubic
 * @property {EasingFunction} inOutCubic
 * @property {EasingFunction} outInCubic
 * @property {EasingFunction} inQuart
 * @property {EasingFunction} outQuart
 * @property {EasingFunction} inOutQuart
 * @property {EasingFunction} outInQuart
 * @property {EasingFunction} inQuint
 * @property {EasingFunction} outQuint
 * @property {EasingFunction} inOutQuint
 * @property {EasingFunction} outInQuint
 * @property {EasingFunction} inSine
 * @property {EasingFunction} outSine
 * @property {EasingFunction} inOutSine
 * @property {EasingFunction} outInSine
 * @property {EasingFunction} inCirc
 * @property {EasingFunction} outCirc
 * @property {EasingFunction} inOutCirc
 * @property {EasingFunction} outInCirc
 * @property {EasingFunction} inExpo
 * @property {EasingFunction} outExpo
 * @property {EasingFunction} inOutExpo
 * @property {EasingFunction} outInExpo
 * @property {EasingFunction} inBounce
 * @property {EasingFunction} outBounce
 * @property {EasingFunction} inOutBounce
 * @property {EasingFunction} outInBounce
 * @property {BackEasing} inBack
 * @property {BackEasing} outBack
 * @property {BackEasing} inOutBack
 * @property {BackEasing} outInBack
 * @property {ElasticEasing} inElastic
 * @property {ElasticEasing} outElastic
 * @property {ElasticEasing} inOutElastic
 * @property {ElasticEasing} outInElastic
 */

export const eases = (/*#__PURE__*/ (() => {
  const list = { linear, irregular, steps, cubicBezier };
  for (let type in easeTypes) {
    for (let name in easeInFunctions) {
      const easeIn = easeInFunctions[name];
      const easeType = easeTypes[type];
      list[type + name] = /** @type {EasesFactory|EasingFunction} */(
        name === emptyString || name === 'Back' || name === 'Elastic' ?
        (a, b) => easeType(/** @type {EasesFactory} */(easeIn)(a, b)) :
        easeType(/** @type {EasingFunction} */(easeIn))
      );
    }
  }
  return /** @type {EasesFunctions} */(list);
})());

/** @type {Record<String, EasingFunction>} */
const JSEasesLookups = { linear: none };

/**
 * @param  {EasingParam} ease
 * @return {EasingFunction}
 */
export const parseEasings = ease => isFnc(ease) ? ease :
  isStr(ease) ? parseEaseString(/** @type {String} */(ease), eases, JSEasesLookups) :
  none;

