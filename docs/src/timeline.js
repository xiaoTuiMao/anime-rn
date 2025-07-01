/// <reference path='./types.js' />

import {
  globals,
} from './globals.js';

import {
  relativeValuesExecRgx,
  minValue,
  tickModes,
  compositionTypes,
} from './consts.js';

import {
  isObj,
  isFnc,
  isUnd,
  isNil,
  isNum,
  addChild,
  forEachChildren,
  stringStartsWith,
  mergeObjects,
  clampInfinity,
  normalizeTime,
  isStr,
  round,
} from './helpers.js';

import {
  getRelativeValue, setValue,
} from './values.js';

import {
  parseTargets,
} from './targets.js';

import {
  Timer,
} from './timer.js';

import {
  JSAnimation,
  cleanInlineStyles,
} from './animation.js';

import {
  tick,
} from './render.js';

import {
  parseEasings,
} from './eases.js';

import {
  remove,
} from './utils.js';

/**
 * @typedef {Number|String|Function} TimePosition
 */ // 时间位置类型

/**
 * Timeline's children offsets positions parser
 * @param  {Timeline} timeline
 * @param  {String} timePosition
 * @return {Number}
 */
const getPrevChildOffset = (timeline, timePosition) => {
  if (stringStartsWith(timePosition, '<')) {
    const goToPrevAnimationOffset = timePosition[1] === '<'; // 是否跳转到前一个动画偏移
    const prevAnimation = /** @type {Tickable} */(timeline._tail); // 获取前一个动画
    const prevOffset = prevAnimation ? prevAnimation._offset + prevAnimation._delay : 0; // 计算前一个偏移
    return goToPrevAnimationOffset ? prevOffset : prevOffset + prevAnimation.duration; // 返回偏移量
  }
} // 获取前一个子对象的偏移位置

/**
 * @param  {Timeline} timeline
 * @param  {TimePosition} [timePosition]
 * @return {Number}
 */
export const parseTimelinePosition = (timeline, timePosition) => {
  let tlDuration = timeline.iterationDuration; // 获取时间线迭代持续时间
  if (tlDuration === minValue) tlDuration = 0; // 如果是最小值，设为0
  if (isUnd(timePosition)) return tlDuration; // 如果时间位置未定义，返回持续时间
  if (isNum(+timePosition)) return +timePosition; // 如果是数字，直接返回
  const timePosStr = /** @type {String} */(timePosition); // 转换为字符串
  const tlLabels = timeline ? timeline.labels : null; // 获取时间线标签
  const hasLabels = !isNil(tlLabels); // 是否有标签
  const prevOffset = getPrevChildOffset(timeline, timePosStr); // 获取前一个子对象偏移
  const hasSibling = !isUnd(prevOffset); // 是否有兄弟对象
  const matchedRelativeOperator = relativeValuesExecRgx.exec(timePosStr); // 匹配相对值操作符
  if (matchedRelativeOperator) {
    const fullOperator = matchedRelativeOperator[0]; // 获取完整操作符
    const split = timePosStr.split(fullOperator); // 分割字符串
    const labelOffset = hasLabels && split[0] ? tlLabels[split[0]] : tlDuration; // 获取标签偏移
    const parsedOffset = hasSibling ? prevOffset : hasLabels ? labelOffset : tlDuration; // 解析偏移
    const parsedNumericalOffset = +split[1]; // 解析数值偏移
    return getRelativeValue(parsedOffset, parsedNumericalOffset, fullOperator[0]); // 返回相对值
  } else {
    return hasSibling ? prevOffset :
           hasLabels ? !isUnd(tlLabels[timePosStr]) ? tlLabels[timePosStr] :
           tlDuration : tlDuration; // 返回解析后的位置
  }
} // 解析时间线位置

/**
 * @param {Timeline} tl
 * @return {Number}
 */
function getTimelineTotalDuration(tl) {
  return clampInfinity(((tl.iterationDuration + tl._loopDelay) * tl.iterationCount) - tl._loopDelay) || minValue; // 计算时间线总持续时间
} // 获取时间线总持续时间

