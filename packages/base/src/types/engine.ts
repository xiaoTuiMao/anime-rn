/**
 * Engine 类 API 文档
 *
 * Engine 是 anime.js 的核心引擎类，继承自 Clock 类
 * 负责管理动画的主循环、时间控制和对象更新
 * 提供了全局的动画引擎实例
 */

/**
 * Engine 类属性说明
 */
export interface EngineProperties {
  /** 是否使用默认主循环 */
  useDefaultMainLoop: boolean;

  /** 文档隐藏时是否暂停 */
  pauseOnDocumentHidden: boolean;

  /** 默认参数配置 */
  defaults: any;

  /** 是否暂停 */
  paused: boolean;

  /** 请求ID（requestAnimationFrame 或 setImmediate 的返回值） */
  reqId: number | any;

  // 继承自 Clock 的属性
  deltaTime: number;
  _currentTime: number;
  _elapsedTime: number;
  _startTime: number;
  _lastTime: number;
  _scheduledTime: number;
  _frameDuration: number;
  _fps: number;
  _speed: number;
  _hasChildren: boolean;
  _head: any;
  _tail: any;
}

/**
 * Engine 类方法说明
 */
export interface EngineMethods {
  /**
   * 更新引擎状态，处理所有活跃的动画对象
   */
  update(): void;

  /**
   * 唤醒引擎，启动主循环
   * @returns 返回当前 Engine 实例
   */
  wake(): Engine;

  /**
   * 暂停引擎
   * @returns 返回当前 Engine 实例
   */
  pause(): Engine;

  /**
   * 恢复引擎运行
   * @returns 返回当前 Engine 实例
   */
  resume(): Engine;

  // 继承自 Clock 的方法
  requestTick(time: number): number;
  computeDeltaTime(time: number): number;
}

/**
 * Engine 类 Getter/Setter 属性
 */
export interface EngineAccessors {
  /**
   * 获取引擎速度
   */
  get speed(): number;

  /**
   * 设置引擎速度
   * @param playbackRate - 新的播放速度
   */
  set speed(playbackRate: number): void;

  /**
   * 获取时间单位
   */
  get timeUnit(): string;

  /**
   * 设置时间单位（'ms' 或 's'）
   * @param unit - 时间单位
   */
  set timeUnit(unit: string): void;

  /**
   * 获取精度
   */
  get precision(): number;

  /**
   * 设置精度
   * @param precision - 新的精度值
   */
  set precision(precision: number): void;

  // 继承自 Clock 的 Getter/Setter
  get fps(): number;
  set fps(frameRate: number): void;
}

/**
 * Engine 类完整接口
 */
export interface Engine extends EngineProperties, EngineMethods, EngineAccessors {}

/**
 * Engine 类构造函数
 * @param initTime - 初始时间
 */
export class Engine {
  constructor(initTime: number);

  // 属性
  useDefaultMainLoop: boolean;
  pauseOnDocumentHidden: boolean;
  defaults: any;
  paused: boolean;
  reqId: number | any;

  // 继承自 Clock 的属性
  deltaTime: number;
  _currentTime: number;
  _elapsedTime: number;
  _startTime: number;
  _lastTime: number;
  _scheduledTime: number;
  _frameDuration: number;
  _fps: number;
  _speed: number;
  _hasChildren: boolean;
  _head: any;
  _tail: any;

  // 方法
  update(): void;
  wake(): Engine;
  pause(): Engine;
  resume(): Engine;

  // 继承自 Clock 的方法
  requestTick(time: number): number;
  computeDeltaTime(time: number): number;

  // Getter/Setter
  get speed(): number;
  set speed(playbackRate: number): void;
  get timeUnit(): string;
  set timeUnit(unit: string): void;
  get precision(): number;
  set precision(precision: number): void;
  get fps(): number;
  set fps(frameRate: number): void;
}

/**
 * 全局引擎实例
 */
export const engine: Engine;

/**
 * 引擎时钟方法（浏览器环境使用 requestAnimationFrame，否则使用 setImmediate）
 */
export const engineTickMethod: typeof requestAnimationFrame | typeof setImmediate;

/**
 * 引擎取消方法（浏览器环境使用 cancelAnimationFrame，否则使用 clearImmediate）
 */
export const engineCancelMethod: typeof cancelAnimationFrame | typeof clearImmediate;

/**
 * 使用示例：
 *
 * // 获取全局引擎实例
 * const globalEngine = engine;
 *
 * // 控制引擎状态
 * globalEngine.pause();    // 暂停引擎
 * globalEngine.resume();   // 恢复引擎
 * globalEngine.wake();     // 唤醒引擎
 *
 * // 设置引擎属性
 * globalEngine.speed = 2.0;        // 设置 2 倍速
 * globalEngine.timeUnit = 's';     // 设置时间单位为秒
 * globalEngine.precision = 3;      // 设置精度为 3 位小数
 * globalEngine.fps = 60;           // 设置帧率为 60 FPS
 *
 * // 获取引擎状态
 * console.log('引擎速度:', globalEngine.speed);
 * console.log('时间单位:', globalEngine.timeUnit);
 * console.log('是否暂停:', globalEngine.paused);
 *
 * // 手动更新引擎（通常不需要，引擎会自动运行）
 * // globalEngine.update();
 */