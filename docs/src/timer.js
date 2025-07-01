/// <reference path='./types.js' />

import {
  minValue,
  compositionTypes,
  tickModes,
  noop,
  maxValue,
} from './consts.js';

import {
  now,
  isUnd,
  addChild,
  forEachChildren,
  clampInfinity,
  round,
  normalizeTime,
  isFnc,
  clamp,
  floor,
} from './helpers.js';

import {
  globals,
} from './globals.js';

import {
  setValue,
} from './values.js';

import {
  tick,
} from './render.js';

import {
  composeTween,
  getTweenSiblings,
  removeTweenSliblings,
} from './compositions.js';

import {
  engine,
} from './engine.js';

import {
  Clock,
} from './clock.js';

/**
 * @param  {Timer} timer
 * @return {Timer}
 */
const resetTimerProperties = timer => {
  timer.paused = true; // 设置暂停状态
  timer.began = false; // 设置未开始状态
  timer.completed = false; // 设置未完成状态
  return timer; // 返回定时器
} // 重置定时器属性

/**
 * @param  {Timer} timer
 * @return {Timer}
 */
const reviveTimer = timer => {
  if (!timer._cancelled) return timer; // 如果未取消，直接返回
  if (timer._hasChildren) {
    // 如果有子对象，递归恢复所有子对象
    forEachChildren(timer, reviveTimer);
  } else {
    // 如果没有子对象，恢复所有补间
    forEachChildren(timer, (/** @type {Tween} tween*/tween) => {
      if (tween._composition !== compositionTypes.none) {
        // 如果补间有组合类型，重新组合
        composeTween(tween, getTweenSiblings(tween.target, tween.property));
      }
    });
  }
  timer._cancelled = 0; // 重置取消状态
  return timer; // 返回定时器
} // 恢复定时器

let timerId = 0; // 定时器ID计数器

/**
 * Base class used to create Timers, Animations and Timelines
 */
export class Timer extends Clock {
  /**
   * @param {TimerParams} [parameters]
   * @param {Timeline} [parent]
   * @param {Number} [parentPosition]
   */
  constructor(parameters = {}, parent = null, parentPosition = 0) {

    super(0); // 调用父类构造函数

    const {
      id,
      delay,
      duration,
      reversed,
      alternate,
      loop,
      loopDelay,
      autoplay,
      frameRate,
      playbackRate,
      onComplete,
      onLoop,
      onPause,
      onBegin,
      onBeforeUpdate,
      onUpdate,
    } = parameters; // 解构参数

    if (globals.scope) globals.scope.revertibles.push(this); // 如果存在作用域，添加到可恢复列表

    const timerInitTime = parent ? 0 : engine._elapsedTime; // 定时器初始时间
    const timerDefaults = parent ? parent.defaults : globals.defaults; // 定时器默认值
    const timerDelay = /** @type {Number} */(isFnc(delay) || isUnd(delay) ? timerDefaults.delay : +delay); // 定时器延迟
    const timerDuration = isFnc(duration) || isUnd(duration) ? Infinity : +duration; // 定时器持续时间
    const timerLoop = setValue(loop, timerDefaults.loop); // 定时器循环次数
    const timerLoopDelay = setValue(loopDelay, timerDefaults.loopDelay); // 定时器循环延迟
    const timerIterationCount = timerLoop === true ||
                                timerLoop === Infinity ||
                                /** @type {Number} */(timerLoop) < 0 ? Infinity :
                                /** @type {Number} */(timerLoop) + 1; // 定时器迭代次数

    let offsetPosition = 0; // 偏移位置

    if (parent) {
      offsetPosition = parentPosition; // 如果有父对象，使用父位置
    } else {
      let startTime = now(); // 获取开始时间
      // Make sure to tick the engine once if suspended to avoid big gaps with the following offsetPosition calculation
      if (engine.paused) {
        engine.requestTick(startTime); // 如果引擎暂停，请求一次时钟
        startTime = engine._elapsedTime; // 更新开始时间
      }
      offsetPosition = startTime - engine._startTime; // 计算偏移位置
    }

    // Timer's parameters
    this.id = !isUnd(id) ? id : ++timerId; // 定时器ID
    /** @type {Timeline} */
    this.parent = parent; // 父对象
    // Total duration of the timer
    this.duration = clampInfinity(((timerDuration + timerLoopDelay) * timerIterationCount) - timerLoopDelay) || minValue; // 总持续时间
    /** @type {Boolean} */
    this.backwards = false; // 是否向后播放
    /** @type {Boolean} */
    this.paused = true; // 是否暂停
    /** @type {Boolean} */
    this.began = false; // 是否已开始
    /** @type {Boolean} */
    this.completed = false; // 是否已完成
    /** @type {Callback<this>} */
    this.onBegin = onBegin || timerDefaults.onBegin; // 开始回调
    /** @type {Callback<this>} */
    this.onBeforeUpdate = onBeforeUpdate || timerDefaults.onBeforeUpdate; // 更新前回调
    /** @type {Callback<this>} */
    this.onUpdate = onUpdate || timerDefaults.onUpdate; // 更新回调
    /** @type {Callback<this>} */
    this.onLoop = onLoop || timerDefaults.onLoop; // 循环回调
    /** @type {Callback<this>} */
    this.onPause = onPause || timerDefaults.onPause; // 暂停回调
    /** @type {Callback<this>} */
    this.onComplete = onComplete || timerDefaults.onComplete; // 完成回调
    /** @type {Number} */
    this.iterationDuration = timerDuration; // Duration of one loop - 单次循环持续时间
    /** @type {Number} */
    this.iterationCount = timerIterationCount; // Number of loops - 循环次数
    /** @type {Boolean|ScrollObserver} */
    this._autoplay = parent ? false : setValue(autoplay, timerDefaults.autoplay); // 是否自动播放
    /** @type {Number} */
    this._offset = offsetPosition; // 偏移量
    /** @type {Number} */
    this._delay = timerDelay; // 延迟时间
    /** @type {Number} */
    this._loopDelay = timerLoopDelay; // 循环延迟
    /** @type {Number} */
    this._iterationTime = 0; // 迭代时间
    /** @type {Number} */
    this._currentIteration = 0; // Current loop index - 当前循环索引
    /** @type {Function} */
    this._resolve = noop; // Used by .then() - 用于Promise的resolve函数
    /** @type {Boolean} */
    this._running = false; // 是否运行中
    /** @type {Number} */
    this._reversed = +setValue(reversed, timerDefaults.reversed); // 是否反转
    /** @type {Number} */
    this._reverse = this._reversed; // 反转状态
    /** @type {Number} */
    this._cancelled = 0; // 取消状态
    /** @type {Boolean} */
    this._alternate = setValue(alternate, timerDefaults.alternate); // 是否交替
    /** @type {Renderable} */
    this._prev = null; // 前一个可渲染对象
    /** @type {Renderable} */
    this._next = null; // 后一个可渲染对象

    // Clock's parameters
    /** @type {Number} */
    this._elapsedTime = timerInitTime; // 经过的时间
    /** @type {Number} */
    this._startTime = timerInitTime; // 开始时间
    /** @type {Number} */
    this._lastTime = timerInitTime; // 上次时间
    /** @type {Number} */
    this._fps = setValue(frameRate, timerDefaults.frameRate); // 帧率
    /** @type {Number} */
    this._speed = setValue(playbackRate, timerDefaults.playbackRate); // 播放速度
  }

