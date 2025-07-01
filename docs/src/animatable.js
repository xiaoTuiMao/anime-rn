/// <reference path='./types.js' />

import {
  compositionTypes,
  noop,
} from './consts.js';

import {
  globals,
} from './globals.js';

import {
  isKey,
  isObj,
  isStr,
  isUnd,
  mergeObjects,
  forEachChildren,
  isArr,
} from './helpers.js';

import {
  JSAnimation,
} from './animation.js';

import {
  parseEasings,
} from './eases.js';

export class Animatable {
  /**
   * @param {TargetsParam} targets
   * @param {AnimatableParams} parameters
   */
  constructor(targets, parameters) {
    if (globals.scope) globals.scope.revertibles.push(this); // 如果存在作用域，添加到可恢复列表
    /** @type {AnimationParams} */
    const globalParams = {}; // 全局参数
    const properties = {}; // 属性参数
    this.targets = []; // 目标数组
    this.animations = {}; // 动画对象映射
    if (isUnd(targets) || isUnd(parameters)) return; // 如果目标或参数未定义，直接返回
    for (let propName in parameters) {
      const paramValue = parameters[propName]; // 参数值
      if (isKey(propName)) {
        properties[propName] = paramValue; // 如果是有效键名，添加到属性参数
      } else {
        globalParams[propName] = paramValue; // 否则添加到全局参数
      }
    }
    for (let propName in properties) {
      const propValue = properties[propName]; // 属性值
      const isObjValue = isObj(propValue); // 是否为对象值
      /** @type {TweenParamsOptions} */
      let propParams = {}; // 属性参数
      let to = '+=0'; // 默认目标值
      if (isObjValue) {
        const unit = propValue.unit; // 获取单位
        if (isStr(unit)) to += unit; // 如果有单位，添加到目标值
      } else {
        propParams.duration = propValue; // 如果不是对象，设置为持续时间
      }
      propParams[propName] = isObjValue ? mergeObjects({ to }, propValue) : to; // 设置属性参数
      const animParams = mergeObjects(globalParams, propParams); // 合并全局和属性参数
      animParams.composition = compositionTypes.replace; // 设置组合模式为替换
      animParams.autoplay = false; // 禁用自动播放
      const animation = this.animations[propName] = new JSAnimation(targets, animParams, null, 0, false).init(); // 创建并初始化动画
      if (!this.targets.length) this.targets.push(...animation.targets); // 如果目标数组为空，添加动画目标
      /** @type {AnimatableProperty} */
      this[propName] = (to, duration, ease) => {
        const tween = /** @type {Tween} */(animation._head); // 获取补间对象
        if (isUnd(to) && tween) {
          // 如果没有指定目标值，返回当前值
          const numbers = tween._numbers; // 获取数字数组
          if (numbers && numbers.length) {
            return numbers; // 返回数字数组
          } else {
            return tween._modifier(tween._number); // 返回修改后的数值
          }
        } else {
          // 设置新的动画值
          forEachChildren(animation, (/** @type {Tween} */tween) => {
            if (isArr(to)) {
              // 如果目标是数组，设置多个数值
              for (let i = 0, l = /** @type {Array} */(to).length; i < l; i++) {
                if (!isUnd(tween._numbers[i])) {
                  tween._fromNumbers[i] = /** @type {Number} */(tween._modifier(tween._numbers[i])); // 设置起始值
                  tween._toNumbers[i] = to[i]; // 设置目标值
                }
              }
            } else {
              // 如果目标是单个值
              tween._fromNumber = /** @type {Number} */(tween._modifier(tween._number)); // 设置起始值
              tween._toNumber = /** @type {Number} */(to); // 设置目标值
            }
            if (!isUnd(ease)) tween._ease = parseEasings(ease); // 如果指定了缓动函数，解析并设置
            tween._currentTime = 0; // 重置当前时间
          });
          if (!isUnd(duration)) animation.stretch(duration); // 如果指定了持续时间，调整动画时长
          animation.reset(1).resume(); // 重置并恢复动画
          return this; // 返回自身以支持链式调用
        }
      }; // 创建属性动画方法
    }
  }

  revert() {
    for (let propName in this.animations) {
      this[propName] = noop; // 将属性方法设为空操作
      this.animations[propName].revert(); // 恢复动画
    }
    this.animations = {}; // 清空动画对象
    this.targets.length = 0; // 清空目标数组
    return this; // 返回自身
  } // 恢复所有动画到初始状态
}

/**
 * @param {TargetsParam} targets
 * @param {AnimatableParams} parameters
 * @return {AnimatableObject}
 */
export const createAnimatable = (targets, parameters) => /** @type {AnimatableObject} */(new Animatable(targets, parameters)); // 创建可动画对象的工厂函数