/**
 * Clock 类 API 文档
 *
 * Clock 是 anime.js 中控制帧率和播放速率的基础类
 * 被 Engine、Timer、Animation 和 Timeline 继承
 * 提供了时间控制和帧率管理的基础功能
 */

/**
 * Clock 类属性说明
 */
export interface ClockProperties {
  /** 帧间时间差（毫秒） */
  deltaTime: number;

  /** 当前时间（毫秒） */
  _currentTime: number;

  /** 经过的时间（毫秒） */
  _elapsedTime: number;

  /** 开始时间（毫秒） */
  _startTime: number;

  /** 上一帧时间（毫秒） */
  _lastTime: number;

  /** 计划时间（毫秒） */
  _scheduledTime: number;

  /** 帧持续时间（毫秒） */
  _frameDuration: number;

  /** 帧率（FPS） */
  _fps: number;

  /** 播放速度 */
  _speed: number;

  /** 是否有子节点 */
  _hasChildren: boolean;

  /** 链表头节点 */
  _head: any;

  /** 链表尾节点 */
  _tail: any;
}

/**
 * Clock 类方法说明
 */
export interface ClockMethods {
  /**
   * 请求渲染，控制帧率
   * @param time - 当前时间
   * @returns 返回渲染模式
   */
  requestTick(time: number): number;

  /**
   * 计算帧间时间差
   * @param time - 当前时间
   * @returns 返回时间差
   */
  computeDeltaTime(time: number): number;
}

/**
 * Clock 类 Getter/Setter 属性
 */
export interface ClockAccessors {
  /**
   * 获取帧率
   */
  get fps(): number;

  /**
   * 设置帧率
   * @param frameRate - 新的帧率值
   */
  set fps(frameRate: number): void;

  /**
   * 获取播放速度
   */
  get speed(): number;

  /**
   * 设置播放速度
   * @param playbackRate - 新的播放速度
   */
  set speed(playbackRate: number): void;
}

/**
 * Clock 类完整接口
 */
export interface Clock extends ClockProperties, ClockMethods, ClockAccessors {}

/**
 * Clock 类构造函数
 * @param initTime - 初始时间，默认为 0
 */
export class Clock {
  constructor(initTime?: number);

  // 属性
  deltaTime: number = 0;
  _currentTime: number = 0;
  _elapsedTime: number = 0;
  _startTime: number = 0;
  _lastTime: number = 0;
  _scheduledTime: number = 0;
  _frameDuration: number = 0;
  _fps: number = 60;
  _speed: number = 1;
  _hasChildren: boolean = false;
  _head: any = null;
  _tail: any = null;

  // 方法
  requestTick(time: number): number;
  computeDeltaTime(time: number): number;

  // Getter/Setter
  get fps(): number;
  set fps(frameRate: number): void;
  get speed(): number;
  set speed(playbackRate: number): void;
}

/**
 * 使用示例：
 *
 * // 创建时钟实例
 * const clock = new Clock(1000);
 *
 * // 设置帧率和速度
 * clock.fps = 60;        // 设置 60 FPS
 * clock.speed = 2.0;     // 设置 2 倍速
 *
 * // 请求渲染
 * const tickMode = clock.requestTick(Date.now());
 *
 * // 计算时间差
 * const delta = clock.computeDeltaTime(Date.now());
 *
 * // 获取当前状态
 * console.log('帧率:', clock.fps);
 * console.log('速度:', clock.speed);
 * console.log('时间差:', clock.deltaTime);
 */