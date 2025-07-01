import {
  defaults,
  globals,
  globalVersions,
} from './globals.js';

import {
  tickModes,
  isBrowser,
  K,
  doc,
} from './consts.js';

import {
  now,
  forEachChildren,
  removeChild,
} from './helpers.js';

import {
  Clock,
} from './clock.js';

import {
  additive,
} from './additive.js';

import {
  tick,
} from './render.js';

export const engineTickMethod = isBrowser ? requestAnimationFrame : setImmediate; // 引擎时钟方法，浏览器环境使用requestAnimationFrame，否则使用setImmediate
export const engineCancelMethod = isBrowser ? cancelAnimationFrame : clearImmediate; // 引擎取消方法，浏览器环境使用cancelAnimationFrame，否则使用clearImmediate

export class Engine extends Clock {

  /** @param {Number} [initTime] */
  constructor(initTime) {
    super(initTime); // 调用父类构造函数
    this.useDefaultMainLoop = true; // 使用默认主循环
    this.pauseOnDocumentHidden = true; // 文档隐藏时暂停
    /** @type {DefaultsParams} */
    this.defaults = defaults; // 默认参数
    this.paused = isBrowser && doc.hidden ? true  : false; // 暂停状态，浏览器环境且文档隐藏时暂停
    /** @type {Number|NodeJS.Immediate} */
    this.reqId = null; // 请求ID
  }

  update() {
    const time = this._currentTime = now(); // 获取当前时间
    if (this.requestTick(time)) {
      this.computeDeltaTime(time); // 计算时间差
      const engineSpeed = this._speed; // 引擎速度
      const engineFps = this._fps; // 引擎帧率
      let activeTickable = /** @type {Tickable} */(this._head); // 活跃的可时钟对象
      while (activeTickable) {
        const nextTickable = activeTickable._next; // 下一个可时钟对象
        if (!activeTickable.paused) {
          // 如果未暂停，执行时钟
          tick(
            activeTickable,
            (time - activeTickable._startTime) * activeTickable._speed * engineSpeed, // 计算经过的时间
            0, // !muteCallbacks
            0, // !internalRender
            activeTickable._fps < engineFps ? activeTickable.requestTick(time) : tickModes.AUTO // 时钟模式
          );
        } else {
          // 如果已暂停，移除子对象
          removeChild(this, activeTickable);
          this._hasChildren = !!this._tail; // 更新是否有子对象
          activeTickable._running = false; // 设置运行状态为false
          if (activeTickable.completed && !activeTickable._cancelled) {
            activeTickable.cancel(); // 如果已完成且未取消，则取消
          }
        }
        activeTickable = nextTickable; // 移动到下一个对象
      }
      additive.update(); // 更新加法动画
    }
  } // 更新引擎状态

  wake() {
    if (this.useDefaultMainLoop && !this.reqId && !this.paused) {
      this.reqId = engineTickMethod(tickEngine); // 启动引擎时钟
    }
    return this; // 返回自身
  } // 唤醒引擎

  pause() {
    this.paused = true; // 设置暂停状态
    return killEngine(); // 停止引擎
  } // 暂停引擎

  resume() {
    if (!this.paused) return; // 如果未暂停，直接返回
    this.paused = false; // 设置非暂停状态
    forEachChildren(this, (/** @type {Tickable} */child) => child.resetTime()); // 重置所有子对象的时间
    return this.wake(); // 唤醒引擎
  } // 恢复引擎

  // Getter and setter for speed
  get speed() {
    return this._speed * (globals.timeScale === 1 ? 1 : K); // 获取速度，考虑时间缩放
  }

  set speed(playbackRate) {
    this._speed = playbackRate * globals.timeScale; // 设置速度，考虑时间缩放
    forEachChildren(this, (/** @type {Tickable} */child) => child.speed = child._speed); // 更新所有子对象的速度
  }

  // Getter and setter for timeUnit
  get timeUnit() {
    return globals.timeScale === 1 ? 'ms' : 's'; // 获取时间单位
  };

  set timeUnit(unit) {
    const secondsScale = 0.001; // 秒的缩放因子
    const isSecond = unit === 's'; // 是否为秒
    const newScale = isSecond ? secondsScale : 1; // 新的缩放因子
    if (globals.timeScale !== newScale) {
      globals.timeScale = newScale; // 更新全局时间缩放
      globals.tickThreshold = 200 * newScale; // 更新时钟阈值
      const scaleFactor = isSecond ? secondsScale : K; // 缩放因子
      /** @type {Number} */
      (this.defaults.duration) *= scaleFactor; // 调整默认持续时间
      this._speed *= scaleFactor; // 调整速度
    }
  } // 设置时间单位

  // Getter and setter for precision
  get precision() {
    return globals.precision; // 获取精度
  }

  set precision(precision) {
    globals.precision = precision; // 设置精度
  }

};

export const engine = /*#__PURE__*/(() => {
  const engine = new Engine(now()); // 创建引擎实例
  if (isBrowser) {
    globalVersions.engine = engine; // 保存到全局版本
    doc.addEventListener('visibilitychange', () => {
      // 监听文档可见性变化
      if (!engine.pauseOnDocumentHidden) return; // 如果不暂停，直接返回
      doc.hidden ? engine.pause() : engine.resume(); // 根据可见性暂停或恢复
    });
  }
  return engine; // 返回引擎实例
})(); // 创建全局引擎实例


const tickEngine = () => {
  if (engine._head) {
    // 如果有活跃对象，继续时钟循环
    engine.reqId = engineTickMethod(tickEngine);
    engine.update(); // 更新引擎
  } else {
    engine.reqId = 0; // 没有活跃对象，停止时钟
  }
}; // 引擎时钟函数

const killEngine = () => {
  engineCancelMethod(/** @type {NodeJS.Immediate & Number} */(engine.reqId)); // 取消引擎时钟
  engine.reqId = 0; // 重置请求ID
  return engine; // 返回引擎
}; // 停止引擎
