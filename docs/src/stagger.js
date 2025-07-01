/// <reference path='./types.js' />

import {
  emptyString,
  unitsExecRgx,
} from './consts.js';

import {
  isArr,
  isUnd,
  isNum,
  parseNumber,
  round,
  abs,
  floor,
  sqrt,
  max,
} from './helpers.js';

import {
  parseEasings,
} from './eases.js';

import {
  Timeline,
  parseTimelinePosition,
} from './timeline.js';

/**
 * @typedef  {Object} StaggerParameters
 * @property {Number|String} [start]
 * @property {Number|'first'|'center'|'last'} [from]
 * @property {Boolean} [reversed]
 * @property {Array.<Number>} [grid]
 * @property {('x'|'y')} [axis]
 * @property {EasingParam} [ease]
 * @property {TweenModifier} [modifier]
 */

/**
 * @callback StaggerFunction
 * @param {Target} [target]
 * @param {Number} [index]
 * @param {Number} [length]
 * @param {Timeline} [tl]
 * @return {Number|String}
 */

/**
 * @param  {Number|String|[Number|String,Number|String]} val
 * @param  {StaggerParameters} params
 * @return {StaggerFunction}
 */
export const stagger = (val, params = {}) => {
  let values = []; // 存储计算出的值数组
  let maxValue = 0; // 最大值
  const from = params.from; // 起始位置
  const reversed = params.reversed; // 是否反转
  const ease = params.ease; // 缓动函数
  const hasEasing = !isUnd(ease); // 是否有缓动
  const hasSpring = hasEasing && !isUnd(/** @type {Spring} */(ease).ease); // 是否为弹簧缓动
  const staggerEase = hasSpring ? /** @type {Spring} */(ease).ease : hasEasing ? parseEasings(ease) : null; // 交错缓动函数
  const grid = params.grid; // 网格参数
  const axis = params.axis; // 轴参数
  const fromFirst = isUnd(from) || from === 0 || from === 'first'; // 是否从第一个开始
  const fromCenter = from === 'center'; // 是否从中心开始
  const fromLast = from === 'last'; // 是否从最后一个开始
  const isRange = isArr(val); // 是否为范围值
  const val1 = isRange ? parseNumber(val[0]) : parseNumber(val); // 第一个值
  const val2 = isRange ? parseNumber(val[1]) : 0; // 第二个值
  const unitMatch = unitsExecRgx.exec((isRange ? val[1] : val) + emptyString); // 单位匹配
  const start = params.start || 0 + (isRange ? val1 : 0); // 起始值
  let fromIndex = fromFirst ? 0 : isNum(from) ? from : 0; // 起始索引
  return (_, i, t, tl) => {
    if (fromCenter) fromIndex = (t - 1) / 2; // 如果从中心开始，计算中心索引
    if (fromLast) fromIndex = t - 1; // 如果从最后一个开始，设置索引为最后一个
    if (!values.length) {
      // 如果值数组为空，计算所有值
      for (let index = 0; index < t; index++) {
        if (!grid) {
          // 如果没有网格，计算简单的距离
          values.push(abs(fromIndex - index));
        } else {
          // 如果有网格，计算网格距离
          const fromX = !fromCenter ? fromIndex % grid[0] : (grid[0] - 1) / 2; // 起始X坐标
          const fromY = !fromCenter ? floor(fromIndex / grid[0]) : (grid[1] - 1) / 2; // 起始Y坐标
          const toX = index % grid[0]; // 目标X坐标
          const toY = floor(index / grid[0]); // 目标Y坐标
          const distanceX = fromX - toX; // X方向距离
          const distanceY = fromY - toY; // Y方向距离
          let value = sqrt(distanceX * distanceX + distanceY * distanceY); // 计算欧几里得距离
          if (axis === 'x') value = -distanceX; // 如果指定X轴，使用X方向距离
          if (axis === 'y') value = -distanceY; // 如果指定Y轴，使用Y方向距离
          values.push(value); // 添加到值数组
        }
        maxValue = max(...values); // 更新最大值
      }
      if (staggerEase) values = values.map(val => staggerEase(val / maxValue) * maxValue); // 应用缓动函数
      if (reversed) values = values.map(val => axis ? (val < 0) ? val * -1 : -val : abs(maxValue - val)); // 如果反转，调整值
    }
    const spacing = isRange ? (val2 - val1) / maxValue : val1; // 计算间距
    const offset = tl ? parseTimelinePosition(tl, isUnd(params.start) ? tl.iterationDuration : start) : /** @type {Number} */(start); // 计算偏移量
    /** @type {String|Number} */
    let output = offset + ((spacing * round(values[i], 2)) || 0); // 计算输出值
    if (params.modifier) output = params.modifier(output); // 应用修改器
    if (unitMatch) output = `${output}${unitMatch[2]}`; // 添加单位
    return output; // 返回结果
  }
} // 创建交错函数，用于为多个目标创建错开的动画效果
