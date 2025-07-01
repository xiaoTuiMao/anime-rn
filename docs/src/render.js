/// <reference path='./types.js' />

import {
  globals,
} from './globals.js';

import {
  tweenTypes,
  valueTypes,
  tickModes,
  compositionTypes,
  emptyString,
  transformsFragmentStrings,
  transformsSymbol,
  minValue,
} from './consts.js';

import {
  now,
  clamp,
  round,
  interpolate,
  forEachChildren,
} from './helpers.js';

/**
 * 渲染函数 - 核心渲染引擎，负责执行动画的渲染逻辑
 * @param  {Tickable} tickable - 可渲染对象（动画或定时器）
 * @param  {Number} time - 当前时间
 * @param  {Number} muteCallbacks - 是否静音回调函数
 * @param  {Number} internalRender - 是否为内部渲染
 * @param  {tickModes} tickMode - 渲染模式
 * @return {Number}
 */
export const render = (tickable, time, muteCallbacks, internalRender, tickMode) => {

  const parent = tickable.parent;
  const duration = tickable.duration;
  const completed = tickable.completed;
  const iterationDuration = tickable.iterationDuration;
  const iterationCount = tickable.iterationCount;
  const _currentIteration = tickable._currentIteration;
  const _loopDelay = tickable._loopDelay;
  const _reversed = tickable._reversed;
  const _alternate = tickable._alternate;
  const _hasChildren = tickable._hasChildren;
  const tickableDelay = tickable._delay;
  const tickablePrevAbsoluteTime = tickable._currentTime; // TODO: rename ._currentTime to ._absoluteCurrentTime

  // 计算时间相关变量
  const tickableEndTime = tickableDelay + iterationDuration;
  const tickableAbsoluteTime = time - tickableDelay;
  const tickablePrevTime = clamp(tickablePrevAbsoluteTime, -tickableDelay, duration);
  const tickableCurrentTime = clamp(tickableAbsoluteTime, -tickableDelay, duration);
  const deltaTime = tickableAbsoluteTime - tickablePrevAbsoluteTime;
  const isCurrentTimeAboveZero = tickableCurrentTime > 0;
  const isCurrentTimeEqualOrAboveDuration = tickableCurrentTime >= duration;
  const isSetter = duration <= minValue;
  const forcedTick = tickMode === tickModes.FORCE;

  let isOdd = 0;
  let iterationElapsedTime = tickableAbsoluteTime;
  // 渲染检查
  // 用于检查子元素是否已渲染，以便在父定时器上触发onRender回调
  let hasRendered = 0;

  // 仅在必要时执行"昂贵的"迭代计算
  if (iterationCount > 1) {
    // 按位NOT运算符在浏览器中通常比Math.floor()更快
    const currentIteration = ~~(tickableCurrentTime / (iterationDuration + (isCurrentTimeEqualOrAboveDuration ? 0 : _loopDelay)));
    tickable._currentIteration = clamp(currentIteration, 0, iterationCount);
    // 当到达动画结束时，防止迭代计数超过最大迭代次数
    if (isCurrentTimeEqualOrAboveDuration) tickable._currentIteration--;
    isOdd = tickable._currentIteration % 2;
    iterationElapsedTime = tickableCurrentTime % (iterationDuration + _loopDelay) || 0;
  }

  // 检查_reversed和(_alternate && isOdd)中是否恰好有一个为true
  const isReversed = _reversed ^ (_alternate && isOdd);
  const _ease = /** @type {Renderable} */(tickable)._ease;
  let iterationTime = isCurrentTimeEqualOrAboveDuration ? isReversed ? 0 : duration : isReversed ? iterationDuration - iterationElapsedTime : iterationElapsedTime;
  if (_ease) iterationTime = iterationDuration * _ease(iterationTime / iterationDuration) || 0;
  const isRunningBackwards = (parent ? parent.backwards : tickableAbsoluteTime < tickablePrevAbsoluteTime) ? !isReversed : !!isReversed;

  // 更新tickable的时间状态
  tickable._currentTime = tickableAbsoluteTime;
  tickable._iterationTime = iterationTime;
  tickable.backwards = isRunningBackwards;

  // 处理动画开始逻辑
  if (isCurrentTimeAboveZero && !tickable.began) {
    tickable.began = true;
    if (!muteCallbacks && !(parent && (isRunningBackwards || !parent.began))) {
      tickable.onBegin(/** @type {CallbackArgument} */(tickable));
    }
  } else if (tickableAbsoluteTime <= 0) {
    tickable.began = false;
  }

  // 仅为没有子元素的tickable触发onLoop，否则在tick函数中调用onLoop回调
  // 确保在渲染前触发onLoop，以允许.refresh()获取当前值
  if (!muteCallbacks && !_hasChildren && isCurrentTimeAboveZero && tickable._currentIteration !== _currentIteration) {
    tickable.onLoop(/** @type {CallbackArgument} */(tickable));
  }

  // 渲染条件检查
  if (
    forcedTick ||
    tickMode === tickModes.AUTO && (
      time >= tickableDelay && time <= tickableEndTime || // 正常渲染
      time <= tickableDelay && tickablePrevTime > tickableDelay || // 播放头在动画开始时间之前，确保动画处于初始状态
      time >= tickableEndTime && tickablePrevTime !== duration // 播放头在动画结束时间之后，确保动画处于结束状态
    ) ||
    iterationTime >= tickableEndTime && tickablePrevTime !== duration ||
    iterationTime <= tickableDelay && tickablePrevTime > 0 ||
    time <= tickablePrevTime && tickablePrevTime === duration && completed || // 如果对已完成的动画进行seek操作，强制渲染
    isCurrentTimeEqualOrAboveDuration && !completed && isSetter // 这防止0持续时间的tickable被跳过
  ) {

    if (isCurrentTimeAboveZero) {
      // 在渲染前触发onUpdate回调
      tickable.computeDeltaTime(tickablePrevTime);
      if (!muteCallbacks) tickable.onBeforeUpdate(/** @type {CallbackArgument} */(tickable));
    }

    // 开始tween渲染
    if (!_hasChildren) {

      // 时间跳跃超过globals.tickThreshold，认为这是手动tick
      const forcedRender = forcedTick || (isRunningBackwards ? deltaTime * -1 : deltaTime) >= globals.tickThreshold;
      const absoluteTime = tickable._offset + (parent ? parent._offset : 0) + tickableDelay + iterationTime;

      // 只有Animation可以有tween，Timer返回undefined
      let tween = /** @type {Tween} */(/** @type {JSAnimation} */(tickable)._head);
      let tweenTarget;
      let tweenStyle;
      let tweenTargetTransforms;
      let tweenTargetTransformsProperties;
      let tweenTransformsNeedUpdate = 0;

      while (tween) {

        const tweenComposition = tween._composition;
        const tweenCurrentTime = tween._currentTime;
        const tweenChangeDuration = tween._changeDuration;
        const tweenAbsEndTime = tween._absoluteStartTime + tween._changeDuration;
        const tweenNextRep = tween._nextRep;
        const tweenPrevRep = tween._prevRep;
        const tweenHasComposition = tweenComposition !== compositionTypes.none;

        // tween渲染条件检查
        if ((forcedRender || (
            (tweenCurrentTime !== tweenChangeDuration || absoluteTime <= tweenAbsEndTime + (tweenNextRep ? tweenNextRep._delay : 0)) &&
            (tweenCurrentTime !== 0 || absoluteTime >= tween._absoluteStartTime)
          )) && (!tweenHasComposition || (
            !tween._isOverridden &&
            (!tween._isOverlapped || absoluteTime <= tweenAbsEndTime) &&
            (!tweenNextRep || (tweenNextRep._isOverridden || absoluteTime <= tweenNextRep._absoluteStartTime)) &&
            (!tweenPrevRep || (tweenPrevRep._isOverridden || (absoluteTime >= (tweenPrevRep._absoluteStartTime + tweenPrevRep._changeDuration) + tween._delay)))
          ))
        ) {

          const tweenNewTime = tween._currentTime = clamp(iterationTime - tween._startTime, 0, tweenChangeDuration);
          const tweenProgress = tween._ease(tweenNewTime / tween._updateDuration);
          const tweenModifier = tween._modifier;
          const tweenValueType = tween._valueType;
          const tweenType = tween._tweenType;
          const tweenIsObject = tweenType === tweenTypes.OBJECT;
          const tweenIsNumber = tweenValueType === valueTypes.NUMBER;
          // 仅当最终值是字符串时才对中间帧值进行四舍五入
          const tweenPrecision = (tweenIsNumber && tweenIsObject) || tweenProgress === 0 || tweenProgress === 1 ? -1 : globals.precision;

          // 重新组合tween值
          /** @type {String|Number} */
          let value;
          /** @type {Number} */
          let number;

          // 根据值类型进行插值计算
          if (tweenIsNumber) {
            value = number = /** @type {Number} */(tweenModifier(round(interpolate(tween._fromNumber, tween._toNumber,  tweenProgress ), tweenPrecision )));
          } else if (tweenValueType === valueTypes.UNIT) {
            // 对值进行四舍五入可以加速字符串组合
            number = /** @type {Number} */(tweenModifier(round(interpolate(tween._fromNumber, tween._toNumber,  tweenProgress ), tweenPrecision)));
            value = `${number}${tween._unit}`;
          } else if (tweenValueType === valueTypes.COLOR) {
            const fn = tween._fromNumbers;
            const tn = tween._toNumbers;
            const r = round(clamp(/** @type {Number} */(tweenModifier(interpolate(fn[0], tn[0], tweenProgress))), 0, 255), 0);
            const g = round(clamp(/** @type {Number} */(tweenModifier(interpolate(fn[1], tn[1], tweenProgress))), 0, 255), 0);
            const b = round(clamp(/** @type {Number} */(tweenModifier(interpolate(fn[2], tn[2], tweenProgress))), 0, 255), 0);
            const a = clamp(/** @type {Number} */(tweenModifier(round(interpolate(fn[3], tn[3], tweenProgress), tweenPrecision))), 0, 1);
            value = `rgba(${r},${g},${b},${a})`;
            if (tweenHasComposition) {
              const ns = tween._numbers;
              ns[0] = r;
              ns[1] = g;
              ns[2] = b;
              ns[3] = a;
            }
          } else if (tweenValueType === valueTypes.COMPLEX) {
            // 复杂值类型处理（如CSS属性值）
            value = tween._strings[0];
            for (let j = 0, l = tween._toNumbers.length; j < l; j++) {
              const n = /** @type {Number} */(tweenModifier(round(interpolate(tween._fromNumbers[j], tween._toNumbers[j], tweenProgress), tweenPrecision)));
              const s = tween._strings[j + 1];
              value += `${s ? n + s : n}`;
              if (tweenHasComposition) {
                tween._numbers[j] = n;
              }
            }
          }

          // 对于加法tween和Animatables
          if (tweenHasComposition) {
            tween._number = number;
          }

          // 实际应用值到目标对象
          if (!internalRender && tweenComposition !== compositionTypes.blend) {

            const tweenProperty = tween.property;
            tweenTarget = tween.target;

            if (tweenIsObject) {
              // 对象属性设置
              tweenTarget[tweenProperty] = value;
            } else if (tweenType === tweenTypes.ATTRIBUTE) {
              // DOM属性设置
              /** @type {DOMTarget} */(tweenTarget).setAttribute(tweenProperty, /** @type {String} */(value));
            } else {
              // CSS样式设置
              tweenStyle = /** @type {DOMTarget} */(tweenTarget).style;
              if (tweenType === tweenTypes.TRANSFORM) {
                // 变换属性处理
                if (tweenTarget !== tweenTargetTransforms) {
                  tweenTargetTransforms = tweenTarget;
                  // 注意：直接在tween属性中引用缓存的transforms可能会稍微快一点，但似乎会增加内存使用量。
                  tweenTargetTransformsProperties = tweenTarget[transformsSymbol];
                }
                tweenTargetTransformsProperties[tweenProperty] = value;
                tweenTransformsNeedUpdate = 1;
              } else if (tweenType === tweenTypes.CSS) {
                // 普通CSS属性
                tweenStyle[tweenProperty] = value;
              } else if (tweenType === tweenTypes.CSS_VAR) {
                // CSS变量
                tweenStyle.setProperty(tweenProperty,/** @type {String} */(value));
              }
            }

            if (isCurrentTimeAboveZero) hasRendered = 1;

          } else {
            // 用于组合时间轴tween而不进行实际渲染
            tween._value = value;
          }

        }

        // 注意：可能的改进：使用translate(x,y) / translate3d(x,y,z)语法
        // 来减少字符串组合的内存使用量
        if (tweenTransformsNeedUpdate && tween._renderTransforms) {
          let str = emptyString;
          for (let key in tweenTargetTransformsProperties) {
            str += `${transformsFragmentStrings[key]}${tweenTargetTransformsProperties[key]}) `;
          }
          tweenStyle.transform = str;
          tweenTransformsNeedUpdate = 0;
        }

        tween = tween._next;
      }

      // 触发渲染回调
      if (!muteCallbacks && hasRendered) {
        /** @type {JSAnimation} */(tickable).onRender(/** @type {JSAnimation} */(tickable));
      }
    }

    // 触发更新回调
    if (!muteCallbacks && isCurrentTimeAboveZero) {
      tickable.onUpdate(/** @type {CallbackArgument} */(tickable));
    }

  }

  // 结束tween渲染

  // 对时间轴上的setter进行不同处理，并允许在向后搜索时重新触发onComplete回调
  if (parent && isSetter) {
    if (!muteCallbacks && (
      (parent.began && !isRunningBackwards && tickableAbsoluteTime >= duration && !completed) ||
      (isRunningBackwards && tickableAbsoluteTime <= minValue && completed)
    )) {
      tickable.onComplete(/** @type {CallbackArgument} */(tickable));
      tickable.completed = !isRunningBackwards;
    }
  // 如果currentTime既大于0又至少等于duration，处理正常的onComplete或无限循环
  } else if (isCurrentTimeAboveZero && isCurrentTimeEqualOrAboveDuration) {
    if (iterationCount === Infinity) {
      // 用持续时间偏移tickable的_startTime，将_currentTime重置为0并继续无限定时器
      tickable._startTime += tickable.duration;
    } else if (tickable._currentIteration >= iterationCount - 1) {
      // 通过将paused设置为true，我们告诉引擎循环不要渲染这个tickable，并在下一次tick时从列表中移除它
      tickable.paused = true;
      if (!completed && !_hasChildren) {
        // 如果tickable有子元素，只有在tick函数中所有子元素都完成时才触发onComplete()
        tickable.completed = true;
        if (!muteCallbacks && !(parent && (isRunningBackwards || !parent.began))) {
          tickable.onComplete(/** @type {CallbackArgument} */(tickable));
          tickable._resolve(/** @type {CallbackArgument} */(tickable));
        }
      }
    }
  // 否则将completed标志设置为false
  } else {
    tickable.completed = false;
  }

  // 注意：hasRendered * direction（向后为负）这样我们可以完全移除tickable.backwards属性？
  return hasRendered;
}

