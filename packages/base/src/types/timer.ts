/**
 * Timer 类 API 文档
 *
 * Timer 是 anime.js 中用于创建定时器、动画和时间线的基础类
 * 继承自 Clock 类，提供了完整的定时器功能
 *
 * Timer 类继承关系：
 * - Timer 继承自 Clock
 * - Clock 提供基础的时间控制和帧率管理
 * - Timer 在此基础上添加了定时器特有的功能（循环、延迟、回调等）
 *
 * 主要功能：
 * - 时间控制：播放、暂停、恢复、跳转
 * - 循环控制：单次、多次、无限循环
 * - 方向控制：正向、反向、交替播放
 * - 回调系统：开始、更新、循环、完成等事件
 * - 时间线集成：可以作为子元素添加到时间线中
 */

/**
 * Timer 构造函数参数接口
 */
export interface TimerParams {
  /** 定时器唯一标识符，如果不提供则自动生成 */
  id?: number | string;

  /** 延迟时间（毫秒），在开始播放前等待的时间 */
  delay?: number | Function;

  /** 持续时间（毫秒），单次循环的持续时间，不设置则为无限 */
  duration?: number | Function;

  /** 是否反转播放，true 表示反向播放 */
  reversed?: boolean;

  /** 是否交替播放，true 表示在正向和反向之间交替 */
  alternate?: boolean;

  /** 循环次数，true 表示无限循环，数字表示具体循环次数 */
  loop?: boolean | number;

  /** 循环之间的延迟时间（毫秒） */
  loopDelay?: number;

  /** 是否自动播放，true 表示自动开始，也可以是 ScrollObserver 对象 */
  autoplay?: boolean | any;

  /** 帧率，控制动画的更新频率 */
  frameRate?: number;

  /** 播放速度，1.0 为正常速度，2.0 为两倍速 */
  playbackRate?: number;

  /** 完成时的回调函数 */
  onComplete?: (timer: Timer) => void;

  /** 每次循环时的回调函数 */
  onLoop?: (timer: Timer) => void;

  /** 暂停时的回调函数 */
  onPause?: (timer: Timer) => void;

  /** 开始时的回调函数 */
  onBegin?: (timer: Timer) => void;

  /** 更新前的回调函数 */
  onBeforeUpdate?: (timer: Timer) => void;

  /** 更新时的回调函数 */
  onUpdate?: (timer: Timer) => void;
}

/**
 * Timer 类属性说明
 */
export interface TimerProperties {
  // 基础属性
  /** 定时器唯一标识符 */
  id: number | string;

  /** 父时间线对象 */
  parent: any;

  /** 总持续时间（毫秒），包含所有循环和延迟 */
  duration: number;

  /** 是否向后播放 */
  backwards: boolean;

  /** 是否处于暂停状态 */
  paused: boolean;

  /** 是否已经开始 */
  began: boolean;

  /** 是否已经完成 */
  completed: boolean;

  /** 单次循环的持续时间 */
  iterationDuration: number;

  /** 总循环次数 */
  iterationCount: number;

  // 回调函数
  /** 开始时的回调函数 */
  onBegin: (timer: Timer) => void;

  /** 更新前的回调函数 */
  onBeforeUpdate: (timer: Timer) => void;

  /** 更新时的回调函数 */
  onUpdate: (timer: Timer) => void;

  /** 循环时的回调函数 */
  onLoop: (timer: Timer) => void;

  /** 暂停时的回调函数 */
  onPause: (timer: Timer) => void;

  /** 完成时的回调函数 */
  onComplete: (timer: Timer) => void;
}

/**
 * Timer 类方法说明
 */
export interface TimerMethods {
  // 状态控制方法

  /**
   * 重置定时器到初始状态
   * @param internalRender - 是否内部渲染，默认为 0
   * @returns 返回当前 Timer 实例
   */
  reset(internalRender?: number): Timer;

  /**
   * 初始化定时器
   * @param internalRender - 是否内部渲染，默认为 0
   * @returns 返回当前 Timer 实例
   */
  init(internalRender?: number): Timer;

  /**
   * 重置时间计算
   * @returns 返回当前 Timer 实例
   */
  resetTime(): Timer;

  /**
   * 暂停定时器
   * @returns 返回当前 Timer 实例
   */
  pause(): Timer;

  /**
   * 恢复定时器播放
   * @returns 返回当前 Timer 实例
   */
  resume(): Timer;