/**
 * @overload
 * @param  {TimerParams} childParams
 * @param  {Timeline} tl
 * @param  {Number} timePosition
 * @return {Timeline}
 *
 * @overload
 * @param  {AnimationParams} childParams
 * @param  {Timeline} tl
 * @param  {Number} timePosition
 * @param  {TargetsParam} targets
 * @param  {Number} [index]
 * @param  {Number} [length]
 * @return {Timeline}
 *
 * @param  {TimerParams|AnimationParams} childParams
 * @param  {Timeline} tl
 * @param  {Number} timePosition
 * @param  {TargetsParam} [targets]
 * @param  {Number} [index]
 * @param  {Number} [length]
 */
function addTlChild(childParams, tl, timePosition, targets, index, length) {
  const isSetter = isNum(childParams.duration) && /** @type {Number} */(childParams.duration) <= minValue; // 是否为设置器
  // Offset the tl position with -minValue for 0 duration animations or .set() calls in order to align their end value with the defined position
  const adjustedPosition = isSetter ? timePosition - minValue : timePosition; // 调整位置
  tick(tl, adjustedPosition, 1, 1, tickModes.AUTO); // 执行时钟
  const tlChild = targets ?
    new JSAnimation(targets,/** @type {AnimationParams} */(childParams), tl, adjustedPosition, false, index, length) :
    new Timer(/** @type {TimerParams} */(childParams), tl, adjustedPosition); // 创建时间线子对象
  tlChild.init(1); // 初始化子对象
  // TODO: Might be better to insert at a position relative to startTime?
  addChild(tl, tlChild); // 添加子对象
  forEachChildren(tl, (/** @type {Renderable} */child) => {
    const childTLOffset = child._offset + child._delay; // 计算子对象时间线偏移
    const childDur = childTLOffset + child.duration; // 计算子对象持续时间
    if (childDur > tl.iterationDuration) tl.iterationDuration = childDur; // 更新迭代持续时间
  });
  tl.duration = getTimelineTotalDuration(tl); // 更新总持续时间
  return tl; // 返回时间线
} // 添加时间线子对象

export class Timeline extends Timer {

  /**
   * @param {TimelineParams} [parameters]
   */
  constructor(parameters = {}) {
    super(/** @type {TimerParams&TimelineParams} */(parameters), null, 0); // 调用父类构造函数
    /** @type {Number} */
    this.duration = 0; // TL duration starts at 0 and grows when adding children - 时间线持续时间从0开始，添加子对象时增长
    /** @type {Record<String, Number>} */
    this.labels = {}; // 标签映射
    const defaultsParams = parameters.defaults; // 默认参数
    const globalDefaults = globals.defaults; // 全局默认值
    /** @type {DefaultsParams} */
    this.defaults = defaultsParams ? mergeObjects(defaultsParams, globalDefaults) : globalDefaults; // 合并默认值
    /** @type {Callback<this>} */
    this.onRender = parameters.onRender || globalDefaults.onRender; // 渲染回调
    const tlPlaybackEase = setValue(parameters.playbackEase, globalDefaults.playbackEase); // 播放缓动
    this._ease = tlPlaybackEase ? parseEasings(tlPlaybackEase) : null; // 解析缓动函数
    /** @type {Number} */
    this.iterationDuration = 0; // 迭代持续时间
  }

  /**
   * @overload
   * @param {TargetsParam} a1
   * @param {AnimationParams} a2
   * @param {TimePosition} [a3]
   * @return {this}
   *
   * @overload
   * @param {TimerParams} a1
   * @param {TimePosition} [a2]
   * @return {this}
   *
   * @param {TargetsParam|TimerParams} a1
   * @param {AnimationParams|TimePosition} a2
   * @param {TimePosition} [a3]
   */
  add(a1, a2, a3) {
    const isAnim = isObj(a2); // 是否为动画对象
    const isTimer = isObj(a1); // 是否为定时器对象
    if (isAnim || isTimer) {
      this._hasChildren = true;
      if (isAnim) {
        const childParams = /** @type {AnimationParams} */(a2);
        // Check for function for children stagger positions
        if (isFnc(a3)) {
          const staggeredPosition = /** @type {Function} */(a3);
          const parsedTargetsArray = parseTargets(/** @type {TargetsParam} */(a1));
          // Store initial duration before adding new children that will change the duration
          const tlDuration = this.duration;
          // Store initial _iterationDuration before adding new children that will change the duration
          const tlIterationDuration = this.iterationDuration;
          // Store the original id in order to add specific indexes to the new animations ids
          const id = childParams.id;
          let i = 0;
          const parsedLength = parsedTargetsArray.length;
          parsedTargetsArray.forEach((/** @type {Target} */target) => {
            // Create a new parameter object for each staggered children
            const staggeredChildParams = { ...childParams };
            // Reset the duration of the timeline iteration before each stagger to prevent wrong start value calculation
            this.duration = tlDuration;
            this.iterationDuration = tlIterationDuration;
            if (!isUnd(id)) staggeredChildParams.id = id + '-' + i;
            addTlChild(
              staggeredChildParams,
              this,
              staggeredPosition(target, i, parsedLength, this),
              target,
              i,
              parsedLength
            );
            i++;
          });
        } else {
          addTlChild(
            childParams,
            this,
            parseTimelinePosition(this, a3),
            /** @type {TargetsParam} */(a1),
          );
        }
      } else {
        // It's a Timer
        addTlChild(
          /** @type TimerParams */(a1),
          this,
          parseTimelinePosition(this,/** @type TimePosition */(a2)),
        );
      }
      return this.init(1); // 1 = internalRender
    }
  }

