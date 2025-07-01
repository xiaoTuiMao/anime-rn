import {
  K,
  maxFps,
  minValue,
  tickModes,
} from './consts.js';

import {
  round,
} from './helpers.js';

/*
 * Base class to control framerate and playback rate.
 * Inherited by Engine, Timer, Animation and Timeline.
 * 控制帧率和播放速率的基础类。
 * 被Engine、Timer、Animation和Timeline继承。
 */
export class Clock {

  /** @param {Number} [initTime] */
  constructor(initTime = 0) {
    /** @type {Number} */
    this.deltaTime = 0; // 帧间时间差
    /** @type {Number} */
    this._currentTime = initTime; // 当前时间
    /** @type {Number} */
    this._elapsedTime = initTime; // 经过的时间
    /** @type {Number} */
    this._startTime = initTime; // 开始时间
    /** @type {Number} */
    this._lastTime = initTime; // 上一帧时间
    /** @type {Number} */
    this._scheduledTime = 0; // 计划时间
    /** @type {Number} */
    this._frameDuration = round(K / maxFps, 0); // 帧持续时间
    /** @type {Number} */
    this._fps = maxFps; // 帧率
    /** @type {Number} */
    this._speed = 1; // 播放速度
    /** @type {Boolean} */
    this._hasChildren = false; // 是否有子节点
    /** @type {Tickable|Tween} */
    this._head = null; // 链表头节点
    /** @type {Tickable|Tween} */
    this._tail = null; // 链表尾节点
  }

  get fps() {
    return this._fps; // 获取帧率
  }

  set fps(frameRate) {
    const previousFrameDuration = this._frameDuration; // 保存之前的帧持续时间
    const fr = +frameRate; // 转换为数字
    const fps = fr < minValue ? minValue : fr; // 确保帧率不小于最小值
    const frameDuration = round(K / fps, 0); // 计算新的帧持续时间
    this._fps = fps; // 更新帧率
    this._frameDuration = frameDuration; // 更新帧持续时间
    this._scheduledTime += frameDuration - previousFrameDuration; // 调整计划时间
  } // 设置帧率

  get speed() {
    return this._speed; // 获取播放速度
  }

  set speed(playbackRate) {
    const pbr = +playbackRate; // 转换为数字
    this._speed = pbr < minValue ? minValue : pbr; // 确保速度不小于最小值
  } // 设置播放速度

  /**
   * @param  {Number} time
   * @return {tickModes}
   */
  requestTick(time) {
    const scheduledTime = this._scheduledTime; // 获取计划时间
    const elapsedTime = this._elapsedTime; // 获取经过的时间
    this._elapsedTime += (time - elapsedTime); // 更新经过的时间
    // If the elapsed time is lower than the scheduled time
    // this means not enough time has passed to hit one frameDuration
    // so skip that frame
    // 如果经过的时间小于计划时间，说明还没有经过足够的时间来达到一帧的持续时间，所以跳过这一帧
    if (elapsedTime < scheduledTime) return tickModes.NONE;
    const frameDuration = this._frameDuration; // 获取帧持续时间
    const frameDelta = elapsedTime - scheduledTime; // 计算帧时间差
    // Ensures that _scheduledTime progresses in steps of at least 1 frameDuration.
    // Skips ahead if the actual elapsed time is higher.
    // 确保_scheduledTime以至少1帧持续时间的步长前进。
    // 如果实际经过的时间更高，则跳过前进。
    this._scheduledTime += frameDelta < frameDuration ? frameDuration : frameDelta; // 更新计划时间
    return tickModes.AUTO; // 返回自动渲染模式
  } // 请求渲染，控制帧率

  /**
   * @param  {Number} time
   * @return {Number}
   */
  computeDeltaTime(time) {
    const delta = time - this._lastTime; // 计算时间差
    this.deltaTime = delta; // 更新帧间时间差
    this._lastTime = time; // 更新上一帧时间
    return delta; // 返回时间差
  } // 计算帧间时间差

}
