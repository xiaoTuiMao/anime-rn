/**
 * Values 模块类型声明
 *
 * 负责处理动画中的值计算、类型判断和转换
 * 包括函数值、补间类型、相对值等核心功能
 */

import { TweenPropValue, Target, DOMTarget } from './types';

/**
 * 补间类型枚举
 */
export enum TweenTypes {
  OBJECT = 'object',
  ATTRIBUTE = 'attribute',
  TRANSFORM = 'transform',
  CSS_VAR = 'css_var',
  CSS = 'css'
}

/**
 * 设置值，提供默认值回退
 * @template T, D
 * @param targetValue - 目标值
 * @param defaultValue - 默认值
 * @returns 目标值或默认值
 */
export function setValue<T, D>(targetValue: T | undefined, defaultValue: D): T | D;

/**
 * 获取函数值，支持动态计算
 * @param value - 值或函数
 * @param target - 目标对象
 * @param index - 索引
 * @param total - 总数
 * @param store - 存储对象（可选）
 * @returns 计算后的值
 */
export function getFunctionValue(
  value: TweenPropValue,
  target: Target,
  index: number,
  total: number,
  store?: { func?: Function }
): any;

/**
 * 获取补间类型，根据目标和属性确定动画类型
 * @param target - 目标对象
 * @param prop - 属性名
 * @returns 补间类型
 */
export function getTweenType(target: Target, prop: string): TweenTypes;

/**
 * 获取原始可动画值
 * @param target - DOM目标对象
 * @param propName - 属性名
 * @param tweenType - 补间类型
 * @param animationInlineStyles - 动画内联样式
 * @returns 原始值字符串
 */
export function getOriginalAnimatableValue(
  target: DOMTarget,
  propName: string,
  tweenType: TweenTypes,
  animationInlineStyles: any
): string;

/**
 * 获取相对值
 * @param x - 第一个值
 * @param y - 第二个值
 * @param operator - 操作符
 * @returns 相对值
 */
export function getRelativeValue(x: any, y: any, operator: string): any;

/**
 * 创建分解值目标对象
 * @returns 分解后的目标对象
 */
export function createDecomposedValueTargetObject(): any;

/**
 * 分解原始值
 * @param rawValue - 原始值
 * @param targetObject - 目标对象
 * @returns 分解后的对象
 */
export function decomposeRawValue(rawValue: any, targetObject: any): any;

/**
 * 分解补间值
 * @param tween - 补间对象
 * @param targetObject - 目标对象
 * @returns 分解后的对象
 */
export function decomposeTweenValue(tween: any, targetObject: any): any;

/**
 * 值处理相关的工具函数
 */
export const values = {
  setValue,
  getFunctionValue,
  getTweenType,
  getOriginalAnimatableValue,
  getRelativeValue,
  createDecomposedValueTargetObject,
  decomposeRawValue,
  decomposeTweenValue
};