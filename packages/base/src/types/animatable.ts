/**
 * Animatable 模块类型声明
 *
 * 可动画对象管理器，为对象的属性创建动画方法
 * 支持链式调用和属性访问，自动管理动画的生命周期
 */

import { JSAnimation } from './animation';
import { AnimationParams, Tween } from './animation';

/**
 * 可动画属性接口
 * 为每个属性创建的动画方法
 */
export interface AnimatableProperty {
  /**
   * 设置动画值或获取当前值
   * @param to - 目标值（可选，不传则获取当前值）
   * @param duration - 动画持续时间（可选）
   * @param ease - 缓动函数（可选）
   * @returns 当前值或可动画对象（支持链式调用）
   */
  (to?: any, duration?: number, ease?: string | Function): any | Animatable;
}

/**
 * 可动画参数接口
 */
export interface AnimatableParams {
  /** 全局动画参数 */
  [key: string]: any;
}

/**
 * 可动画对象接口
 * 包含所有可动画属性和方法
 */
export interface AnimatableObject extends Animatable {
  /** 动画目标数组 */
  targets: any[];
  /** 动画对象映射 */
  animations: Record<string, JSAnimation>;
  /** 动态属性方法 */
  [key: string]: AnimatableProperty | any;
}

/**
 * 可动画类
 * 用于创建和管理可动画的对象
 */
export class Animatable {
  /** 动画目标数组 */
  targets: any[] = [];
  /** 动画对象映射 */
  animations: Record<string, JSAnimation> = {};

  /**
   * 构造函数 - 创建可动画对象
   *
   * 这个构造函数会：
   * 1. 解析全局参数和属性参数
   * 2. 为每个属性创建动画实例
   * 3. 为每个属性创建动画方法
   * 4. 设置默认的动画行为
   *
   * @param targets - 动画目标（DOM元素、对象、数组等）
   * @param parameters - 动画参数对象
   */
  constructor(targets: any | any[], parameters: AnimatableParams);

  /**
   * 恢复所有动画到初始状态
   *
   * 这个方法会：
   * 1. 将所有属性方法设为空操作
   * 2. 恢复所有动画实例
   * 3. 清空动画对象映射
   * 4. 清空目标数组
   *
   * @returns 返回自身，支持链式调用
   */
  revert(): this;

  /** 动态属性方法 */
  [key: string]: AnimatableProperty | any;
}

/**
 * 创建可动画对象的工厂函数
 *
 * 这个函数会：
 * 1. 创建新的 Animatable 实例
 * 2. 自动初始化所有属性动画
 * 3. 返回配置好的可动画对象
 *
 * @param targets - 动画目标（DOM元素、对象、数组等）
 * @param parameters - 动画参数对象
 * @returns 返回配置好的可动画对象
 */
export function createAnimatable(targets: any | any[], parameters: AnimatableParams): AnimatableObject;