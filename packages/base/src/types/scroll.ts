/**
 * Scroll 模块类型声明
 *
 * 滚动动画模块，提供完整的滚动动画功能
 * 包括滚动观察者系统、滚动触发动画、滚动进度计算等
 */

import { Timer } from './timer';

/**
 * 滚动阈值类型
 */
export type ScrollThresholdValue = string | number;

/**
 * 滚动观察者参数接口
 */
export interface ScrollObserverParams {
  /** 滚动容器 */
  container?: any;
  /** 滚动阈值 */
  threshold?: ScrollThresholdValue;
  /** 滚动偏移 */
  offset?: ScrollThresholdValue;
  /** 滚动方向 */
  direction?: 'x' | 'y' | 'both';
  /** 滚动缓动 */
  ease?: string | Function;
  /** 滚动持续时间 */
  duration?: number;
  /** 滚动延迟 */
  delay?: number;
  /** 滚动循环 */
  loop?: boolean | number;
  /** 滚动循环延迟 */
  loopDelay?: number;
  /** 滚动反向 */
  reversed?: boolean;
  /** 滚动交替 */
  alternate?: boolean;
  /** 滚动自动播放 */
  autoplay?: boolean;
  /** 滚动帧率 */
  frameRate?: number;
  /** 滚动播放速度 */
  playbackRate?: number;
  /** 滚动开始回调 */
  onBegin?: (observer: ScrollObserver) => void;
  /** 滚动更新前回调 */
  onBeforeUpdate?: (observer: ScrollObserver) => void;
  /** 滚动更新回调 */
  onUpdate?: (observer: ScrollObserver) => void;
  /** 滚动循环回调 */
  onLoop?: (observer: ScrollObserver) => void;
  /** 滚动暂停回调 */
  onPause?: (observer: ScrollObserver) => void;
  /** 滚动完成回调 */
  onComplete?: (observer: ScrollObserver) => void;
  /** 滚动渲染回调 */
  onRender?: (observer: ScrollObserver) => void;
}

/**
 * 滚动容器类接口
 * 管理滚动容器的状态和行为
 */
export interface ScrollContainer {
  /** 容器元素 */
  element: HTMLElement;
  /** 是否使用窗口 */
  useWin: boolean;
  /** 滚动位置 */
  scrollLeft: number;
  /** 滚动顶部位置 */
  scrollTop: number;
  /** 容器宽度 */
  clientWidth: number;
  /** 容器高度 */
  clientHeight: number;
  /** 滚动宽度 */
  scrollWidth: number;
  /** 滚动高度 */
  scrollHeight: number;
  /** 滚动观察者列表 */
  observers: ScrollObserver[];
  /** 是否已链接 */
  linked: boolean;

  /**
   * 更新滚动坐标
   */
  updateScrollCoords(): void;

  /**
   * 更新窗口边界
   */
  updateWindowBounds(): void;

  /**
   * 更新边界
   */
  updateBounds(): void;

  /**
   * 刷新滚动观察者
   */
  refreshScrollObservers(): void;

  /**
   * 刷新容器
   */
  refresh(): void;

  /**
   * 处理滚动事件
   */
  handleScroll(): void;

  /**
   * 处理事件
   * @param e - 事件对象
   */
  handleEvent(e: Event): void;

  /**
   * 恢复容器状态
   */
  revert(): void;
}

/**
 * 滚动观察者类
 * 观察滚动容器的滚动状态
 */
export class ScrollObserver extends Timer {
  /** 滚动容器 */
  container: ScrollContainer;
  /** 滚动阈值 */
  threshold: ScrollThresholdValue;
  /** 滚动偏移 */
  offset: ScrollThresholdValue;
  /** 滚动方向 */
  direction: 'x' | 'y' | 'both';
  /** 滚动缓动 */
  ease: Function;
  /** 滚动持续时间 */
  duration: number;
  /** 滚动延迟 */
  delay: number;
  /** 滚动循环 */
  loop: boolean | number;
  /** 滚动循环延迟 */
  loopDelay: number;
  /** 滚动反向 */
  reversed: boolean;
  /** 滚动交替 */
  alternate: boolean;
  /** 滚动自动播放 */
  autoplay: boolean;
  /** 滚动帧率 */
  frameRate: number;
  /** 滚动播放速度 */
  playbackRate: number;
  /** 滚动开始回调 */
  onBegin: (observer: ScrollObserver) => void;
  /** 滚动更新前回调 */
  onBeforeUpdate: (observer: ScrollObserver) => void;
  /** 滚动更新回调 */
  onUpdate: (observer: ScrollObserver) => void;
  /** 滚动循环回调 */
  onLoop: (observer: ScrollObserver) => void;
  /** 滚动暂停回调 */
  onPause: (observer: ScrollObserver) => void;
  /** 滚动完成回调 */
  onComplete: (observer: ScrollObserver) => void;
  /** 滚动渲染回调 */
  onRender: (observer: ScrollObserver) => void;
  /** 滚动位置 */
  scrollLeft: number;
  /** 滚动顶部位置 */
  scrollTop: number;
  /** 容器宽度 */
  clientWidth: number;
  /** 容器高度 */
  clientHeight: number;
  /** 滚动宽度 */
  scrollWidth: number;
  /** 滚动高度 */
  scrollHeight: number;
  /** 是否已链接 */
  linked: boolean;
  /** 链接的对象 */
  linkedTo: any;

  /**
   * 滚动观察者构造函数
   * @param parameters - 滚动观察者参数
   */
  constructor(parameters?: ScrollObserverParams);

  /**
   * 链接到对象
   * @param linked - 要链接的对象
   */
  link(linked: any): void;

  /**
   * 获取滚动速度
   */
  get velocity(): number;

  /**
   * 获取是否向后滚动
   */
  get backward(): boolean;

  /**
   * 获取滚动位置
   */
  get scroll(): number;

  /**
   * 获取滚动进度
   */
  get progress(): number;

  /**
   * 刷新滚动观察者
   */
  refresh(): void;

  /**
   * 移除调试信息
   */
  removeDebug(): void;

  /**
   * 显示调试信息
   */
  debug(): void;

  /**
   * 更新边界
   */
  updateBounds(): void;

  /**
   * 处理滚动事件
   */
  handleScroll(): void;

  /**
   * 恢复滚动观察者状态
   */
  revert(): void;
}

/**
 * 滚动容器映射表
 */
export const scrollContainers: Map<any, ScrollContainer>;

/**
 * 获取最大视口高度
 * @returns 最大视口高度（像素）
 */
export function getMaxViewHeight(): number;

/**
 * 解析滚动观察者函数参数
 * @param value - 参数值
 * @param scroller - 滚动观察者
 * @returns 解析后的值
 */
export function parseScrollObserverFunctionParameter<T>(
  value: T | ((observer: ScrollObserver) => T),
  scroller: ScrollObserver
): T;

/**
 * 创建滚动观察者的工厂函数
 * @param parameters - 滚动观察者参数
 * @returns 滚动观察者实例
 */
export function onScroll(parameters?: ScrollObserverParams): ScrollObserver;