  get cancelled() {
    return !!this._cancelled; // 返回是否已取消
  }

  /** @param {Boolean} cancelled  */
  set cancelled(cancelled) {
    cancelled ? this.cancel() : this.reset(1).play(); // 设置取消状态，如果取消则调用cancel，否则重置并播放
  }

  get currentTime() {
    return clamp(round(this._currentTime, globals.precision), -this._delay, this.duration); // 获取当前时间，限制在延迟和持续时间范围内
  }

  /** @param {Number} time  */
  set currentTime(time) {
    const paused = this.paused; // 保存当前暂停状态
    // Pausing the timer is necessary to avoid time jumps on a running instance
    this.pause().seek(+time); // 暂停定时器并跳转到指定时间
    if (!paused) this.resume(); // 如果之前未暂停，则恢复
  } // 设置当前时间

  get iterationCurrentTime() {
    return round(this._iterationTime, globals.precision); // 获取当前迭代时间
  }

  /** @param {Number} time  */
  set iterationCurrentTime(time) {
    this.currentTime = (this.iterationDuration * this._currentIteration) + time; // 设置当前迭代时间
  }

  get progress() {
    return clamp(round(this._currentTime / this.duration, 5), 0, 1); // 获取进度，限制在0-1之间
  }

  /** @param {Number} progress  */
  set progress(progress) {
    this.currentTime = this.duration * progress; // 根据进度设置当前时间
  }

  get iterationProgress() {
    return clamp(round(this._iterationTime / this.iterationDuration, 5), 0, 1); // 获取迭代进度
  }

  /** @param {Number} progress  */
  set iterationProgress(progress) {
    const iterationDuration = this.iterationDuration; // 获取迭代持续时间
    this.currentTime = (iterationDuration * this._currentIteration) + (iterationDuration * progress); // 根据迭代进度设置当前时间
  }

  get currentIteration() {
    return this._currentIteration; // 获取当前迭代次数
  }

  /** @param {Number} iterationCount  */
  set currentIteration(iterationCount) {
    this.currentTime = (this.iterationDuration * clamp(+iterationCount, 0, this.iterationCount - 1)); // 设置当前迭代次数
  }

