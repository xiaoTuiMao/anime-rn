/**
 * Timeline 模块类型声明
 *
 * 时间线类，继承自 Timer，用于管理多个动画的时间编排
 * 支持相对时间定位、标签、同步等功能
 */

import { Timer } from './timer';
import { JSAnimation } from './animation';
import { Tickable } from './types';

/**
 * 时间位置类型
 */
export type TimePosition = number | string | Function;

/**
 * 时间线参数接口
 */
export interface TimelineParams {
  /** 唯一标识符 */
  id?: number | string;
  /** 持续时间 */
  duration?: number;
  /** 延迟时间 */
  delay?: number;
  /** 循环次数 */
  loop?: boolean | number;
  /** 是否反向播放 */
  reversed?: boolean;
  /** 是否交替播放 */
  alternate?: boolean;
  /** 循环延迟 */
  loopDelay?: number;
  /** 自动播放 */
  autoplay?: boolean;
  /** 帧率 */
  frameRate?: number;
  /** 播放速度 */
  playbackRate?: number;
  /** 开始回调 */
  onBegin?: (timeline: Timeline) => void;
  /** 更新前回调 */
  onBeforeUpdate?: (timeline: Timeline) => void;
  /** 更新回调 */
  onUpdate?: (timeline: Timeline) => void;
  /** 循环回调 */
  onLoop?: (timeline: Timeline) => void;
  /** 暂停回调 */
  onPause?: (timeline: Timeline) => void;
  /** 完成回调 */
  onComplete?: (timeline: Timeline) => void;
}

/**
 * 时间线子元素参数
 */
export interface TimelineChildParams {
  /** 目标对象 */
  targets?: any;
  /** 动画参数 */
  parameters?: any;
  /** 时间位置 */
  position?: TimePosition;
}

/**
 * 时间线标签接口
 */
export interface TimelineLabel {
  [key: string]: number;
}

/**
 * Timeline 类
 * 继承自 Timer，提供时间线管理功能
 */
export class Timeline extends Timer {
  constructor(parameters?: TimelineParams);

  /** 时间线标签 */
  labels: TimelineLabel;

  /** 子元素数量 */
  childrenCount: number;

  /** 迭代持续时间 */
  iterationDuration: number;

  /**
   * 添加动画到时间线
   * @param a1 - 动画对象或参数
   * @param a2 - 时间位置或动画参数
   * @param a3 - 时间位置
   * @returns 当前时间线实例
   */
  add(a1: JSAnimation | TimelineChildParams, a2?: TimePosition | any, a3?: TimePosition): Timeline;

  /**
   * 同步时间线
   * @param synced - 要同步的时间线
   * @param position - 同步位置
   * @returns 当前时间线实例
   */
  sync(synced: Timeline, position?: TimePosition): Timeline;

  /**
   * 设置动画属性
   * @param targets - 目标对象
   * @param parameters - 动画参数
   * @param position - 时间位置
   * @returns 当前时间线实例
   */
  set(targets: any, parameters: any, position?: TimePosition): Timeline;

  /**
   * 在指定时间调用回调函数
   * @param callback - 回调函数
   * @param position - 时间位置
   * @returns 当前时间线实例
   */
  call(callback: Function, position?: TimePosition): Timeline;

  /**
   * 添加时间标签
   * @param labelName - 标签名称
   * @param position - 时间位置
   * @returns 当前时间线实例
   */
  label(labelName: string, position?: TimePosition): Timeline;

  /**
   * 移除动画或属性
   * @param targets - 目标对象
   * @param propertyName - 属性名称
   * @returns 当前时间线实例
   */
  remove(targets: any, propertyName?: string): Timeline;

  /**
   * 拉伸时间线持续时间
   * @param newDuration - 新的持续时间
   * @returns 当前时间线实例
   */
  stretch(newDuration: number): Timeline;

  /**
   * 刷新时间线
   * @returns 当前时间线实例
   */
  refresh(): Timeline;

  /**
   * 恢复到初始状态
   * @returns 当前时间线实例
   */
  revert(): Timeline;

  /**
   * Promise 支持
   * @param callback - 完成时的回调函数
   * @returns Promise 对象
   */
  then(callback?: (timeline: Timeline) => void): Promise<any>;
}

/**
 * 解析时间线位置
 * @param timeline - 时间线对象
 * @param timePosition - 时间位置
 * @returns 解析后的时间位置
 */
export function parseTimelinePosition(timeline: Timeline, timePosition?: TimePosition): number;

/**
 * 获取时间线总持续时间
 * @param timeline - 时间线对象
 * @returns 总持续时间
 */
export function getTimelineTotalDuration(timeline: Timeline): number;

/**
 * 添加时间线子元素
 * @param childParams - 子元素参数
 * @param timeline - 时间线对象
 * @param timePosition - 时间位置
 * @param targets - 目标对象
 * @param index - 索引
 * @param length - 长度
 * @returns 添加的子元素
 */
export function addTlChild(
  childParams: TimelineChildParams,
  timeline: Timeline,
  timePosition: TimePosition,
  targets: any,
  index: number,
  length: number
): any;

/**
 * 创建时间线的工厂函数
 * @param parameters - 时间线参数
 * @returns 返回初始化后的 Timeline 实例
 */
export function createTimeline(parameters?: TimelineParams): Timeline;