  /**
   * 重启定时器（重置并恢复）
   * @returns 返回当前 Timer 实例
   */
  restart(): Timer;

  /**
   * 跳转到指定时间
   * @param time - 目标时间（毫秒）
   * @param muteCallbacks - 是否静音回调，默认为 0
   * @param internalRender - 是否内部渲染，默认为 0
   * @returns 返回当前 Timer 实例
   */
  seek(time: number, muteCallbacks?: boolean | number, internalRender?: boolean | number): Timer;

  /**
   * 交替播放（正向和反向之间切换）
   * @returns 返回当前 Timer 实例
   */
  alternate(): Timer;

  /**
   * 开始播放
   * @returns 返回当前 Timer 实例
   */
  play(): Timer;

  /**
   * 反向播放
   * @returns 返回当前 Timer 实例
   */
  reverse(): Timer;

  /**
   * 取消定时器
   * @returns 返回当前 Timer 实例
   */
  cancel(): Timer;

  /**
   * 拉伸定时器持续时间
   * @param newDuration - 新的持续时间
   * @returns 返回当前 Timer 实例
   */
  stretch(newDuration: number): Timer;

  /**
   * 恢复到初始状态并取消
   * @returns 返回当前 Timer 实例
   */
  revert(): Timer;

  /**
   * 立即完成定时器
   * @returns 返回当前 Timer 实例
   */
  complete(): Timer;

  /**
   * Promise 支持，当定时器完成时解析
   * @param callback - 完成时的回调函数
   * @returns 返回 Promise 对象
   */
  then(callback?: (timer: Timer) => void): Promise<any>;
}

/**
 * Timer 类 Getter/Setter 属性
 */
export interface TimerAccessors {
  // 状态属性
  /** 是否已取消 */
  cancelled: boolean;

  /** 当前播放时间（毫秒） */
  currentTime: number;

  /** 当前迭代时间（毫秒） */
  iterationCurrentTime: number;

  /** 播放进度（0-1 之间的值） */
  progress: number;

  /** 迭代进度（0-1 之间的值） */
  iterationProgress: number;

  /** 当前迭代次数 */
  currentIteration: number;

  /** 是否反转播放 */
  reversed: boolean;

  /** 播放速度 */
  speed: number;
}

/**
 * Timer 类完整接口
 */
export interface Timer extends TimerProperties, TimerMethods, TimerAccessors {}

/**
 * 创建定时器的工厂函数
 * @param parameters - 定时器参数
 * @returns 返回初始化后的 Timer 实例
 */
export function createTimer(parameters?: TimerParams): Timer;

/**
 * Timer 类构造函数
 * @param parameters - 定时器参数对象
 * @param parent - 父时间线对象，用于时间线集成
 * @param parentPosition - 在父时间线中的位置，控制播放时机
 */
export class Timer {
  constructor(parameters?: TimerParams, parent?: any, parentPosition?: number);

  // 继承自 Clock 类的方法
  // Clock 类提供的基础时间控制功能：
  // - requestTick(time): 请求渲染，控制帧率
  // - computeDeltaTime(time): 计算帧间时间差
  // - fps: 获取/设置帧率
  // - speed: 获取/设置播放速度
}

/**
 * 使用示例：
 *
 * // 创建基本定时器
 * const timer = new Timer({
 *   duration: 1000,
 *   onComplete: () => console.log('完成!')
 * });
 *
 * // 使用工厂函数创建
 * const timer2 = createTimer({
 *   duration: 2000,
 *   loop: true,
 *   onUpdate: (t) => console.log('进度:', t.progress)
 * });
 *
 * // 控制播放
 * timer.play();        // 开始播放
 * timer.pause();       // 暂停
 * timer.resume();      // 恢复
 * timer.seek(500);     // 跳转到 500ms
 * timer.reverse();     // 反向播放
 * timer.cancel();      // 取消
 *
 * // 获取状态
 * console.log(timer.progress);        // 播放进度
 * console.log(timer.currentTime);     // 当前时间
 * console.log(timer.paused);          // 是否暂停
 *
 * // Promise 支持
 * timer.then(() => {
 *   console.log('定时器完成!');
 * });
 *
 * // 在 anime.js 生态系统中的作用：
 * // 1. 作为 Animation 类的基础，提供时间控制
 * // 2. 作为 Timeline 类的子元素，实现复杂的时间线编排
 * // 3. 与 Engine 类配合，实现高效的动画渲染
 * // 4. 支持 ScrollObserver 集成，实现滚动触发的动画
 */