  get reversed() {
    return !!this._reversed; // 返回是否反转
  }

  /** @param {Boolean} reverse  */
  set reversed(reverse) {
    reverse ? this.reverse() : this.play(); // 设置反转状态
  }

  get speed() {
    return super.speed; // 获取速度
  }

  /** @param {Number} playbackRate  */
  set speed(playbackRate) {
    super.speed = playbackRate; // 设置速度
    this.resetTime(); // 重置时间
  }

  /**
   * @param  {Number} internalRender
   * @return {this}
   */
  reset(internalRender = 0) {
    // If cancelled, revive the timer before rendering in order to have propertly composed tweens siblings
    reviveTimer(this); // 如果已取消，先恢复定时器
    if (this._reversed && !this._reverse) this.reversed = false; // 如果反转状态不一致，修正反转状态
    // Rendering before updating the completed flag to prevent skips and to make sure the properties are not overridden
    // Setting the iterationTime at the end to force the rendering to happend backwards, otherwise calling .reset() on Timelines might not render children in the right order
    // NOTE: This is only required for Timelines and might be better to move to the Timeline class?
    this._iterationTime = this.iterationDuration; // 设置迭代时间为迭代持续时间
    // Set tickMode to tickModes.FORCE to force rendering
    tick(this, 0, 1, internalRender, tickModes.FORCE); // 强制渲染
    // Reset timer properties after revive / render to make sure the props are not updated again
    resetTimerProperties(this); // 重置定时器属性
    // Also reset children properties
    if (this._hasChildren) {
      forEachChildren(this, resetTimerProperties); // 重置所有子对象属性
    }
    return this; // 返回自身
  } // 重置定时器

  /**
   * @param  {Number} internalRender
   * @return {this}
   */
  init(internalRender = 0) {
    this.fps = this._fps; // 设置帧率
    this.speed = this._speed; // 设置速度
    // Manually calling .init() on timelines should render all children intial state
    // Forces all children to render once then render to 0 when reseted
    if (!internalRender && this._hasChildren) {
      tick(this, this.duration, 1, internalRender, tickModes.FORCE); // 强制渲染所有子对象
    }
    this.reset(internalRender); // 重置定时器
    // Make sure to set autoplay to false to child timers so it doesn't attempt to autoplay / link
    const autoplay = this._autoplay; // 获取自动播放状态
    if (autoplay === true) {
      this.resume(); // 如果自动播放为true，恢复定时器
    } else if (autoplay && !isUnd(/** @type {ScrollObserver} */(autoplay).linked)) {
      /** @type {ScrollObserver} */(autoplay).link(this); // 如果自动播放是滚动观察器且未链接，则链接
    }
    return this; // 返回自身
  } // 初始化定时器

  /** @return {this} */
  resetTime() {
    const timeScale = 1 / (this._speed * engine._speed); // 计算时间缩放
    this._startTime = now() - (this._currentTime + this._delay) * timeScale; // 重置开始时间
    return this; // 返回自身
  } // 重置时间

  /** @return {this} */
  pause() {
    if (this.paused) return this; // 如果已暂停，直接返回
    this.paused = true; // 设置暂停状态
    this.onPause(this); // 调用暂停回调
    return this; // 返回自身
  } // 暂停定时器

  /** @return {this} */
  resume() {
    if (!this.paused) return this; // 如果未暂停，直接返回
    this.paused = false; // 设置非暂停状态
    // We can safely imediatly render a timer that has no duration and no children
    if (this.duration <= minValue && !this._hasChildren) {
      tick(this, minValue, 0, 0, tickModes.FORCE); // 对于无持续时间且无子对象的定时器，立即渲染
    } else {
      if (!this._running) {
        addChild(engine, this); // 添加到引擎
        engine._hasChildren = true; // 设置引擎有子对象
        this._running = true; // 设置运行状态
      }
      this.resetTime(); // 重置时间
      // Forces the timer to advance by at least one frame when the next tick occurs
      this._startTime -= 12; // 强制定时器在下次时钟时至少前进一帧
      engine.wake(); // 唤醒引擎
    }
    return this; // 返回自身
  } // 恢复定时器

  /** @return {this} */
  restart() {
    return this.reset(0).resume(); // 重置并恢复定时器
  } // 重启定时器

  /**
   * @param  {Number} time
   * @param  {Boolean|Number} [muteCallbacks]
   * @param  {Boolean|Number} [internalRender]
   * @return {this}
   */
  seek(time, muteCallbacks = 0, internalRender = 0) {
    // Recompose the tween siblings in case the timer has been cancelled
    reviveTimer(this); // 如果定时器已取消，重新组合补间兄弟
    // If you seek a completed animation, otherwise the next play will starts at 0
    this.completed = false; // 设置未完成状态
    const isPaused = this.paused; // 保存当前暂停状态
    this.paused = true; // 设置暂停状态
    // timer, time, muteCallbacks, internalRender, tickMode
    tick(this, time + this._delay, ~~muteCallbacks, ~~internalRender, tickModes.AUTO); // 跳转到指定时间
    return isPaused ? this : this.resume(); // 如果之前暂停则返回自身，否则恢复
  } // 跳转到指定时间

