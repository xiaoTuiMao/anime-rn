/// <reference path='./types.js' />

import {
  transformsExecRgx,
  transformsSymbol,
} from './consts.js';

import {
  isUnd,
  stringStartsWith,
} from './helpers.js';

/**
 * @param  {DOMTarget} target
 * @param  {String} propName
 * @param  {Object} animationInlineStyles
 * @return {String}
 */
export const parseInlineTransforms = (target, propName, animationInlineStyles) => {
  const inlineTransforms = target.style.transform; // 获取内联变换样式
  let inlinedStylesPropertyValue; // 内联样式属性值
  if (inlineTransforms) {
    const cachedTransforms = target[transformsSymbol]; // 获取缓存的变换
    let t; while (t = transformsExecRgx.exec(inlineTransforms)) { // 遍历所有变换
      const inlinePropertyName = t[1]; // 变换属性名
      // const inlinePropertyValue = t[2];
      const inlinePropertyValue = t[2].slice(1, -1); // 变换属性值（移除括号）
      cachedTransforms[inlinePropertyName] = inlinePropertyValue; // 缓存变换值
      if (inlinePropertyName === propName) {
        inlinedStylesPropertyValue = inlinePropertyValue; // 找到目标属性值
        // Store the new parsed inline styles if animationInlineStyles is provided
        // 如果提供了animationInlineStyles，存储新解析的内联样式
        if (animationInlineStyles) {
          animationInlineStyles[propName] = inlinePropertyValue; // 保存到动画内联样式中
        }
      }
    }
  }
  return inlineTransforms && !isUnd(inlinedStylesPropertyValue) ? inlinedStylesPropertyValue : // 如果有内联变换且找到目标值，返回该值
    stringStartsWith(propName, 'scale') ? '1' : // 如果是缩放属性，返回默认值1
    stringStartsWith(propName, 'rotate') || stringStartsWith(propName, 'skew') ? '0deg' : '0px'; // 如果是旋转或倾斜属性，返回0deg，否则返回0px
} // 解析内联变换，提取指定属性的变换值