  /**
   * @overload
   * @param {Tickable} [synced]
   * @param {TimePosition} [position]
   * @return {this}
   *
   * @overload
   * @param {globalThis.Animation} [synced]
   * @param {TimePosition} [position]
   * @return {this}
   *
   * @overload
   * @param {WAAPIAnimation} [synced]
   * @param {TimePosition} [position]
   * @return {this}
   *
   * @param {Tickable|WAAPIAnimation|globalThis.Animation} [synced]
   * @param {TimePosition} [position]
   */
  sync(synced, position) {
    if (isUnd(synced) || synced && isUnd(synced.pause)) return this;
    synced.pause();
    const duration = +(/** @type {globalThis.Animation} */(synced).effect ? /** @type {globalThis.Animation} */(synced).effect.getTiming().duration : /** @type {Tickable} */(synced).duration);
    return this.add(synced, { currentTime: [0, duration], duration, ease: 'linear' }, position);
  }

  /**
   * @param  {TargetsParam} targets
   * @param  {AnimationParams} parameters
   * @param  {TimePosition} [position]
   * @return {this}
   */
  set(targets, parameters, position) {
    if (isUnd(parameters)) return this;
    parameters.duration = minValue;
    parameters.composition = compositionTypes.replace;
    return this.add(targets, parameters, position);
  }

  /**
   * @param {Callback<Timer>} callback
   * @param {TimePosition} [position]
   * @return {this}
   */
  call(callback, position) {
    if (isUnd(callback) || callback && !isFnc(callback)) return this;
    return this.add({ duration: 0, onComplete: () => callback(this) }, position);
  }

  /**
   * @param {String} labelName
   * @param {TimePosition} [position]
   * @return {this}
   *
   */
  label(labelName, position) {
    if (isUnd(labelName) || labelName && !isStr(labelName)) return this;
    this.labels[labelName] = parseTimelinePosition(this,/** @type TimePosition */(position));
    return this;
  }

  /**
   * @param  {TargetsParam} targets
   * @param  {String} [propertyName]
   * @return {this}
   */
  remove(targets, propertyName) {
    remove(targets, this, propertyName);
    return this;
  }

  /**
   * @param  {Number} newDuration
   * @return {this}
   */
  stretch(newDuration) {
    const currentDuration = this.duration;
    if (currentDuration === normalizeTime(newDuration)) return this;
    const timeScale = newDuration / currentDuration;
    const labels = this.labels;
    forEachChildren(this, (/** @type {JSAnimation} */child) => child.stretch(child.duration * timeScale));
    for (let labelName in labels) labels[labelName] *= timeScale;
    return super.stretch(newDuration);
  }

  /**
   * @return {this}
   */
  refresh() {
    forEachChildren(this, (/** @type {JSAnimation} */child) => {
      if (child.refresh) child.refresh();
    });
    return this;
  }

  /**
   * @return {this}
   */
  revert() {
    super.revert();
    forEachChildren(this, (/** @type {JSAnimation} */child) => child.revert, true);
    return cleanInlineStyles(this);
  }

  /**
   * @param  {Callback<this>} [callback]
   * @return {Promise}
   */
  then(callback) {
    return super.then(callback);
  }
}

/**
 * @param {TimelineParams} [parameters]
 * @return {Timeline}
 */
export const createTimeline = parameters => new Timeline(parameters).init();