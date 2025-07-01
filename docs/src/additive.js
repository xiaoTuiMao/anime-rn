/// <reference path='./types.js' />

import {
  minValue,
  noop,
  valueTypes,
  tickModes,
} from './consts.js';

import {
  cloneArray,
} from './helpers.js';

import {
  render,
} from './render.js';

export const additive = {
  animation: null, // 加法动画对象
  update: noop, // 更新函数，默认为空操作
} // 加法动画模块

/**
 * @typedef AdditiveAnimation
 * @property {Number} duration
 * @property {Number} _offset
 * @property {Number} _delay
 * @property {Tween} _head
 * @property {Tween} _tail
 */

/**
 * @param  {TweenAdditiveLookups} lookups
 * @return {AdditiveAnimation}
 */
export const addAdditiveAnimation = lookups => {
  let animation = additive.animation; // 获取当前加法动画
  if (!animation) {
    // 如果不存在，创建新的加法动画对象
    animation = {
      duration: minValue, // 设置最小持续时间
      computeDeltaTime: noop, // 计算时间差函数，默认为空操作
      _offset: 0, // 偏移量
      _delay: 0, // 延迟时间
      _head: null, // 头部补间
      _tail: null, // 尾部补间
    }
    additive.animation = animation; // 保存动画对象
    additive.update = () => {
      // 更新函数：计算所有属性的加法值
      lookups.forEach(propertyAnimation => {
        // 遍历每个属性动画
        for (let propertyName in propertyAnimation) {
          const tweens = propertyAnimation[propertyName]; // 获取该属性的所有补间
          const lookupTween = tweens._head; // 获取查找补间（头部）
          if (lookupTween) {
            const valueType = lookupTween._valueType; // 获取值类型
            // 如果是复杂类型或颜色类型，克隆起始数字数组
            const additiveValues = valueType === valueTypes.COMPLEX || valueType === valueTypes.COLOR ? cloneArray(lookupTween._fromNumbers) : null;
            let additiveValue = lookupTween._fromNumber; // 加法值，初始为起始数字
            let tween = tweens._tail; // 从尾部开始遍历
            while (tween && tween !== lookupTween) {
              // 遍历所有补间，累加数值
              if (additiveValues) {
                // 如果是复杂值，累加数组中的每个元素
                for (let i = 0, l = tween._numbers.length; i < l; i++) additiveValues[i] += tween._numbers[i];
              } else {
                // 如果是简单值，累加单个数值
                additiveValue += tween._number;
              }
              tween = tween._prevAdd; // 移动到前一个加法补间
            }
            lookupTween._toNumber = additiveValue; // 设置目标数字
            lookupTween._toNumbers = additiveValues; // 设置目标数字数组
          }
        }
      });
      // TODO: Avoid polymorphism here, idealy the additive animation should be a regular animation with a higher priority in the render loop
      render(animation, 1, 1, 0, tickModes.FORCE); // 强制渲染加法动画
    }
  }
  return animation; // 返回加法动画对象
} // 添加加法动画，用于处理多个动画的叠加效果

