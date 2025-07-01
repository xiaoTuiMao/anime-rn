/// <reference path='./types.js' />

import {
  shortTransforms,
  validTransforms,
  tweenTypes,
  valueTypes,
  digitWithExponentRgx,
  unitsExecRgx,
  isDomSymbol,
  isSvgSymbol,
  proxyTargetSymbol,
} from './consts.js';

import {
  stringStartsWith,
  cloneArray,
  isFnc,
  isUnd,
  isCol,
} from './helpers.js';

import {
  parseInlineTransforms,
} from './transforms.js';

import {
  isValidSVGAttribute,
} from './svg.js';

import {
  convertColorStringValuesToRgbaArray
} from './colors.js';

/**
 * @template T, D
 * @param {T|undefined} targetValue
 * @param {D} defaultValue
 * @return {T|D}
 */
export const setValue = (targetValue, defaultValue) => {
  return isUnd(targetValue) ? defaultValue : targetValue; // 如果目标值为undefined，返回默认值，否则返回目标值
} // 设置值，提供默认值回退

/**
 * @param  {TweenPropValue} value
 * @param  {Target} target
 * @param  {Number} index
 * @param  {Number} total
 * @param  {Object} [store]
 * @return {any}
 */
export const getFunctionValue = (value, target, index, total, store) => {
  if (isFnc(value)) { // 如果值是函数
    const func = () => {
      const computed = /** @type {Function} */(value)(target, index, total); // 执行函数获取计算值
      // Fallback to 0 if the function returns undefined / NaN / null / false / 0
      // 如果函数返回undefined/NaN/null/false/0，则回退到0
      return !isNaN(+computed) ? +computed : computed || 0;
    }
    if (store) {
      store.func = func; // 如果提供了存储对象，保存函数引用
    }
    return func(); // 执行函数并返回结果
  } else {
    return value; // 如果不是函数，直接返回值
  }
} // 获取函数值，支持动态计算

/**
 * @param  {Target} target
 * @param  {String} prop
 * @return {tweenTypes}
 */
export const getTweenType = (target, prop) => {
  return !target[isDomSymbol] ? tweenTypes.OBJECT : // 如果不是DOM元素，返回对象类型
    // Handle SVG attributes
    // 处理SVG属性
    target[isSvgSymbol] && isValidSVGAttribute(target, prop) ? tweenTypes.ATTRIBUTE :
    // Handle CSS Transform properties differently than CSS to allow individual animations
    // 处理CSS变换属性，与CSS不同，允许单独动画
    validTransforms.includes(prop) || shortTransforms.get(prop) ? tweenTypes.TRANSFORM :
    // CSS variables
    // CSS变量
    stringStartsWith(prop, '--') ? tweenTypes.CSS_VAR :
    // All other CSS properties
    // 所有其他CSS属性
    prop in /** @type {DOMTarget} */(target).style ? tweenTypes.CSS :
    // Handle other DOM Attributes
    // 处理其他DOM属性
    prop in target ? tweenTypes.OBJECT :
    tweenTypes.ATTRIBUTE;
} // 获取补间类型，根据目标和属性确定动画类型

/**
 * @param  {DOMTarget} target
 * @param  {String} propName
 * @param  {Object} animationInlineStyles
 * @return {String}
 */
const getCSSValue = (target, propName, animationInlineStyles) => {
  const inlineStyles = target.style[propName]; // 获取内联样式值
  if (inlineStyles && animationInlineStyles) {
    animationInlineStyles[propName] = inlineStyles; // 保存原始内联样式
  }
  const value = inlineStyles || getComputedStyle(target[proxyTargetSymbol] || target).getPropertyValue(propName); // 获取计算样式值
  return value === 'auto' ? '0' : value; // 如果值为auto，返回0
} // 获取CSS值，优先使用内联样式

/**
 * @param {Target} target
 * @param {String} propName
 * @param {tweenTypes} [tweenType]
 * @param {Object|void} [animationInlineStyles]
 * @return {String|Number}
 */
export const getOriginalAnimatableValue = (target, propName, tweenType, animationInlineStyles) => {
  const type = !isUnd(tweenType) ? tweenType : getTweenType(target, propName); // 获取补间类型
  return type === tweenTypes.OBJECT ? target[propName] || 0 : // 对象属性
         type === tweenTypes.ATTRIBUTE ? /** @type {DOMTarget} */(target).getAttribute(propName) : // DOM属性
         type === tweenTypes.TRANSFORM ? parseInlineTransforms(/** @type {DOMTarget} */(target), propName, animationInlineStyles) : // 变换属性
         type === tweenTypes.CSS_VAR ? getCSSValue(/** @type {DOMTarget} */(target), propName, animationInlineStyles).trimStart() : // CSS变量
         getCSSValue(/** @type {DOMTarget} */(target), propName, animationInlineStyles); // CSS属性
} // 获取原始可动画值，根据类型获取不同的值