  /** @return {this} */
  alternate() {
    const reversed = this._reversed; // 获取当前反转状态
    const count = this.iterationCount; // 获取迭代次数
    const duration = this.iterationDuration; // 获取迭代持续时间
    // Calculate the maximum iterations possible given the iteration duration
    const iterations = count === Infinity ? floor(maxValue / duration) : count; // 计算最大可能的迭代次数
    this._reversed = +(this._alternate && !(iterations % 2) ? reversed : !reversed); // 设置反转状态
    if (count === Infinity) {
      // Handle infinite loops to loop on themself
      this.iterationProgress = this._reversed ? 1 - this.iterationProgress : this.iterationProgress; // 处理无限循环
    } else {
      this.seek((duration * iterations) - this._currentTime); // 跳转到指定时间
    }
    this.resetTime(); // 重置时间
    return this; // 返回自身
  } // 交替播放

  /** @return {this} */
  play() {
    if (this._reversed) this.alternate(); // 如果反转，先交替
    return this.resume(); // 恢复播放
  } // 播放

  /** @return {this} */
  reverse() {
    if (!this._reversed) this.alternate(); // 如果未反转，先交替
    return this.resume(); // 恢复播放
  } // 反转播放

  // TODO: Move all the animation / tweens / children related code to Animation / Timeline

  /** @return {this} */
  cancel() {
    if (this._hasChildren) {
      forEachChildren(this, (/** @type {Renderable} */child) => child.cancel(), true); // 取消所有子对象
    } else {
      forEachChildren(this, removeTweenSliblings); // 移除所有补间兄弟
    }
    this._cancelled = 1; // 设置取消状态
    // Pausing the timer removes it from the engine
    return this.pause(); // 暂停定时器
  } // 取消定时器

  /**
   * @param  {Number} newDuration
   * @return {this}
   */
  stretch(newDuration) {
    const currentDuration = this.duration; // 获取当前持续时间
    const normlizedDuration = normalizeTime(newDuration); // 标准化新持续时间
    if (currentDuration === normlizedDuration) return this; // 如果持续时间相同，直接返回
    const timeScale = newDuration / currentDuration; // 计算时间缩放
    const isSetter = newDuration <= minValue; // 是否为设置器
    this.duration = isSetter ? minValue : normlizedDuration; // 设置持续时间
    this.iterationDuration = isSetter ? minValue : normalizeTime(this.iterationDuration * timeScale); // 设置迭代持续时间
    this._offset *= timeScale; // 调整偏移量
    this._delay *= timeScale; // 调整延迟时间
    this._loopDelay *= timeScale; // 调整循环延迟
    return this; // 返回自身
  } // 拉伸定时器持续时间

 /**
   * Cancels the timer by seeking it back to 0 and reverting the attached scroller if necessary
   * @return {this}
   */
  revert() {
    tick(this, 0, 1, 0, tickModes.AUTO); // 跳转到开始位置
    const ap = /** @type {ScrollObserver} */(this._autoplay); // 获取自动播放对象
    if (ap && ap.linked && ap.linked === this) ap.revert(); // 如果自动播放已链接且链接的是当前对象，则恢复
    return this.cancel(); // 取消定时器
  } // 恢复定时器到初始状态

 /**
   * Imediatly completes the timer, cancels it and triggers the onComplete callback
   * @return {this}
   */
  complete() {
    return this.seek(this.duration).cancel(); // 跳转到结束位置并取消
  } // 立即完成定时器

  /**
   * @param  {Callback<this>} [callback]
   * @return {Promise}
   */
  then(callback = noop) {
    const then = this.then; // 保存原始的then方法
    const onResolve = () => {
      // this.then = null prevents infinite recursion if returned by an async function
      // https://github.com/juliangarnierorg/anime-beta/issues/26
      this.then = null; // 防止无限递归
      callback(this); // 执行回调
      this.then = then; // 恢复then方法
      this._resolve = noop; // 重置resolve函数
    }
    return new Promise(r => {
      this._resolve = () => r(onResolve()); // 设置resolve函数
      // Make sure to resolve imediatly if the timer has already completed
      if (this.completed) this._resolve(); // 如果已完成，立即解析
      return this; // 返回自身
    });
  } // Promise支持

}


/**
 * @param {TimerParams} [parameters]
 * @return {Timer}
 */
export const createTimer = parameters => new Timer(parameters, null, 0).init(); // 创建定时器的工厂函数