/**
 * Stagger 模块类型声明
 *
 * 交错动画模块，提供强大的交错动画功能
 * 能够为多个目标创建错开的动画效果
 */

import { Timeline } from './timeline';

/**
 * 交错参数类型定义
 */
export interface StaggerParameters {
  /** 起始位置或时间 */
  start?: number | string;
  /** 起始索引位置 */
  from?: number | 'first' | 'center' | 'last';
  /** 是否反转交错顺序 */
  reversed?: boolean;
  /** 网格布局 [列数, 行数] */
  grid?: [number, number];
  /** 轴对齐方向 */
  axis?: 'x' | 'y';
  /** 缓动函数或弹簧参数 */
  ease?: string | Function | {
    /** 弹簧缓动 */
    ease: string;
    /** 弹簧持续时间 */
    duration: number;
  };
  /** 值修改器函数 */
  modifier?: (value: any) => any;
}

/**
 * 交错函数类型定义
 */
export type StaggerFunction = (
  target?: any,
  index?: number,
  length?: number,
  timeline?: Timeline
) => number | string;

/**
 * 弹簧参数接口
 */
export interface Spring {
  /** 弹簧缓动函数 */
  ease: string;
  /** 弹簧持续时间 */
  duration: number;
}

/**
 * 创建交错函数
 *
 * 这个函数用于为多个目标创建错开的动画效果，支持：
 * - 线性交错：基于索引的简单交错
 * - 网格交错：基于二维网格的距离计算
 * - 缓动交错：应用缓动函数的非线性交错
 * - 轴对齐：支持 X 轴或 Y 轴的对齐
 *
 * 交错原理：
 * - 根据起始位置计算每个目标的相对距离
 * - 支持网格布局的二维距离计算
 * - 可应用缓动函数实现非线性交错
 * - 支持轴对齐和反转效果
 *
 * @param val - 交错值或范围值
 * @param params - 交错参数对象
 * @returns 返回交错计算函数
 */
export function stagger(
  val: number | string | [number | string, number | string],
  params?: StaggerParameters
): StaggerFunction;

/**
 * 交错函数内部实现
 *
 * 这个函数会：
 * 1. 解析交错参数和配置
 * 2. 计算每个目标的相对位置
 * 3. 应用缓动函数和修改器
 * 4. 返回计算后的交错值
 *
 * @param target - 动画目标
 * @param index - 目标索引
 * @param length - 目标总数
 * @param timeline - 时间线对象
 * @returns 计算出的交错值
 */
export function createStaggerFunction(
  val: number | string | [number | string, number | string],
  params: StaggerParameters
): StaggerFunction;

/**
 * 计算网格距离
 *
 * 这个函数用于计算二维网格中两个点之间的距离：
 * - 支持从不同起始位置开始计算
 * - 可指定轴对齐方向
 * - 返回欧几里得距离或轴方向距离
 *
 * @param fromIndex - 起始索引
 * @param toIndex - 目标索引
 * @param grid - 网格布局 [列数, 行数]
 * @param fromCenter - 是否从中心开始
 * @param axis - 轴对齐方向
 * @returns 计算出的距离值
 */
export function calculateGridDistance(
  fromIndex: number,
  toIndex: number,
  grid: [number, number],
  fromCenter: boolean,
  axis?: 'x' | 'y'
): number;

/**
 * 应用缓动函数
 *
 * 这个函数用于对交错值应用缓动函数：
 * - 支持弹簧缓动和普通缓动
 * - 自动归一化值到 0-1 范围
 * - 返回应用缓动后的值
 *
 * @param values - 原始值数组
 * @param maxValue - 最大值
 * @param ease - 缓动函数
 * @returns 应用缓动后的值数组
 */
export function applyStaggerEasing(
  values: number[],
  maxValue: number,
  ease: Function
): number[];

/**
 * 反转交错值
 *
 * 这个函数用于反转交错值的顺序：
 * - 支持轴对齐的反转
 * - 可基于最大值进行反转
 * - 返回反转后的值数组
 *
 * @param values - 原始值数组
 * @param maxValue - 最大值
 * @param axis - 轴对齐方向
 * @returns 反转后的值数组
 */
export function reverseStaggerValues(
  values: number[],
  maxValue: number,
  axis?: 'x' | 'y'
): number[];