/**
 * @param  {Number} x
 * @param  {Number} y
 * @param  {String} operator
 * @return {Number}
 */
export const getRelativeValue = (x, y, operator) => {
  return operator === '-' ? x - y : // 减法
         operator === '+' ? x + y : // 加法
         x * y; // 乘法
} // 获取相对值，支持加减乘运算

/** @return {TweenDecomposedValue} */
export const createDecomposedValueTargetObject = () => {
  return {
    /** @type {valueTypes} */
    t: valueTypes.NUMBER, // 值类型
    n: 0,                 // 数值
    u: null,              // 单位
    o: null,              // 操作符
    d: null,              // 数据数组
    s: null,              // 字符串数组
  }
} // 创建分解值目标对象

/**
 * @param  {String|Number} rawValue
 * @param  {TweenDecomposedValue} targetObject
 * @return {TweenDecomposedValue}
 */
export const decomposeRawValue = (rawValue, targetObject) => {
  /** @type {valueTypes} */
  targetObject.t = valueTypes.NUMBER; // 默认类型为数字
  targetObject.n = 0;                 // 默认数值为0
  targetObject.u = null;              // 清空单位
  targetObject.o = null;              // 清空操作符
  targetObject.d = null;              // 清空数据数组
  targetObject.s = null;              // 清空字符串数组
  if (!rawValue) return targetObject; // 如果原始值为空，直接返回
  const num = +rawValue; // 尝试转换为数字
  if (!isNaN(num)) {
    // It's a number
    // 是数字
    targetObject.n = num; // 设置数值
    return targetObject;
  } else {
    // let str = /** @type {String} */(rawValue).trim();
    let str = /** @type {String} */(rawValue); // 转换为字符串
    // Parsing operators (+=, -=, *=) manually is much faster than using regex here
    // 手动解析操作符(+=, -=, *=)比使用正则表达式快得多
    if (str[1] === '=') {
      targetObject.o = str[0]; // 设置操作符
      str = str.slice(2); // 移除操作符部分
    }
    // Skip exec regex if the value type is complex or color to avoid long regex backtracking
    // 如果值类型复杂或为颜色，跳过正则执行以避免长正则回溯
    const unitMatch = str.includes(' ') ? false : unitsExecRgx.exec(str); // 匹配单位
    if (unitMatch) {
      // Has a number and a unit
      // 有数字和单位
      targetObject.t = valueTypes.UNIT; // 设置为单位类型
      targetObject.n = +unitMatch[1];   // 设置数值
      targetObject.u = unitMatch[2];    // 设置单位
      return targetObject;
    } else if (targetObject.o) {
      // Has an operator (+=, -=, *=)
      // 有操作符(+=, -=, *=)
      targetObject.n = +str; // 设置数值
      return targetObject;
    } else if (isCol(str)) {
      // Is a color
      // 是颜色
      targetObject.t = valueTypes.COLOR; // 设置为颜色类型
      targetObject.d = convertColorStringValuesToRgbaArray(str); // 转换为RGBA数组
      return targetObject;
    } else {
      // Is a more complex string (generally svg coords, calc() or filters CSS values)
      // 是更复杂的字符串(通常是SVG坐标、calc()或CSS滤镜值)
      const matchedNumbers = str.match(digitWithExponentRgx); // 匹配数字
      targetObject.t = valueTypes.COMPLEX; // 设置为复杂类型
      targetObject.d = matchedNumbers ? matchedNumbers.map(Number) : []; // 设置数字数组
      targetObject.s = str.split(digitWithExponentRgx) || []; // 设置字符串数组
      return targetObject;
    }
  }
} // 分解原始值，将字符串或数字解析为结构化对象

/**
 * @param  {Tween} tween
 * @param  {TweenDecomposedValue} targetObject
 * @return {TweenDecomposedValue}
 */
export const decomposeTweenValue = (tween, targetObject) => {
  targetObject.t = tween._valueType;
  targetObject.n = tween._toNumber;
  targetObject.u = tween._unit;
  targetObject.o = null;
  targetObject.d = cloneArray(tween._toNumbers);
  targetObject.s = cloneArray(tween._strings);
  return targetObject;
}

export const decomposedOriginalValue = createDecomposedValueTargetObject();
