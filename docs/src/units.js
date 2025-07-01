/// <reference path='./types.js' />

import {
  doc,
  valueTypes,
} from './consts.js';

import {
  isUnd,
  PI
} from './helpers.js';

const angleUnitsMap = { 'deg': 1, 'rad': 180 / PI, 'turn': 360 }; // 角度单位映射表
const convertedValuesCache = {}; // 转换值缓存

/**
 * @param  {DOMTarget} el
 * @param  {TweenDecomposedValue} decomposedValue
 * @param  {String} unit
 * @param  {Boolean} [force]
 * @return {TweenDecomposedValue}
 */
export const convertValueUnit = (el, decomposedValue, unit, force = false) => {
  const currentUnit = decomposedValue.u; // 当前单位
  const currentNumber = decomposedValue.n; // 当前数值
  if (decomposedValue.t === valueTypes.UNIT && currentUnit === unit) { // TODO: Check if checking against the same unit string is necessary
    // TODO: 检查是否需要对相同单位字符串进行检查
    return decomposedValue; // 如果类型是单位且单位相同，直接返回
  }
  const cachedKey = currentNumber + currentUnit + unit; // 缓存键
  const cached = convertedValuesCache[cachedKey]; // 获取缓存值
  if (!isUnd(cached) && !force) {
    decomposedValue.n = cached; // 如果有缓存且不强制转换，使用缓存值
  } else {
    let convertedValue; // 转换后的值
    if (currentUnit in angleUnitsMap) {
      // 如果是角度单位，使用映射表进行转换
      convertedValue = currentNumber * angleUnitsMap[currentUnit] / angleUnitsMap[unit];
    } else {
      // 对于其他单位，使用DOM元素进行实际测量转换
      const baseline = 100; // 基准值
      const tempEl = /** @type {DOMTarget} */(el.cloneNode()); // 创建临时元素
      const parentNode = el.parentNode; // 获取父节点
      const parentEl = (parentNode && (parentNode !== doc)) ? parentNode : doc.body; // 确定父元素
      parentEl.appendChild(tempEl); // 添加临时元素到DOM
      const elStyle = tempEl.style; // 获取样式对象
      elStyle.width = baseline + currentUnit; // 设置当前单位宽度
      const currentUnitWidth = /** @type {HTMLElement} */(tempEl).offsetWidth || baseline; // 获取当前单位宽度
      elStyle.width = baseline + unit; // 设置目标单位宽度
      const newUnitWidth = /** @type {HTMLElement} */(tempEl).offsetWidth || baseline; // 获取目标单位宽度
      const factor = currentUnitWidth / newUnitWidth; // 计算转换因子
      parentEl.removeChild(tempEl); // 移除临时元素
      convertedValue = factor * currentNumber; // 计算转换后的值
    }
    decomposedValue.n = convertedValue; // 设置转换后的数值
    convertedValuesCache[cachedKey] = convertedValue; // 缓存转换结果
  }
  decomposedValue.t === valueTypes.UNIT; // 确保类型为单位
  decomposedValue.u = unit; // 设置新单位
  return decomposedValue; // 返回转换后的分解值
} // 转换值单位，支持角度单位和其他CSS单位的转换
