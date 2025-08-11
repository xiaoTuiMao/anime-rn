/**
 * Animation 模块类型声明
 *
 * JavaScript 动画类，继承自 Timer，提供完整的动画功能
 * 包括属性动画、关键帧、缓动、合成等
 */

import { Timer } from './timer';
import { Timeline } from './timeline';
import { TweenTypes } from './values';

/**
 * 动画参数接口
 */
export interface AnimationParams {
  /** 唯一标识符 */
  id?: number | string;
  /** 目标对象 */
  targets?: any | any[];
  /** 持续时间 */
  duration?: number | Function;
  /** 延迟时间 */
  delay?: number | Function;
  /** 缓动函数 */
  ease?: string | Function | any[];
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
  /** 关键帧 */
  keyframes?: any[];
  /** 合成类型 */
  composition?: string;
  /** 修饰器函数 */
  modifier?: (v: any) => any;
  /** 开始回调 */
  onBegin?: (animation: JSAnimation) => void;
  /** 更新前回调 */
  onBeforeUpdate?: (animation: JSAnimation) => void;
  /** 更新回调 */
  onUpdate?: (animation: JSAnimation) => void;
  /** 循环回调 */
  onLoop?: (animation: JSAnimation) => void;
  /** 暂停回调 */
  onPause?: (animation: JSAnimation) => void;
  /** 完成回调 */
  onComplete?: (animation: JSAnimation) => void;
  /** 渲染回调 */
  onRender?: (animation: JSAnimation) => void;
  /** 属性动画配置 */
  [key: string]: any;
}

/**
 * 补间对象接口
 */
export interface Tween {
  /** 属性名 */
  property: string;
  /** 目标对象 */
  target: any;
  /** 补间类型 */
  _tweenType: TweenTypes;
  /** 开始值 */
  from: any;
  /** 结束值 */
  to: any;
  /** 当前值 */
  current: any;
  /** 缓动函数 */
  ease: Function;
  /** 持续时间 */
  duration: number;
  /** 延迟时间 */
  delay: number;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 是否完成 */
  completed: boolean;
  /** 是否暂停 */
  paused: boolean;
  /** 内联样式 */
  _inlineStyles?: Record<string, any>;
}

/**
 * 关键帧接口
 */
export interface Keyframe {
  /** 时间点 (0-1) */
  offset?: number;
  /** 属性值 */
  [key: string]: any;
}

/**
 * JSAnimation 类
 * 继承自 Timer，提供 JavaScript 动画功能
 */
export class JSAnimation extends Timer {
  constructor(
    targets: any | any[],
    parameters: AnimationParams,
    parent?: Timeline,
    parentPosition?: number,
    fastSet?: boolean,
    index?: number,
    length?: number
  );

  /** 目标对象 */
  targets: any[] = [];
  /** 补间对象数组 */
  tweens: Tween[] = [];
  /** 内联样式 */
  _inlineStyles: Record<string, any> = {};
  /** 原始样式 */
  _originalStyles: Record<string, any> = {};
  /** 动画参数 */
  parameters: AnimationParams = {} as AnimationParams;
  /** 父时间线 */
  parent: Timeline | null = null;
  /** 在父时间线中的位置 */
  parentPosition: number = 0;
  /** 是否快速设置 */
  fastSet: boolean = false;
  /** 索引 */
  index: number = 0;
  /** 长度 */
  length: number = 0;

  /**
   * 初始化动画
   * @returns 当前动画实例
   */
  init(): JSAnimation;

  /**
   * 添加属性动画
   * @param property - 属性名
   * @param value - 属性值
   * @param tweenType - 补间类型
   * @returns 当前动画实例
   */
  addProperty(property: string, value: any, tweenType?: TweenTypes): JSAnimation;

  /**
   * 设置属性值
   * @param property - 属性名
   * @param value - 属性值
   * @returns 当前动画实例
   */
  setProperty(property: string, value: any): JSAnimation;

  /**
   * 获取属性值
   * @param property - 属性名
   * @returns 属性值
   */
  getProperty(property: string): any;

  /**
   * 添加关键帧
   * @param keyframes - 关键帧数组
   * @returns 当前动画实例
   */
  addKeyframes(keyframes: Keyframe[]): JSAnimation;

  /**
   * 生成关键帧
   * @param keyframes - 关键帧数组
   * @param parameters - 动画参数
   * @returns 生成的关键帧
   */
  generateKeyframes(keyframes: Keyframe[], parameters: AnimationParams): Keyframe[];

  /**
   * 拉伸动画持续时间
   * @param newDuration - 新的持续时间
   * @returns 当前动画实例
   */
  stretch(newDuration: number): JSAnimation;

  /**
   * 刷新动画
   * @returns 当前动画实例
   */
  refresh(): JSAnimation;

  /**
   * 恢复到初始状态
   * @returns 当前动画实例
   */
  revert(): JSAnimation;

  /**
   * Promise 支持
   * @param callback - 完成时的回调函数
   * @returns Promise 对象
   */
  then(callback?: (animation: JSAnimation) => void): Promise<any>;
}

/**
 * 清理内联样式
 * @template T
 * @param renderable - 可渲染对象
 * @returns 清理后的对象
 */
export function cleanInlineStyles<T extends { _hasChildren?: boolean }>(renderable: T): T;

/**
 * 生成关键帧
 * @param keyframes - 关键帧数组
 * @param parameters - 动画参数
 * @returns 生成的关键帧
 */
export function generateKeyframes(keyframes: Keyframe[], parameters: AnimationParams): Keyframe[];

/**
 * 创建动画的工厂函数
 * @param targets - 目标对象
 * @param parameters - 动画参数
 * @returns 返回初始化后的 JSAnimation 实例
 */
export function animate(targets: any | any[], parameters: AnimationParams): JSAnimation;