/**
 * tick函数 - 处理可渲染对象的tick逻辑，包括子元素的渲染
 * @param  {Tickable} tickable - 可渲染对象
 * @param  {Number} time - 当前时间
 * @param  {Number} muteCallbacks - 是否静音回调函数
 * @param  {Number} internalRender - 是否为内部渲染
 * @param  {Number} tickMode - tick模式
 * @return {void}
 */
export const tick = (tickable, time, muteCallbacks, internalRender, tickMode) => {
  const _currentIteration = tickable._currentIteration;
  // 渲染当前tickable
  render(tickable, time, muteCallbacks, internalRender, tickMode);

  // 如果有子元素，处理时间轴的子元素渲染
  if (tickable._hasChildren) {
    const tl = /** @type {Timeline} */(tickable);
    const tlIsRunningBackwards = tl.backwards;
    const tlChildrenTime = internalRender ? time : tl._iterationTime;
    const tlCildrenTickTime = now();

    let tlChildrenHasRendered = 0;
    let tlChildrenHaveCompleted = true;

    // 如果时间轴向前循环，我们需要手动触发被跳过的子元素回调
    if (!internalRender && tl._currentIteration !== _currentIteration) {
      const tlIterationDuration = tl.iterationDuration;
      forEachChildren(tl, (/** @type {JSAnimation} */child) => {
        if (!tlIsRunningBackwards) {
          // 如果子元素在循环时没有完成，强制内部渲染以触发回调
          if (!child.completed && !child.backwards && child._currentTime < child.iterationDuration) {
            render(child, tlIterationDuration, muteCallbacks, 1, tickModes.FORCE);
          }
          // 重置它们的began和completed标志，以允许在下一次迭代时重新触发回调
          child.began = false;
          child.completed = false;
        } else {
          const childDuration = child.duration;
          const childStartTime = child._offset + child._delay;
          const childEndTime = childStartTime + childDuration;
          // 在反向时为时间轴边缘的子元素触发onComplete回调
          if (!muteCallbacks && childDuration <= minValue && (!childStartTime || childEndTime === tlIterationDuration)) {
            child.onComplete(child);
          }
        }
      });
      if (!muteCallbacks) tl.onLoop(/** @type {CallbackArgument} */(tl));
    }

    // 渲染所有子元素
    forEachChildren(tl, (/** @type {JSAnimation} */child) => {
      const childTime = round((tlChildrenTime - child._offset) * child._speed, 12); // 使用秒时需要四舍五入
      const childTickMode = child._fps < tl._fps ? child.requestTick(tlCildrenTickTime) : tickMode;
      tlChildrenHasRendered += render(child, childTime, muteCallbacks, internalRender, childTickMode);
      if (!child.completed && tlChildrenHaveCompleted) tlChildrenHaveCompleted = false;
    }, tlIsRunningBackwards);

    // 时间轴上的渲染由其子元素触发，所以需要在渲染子元素后设置
    if (!muteCallbacks && tlChildrenHasRendered) tl.onRender(/** @type {CallbackArgument} */(tl));

    // 一旦所有子元素都完成且当前时间到达末尾，触发时间轴的onComplete()
    if (tlChildrenHaveCompleted && tl._currentTime >= tl.duration) {
      // 确保paused标志为false，以防它在render函数中被跳过
      tl.paused = true;
      if (!tl.completed) {
        tl.completed = true;
        if (!muteCallbacks) {
          tl.onComplete(/** @type {CallbackArgument} */(tl));
          tl._resolve(/** @type {CallbackArgument} */(tl));
        }
      }
    }
  }
}
