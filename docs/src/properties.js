/// <reference path='./types.js' />

import {
  tweenTypes,
  shortTransforms,
} from './consts.js';

import {
  isSvg,
  toLowerCase,
} from './helpers.js';

const propertyNamesCache = {}; // 属性名称缓存

/**
 * @param  {String} propertyName
 * @param  {Target} target
 * @param  {tweenTypes} tweenType
 * @return {String}
 */
export const sanitizePropertyName = (propertyName, target, tweenType) => {
  if (tweenType === tweenTypes.TRANSFORM) {
    // 如果是变换类型，检查是否有简写形式
    const t = shortTransforms.get(propertyName);
    return t ? t : propertyName; // 返回完整变换名称或原名称
  } else if (
    tweenType === tweenTypes.CSS ||
    // Handle special cases where properties like "strokeDashoffset" needs to be set as "stroke-dashoffset"
    // but properties like "baseFrequency" should stay in lowerCamelCase
    // 处理特殊情况，如"strokeDashoffset"需要设置为"stroke-dashoffset"
    // 但"baseFrequency"等属性应该保持小驼峰命名
    (tweenType === tweenTypes.ATTRIBUTE && (isSvg(target) && propertyName in /** @type {DOMTarget} */(target).style))
  ) {
    // 对于CSS属性或SVG样式属性，需要转换为短横线命名
    const cachedPropertyName = propertyNamesCache[propertyName]; // 检查缓存
    if (cachedPropertyName) {
      return cachedPropertyName; // 如果已缓存，直接返回
    } else {
      const lowerCaseName = propertyName ? toLowerCase(propertyName) : propertyName; // 转换为短横线命名
      propertyNamesCache[propertyName] = lowerCaseName; // 缓存结果
      return lowerCaseName; // 返回转换后的名称
    }
  } else {
    return propertyName; // 其他情况直接返回原名称
  }
} // 清理属性名称，根据类型进行适当的格式转换
