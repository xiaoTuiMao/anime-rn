/// <reference path='./types.js' />

import {
  compositionTypes,
  minValue,
} from './consts.js';

import {
  cloneArray,
  addChild,
  removeChild,
  forEachChildren,
} from './helpers.js';

import {
  additive,
  addAdditiveAnimation,
} from './additive.js';

const lookups = {
  /** @type {TweenReplaceLookups} */
  _rep: new WeakMap(), // 替换补间的查找映射
  /** @type {TweenAdditiveLookups} */
  _add: new Map(), // 加法补间的查找映射
} // 补间查找对象

/**
 * @param  {Target} target
 * @param  {String} property
 * @param  {String} lookup
 * @return {TweenPropertySiblings}
 */
export const getTweenSiblings = (target, property, lookup = '_rep') => {
  const lookupMap = lookups[lookup]; // 获取查找映射
  let targetLookup = lookupMap.get(target); // 获取目标的查找对象
  if (!targetLookup) {
    targetLookup = {}; // 如果不存在，创建新的查找对象
    lookupMap.set(target, targetLookup); // 设置到映射中
  }
  return targetLookup[property] ? targetLookup[property] : targetLookup[property] = {
    _head: null, // 头部补间
    _tail: null, // 尾部补间
  } // 返回或创建属性兄弟对象
} // 获取补间兄弟对象

/**
 * @param  {Tween} p
 * @param  {Tween} c
 * @return {Number|Boolean}
 */
const addTweenSortMethod = (p, c) => {
  return p._isOverridden || p._absoluteStartTime > c._absoluteStartTime; // 如果前一个被覆盖或开始时间更晚，则排序在前
} // 补间排序方法

/**
 * @param {Tween} tween
 */
export const overrideTween = tween => {
  tween._isOverlapped = 1; // 设置重叠标志
  tween._isOverridden = 1; // 设置覆盖标志
  tween._changeDuration = minValue; // 设置变化持续时间为最小值
  tween._currentTime = minValue; // 设置当前时间为最小值
} // 覆盖补间

/**
 * @param  {Tween} tween
 * @param  {TweenPropertySiblings} siblings
 * @return {Tween}
 */
export const composeTween = (tween, siblings) => {

  const tweenCompositionType = tween._composition; // 获取补间组合类型

  // Handle replaced tweens - 处理替换补间

  if (tweenCompositionType === compositionTypes.replace) {

    const tweenAbsStartTime = tween._absoluteStartTime; // 获取补间绝对开始时间

    addChild(siblings, tween, addTweenSortMethod, '_prevRep', '_nextRep'); // 添加子补间

    const prevSibling = tween._prevRep; // 获取前一个兄弟

    // Update the previous siblings for composition replace tweens - 更新前一个兄弟的组合替换补间

    if (prevSibling) {

      const prevParent = prevSibling.parent; // 获取前一个兄弟的父对象
      const prevAbsEndTime = prevSibling._absoluteStartTime + prevSibling._changeDuration; // 计算前一个兄弟的绝对结束时间

      // Handle looped animations tween - 处理循环动画补间

      if (
        // Check if the previous tween is from a different animation - 检查前一个补间是否来自不同的动画
        tween.parent.id !== prevParent.id &&
        // Check if the animation has loops - 检查动画是否有循环
        prevParent.iterationCount> 1 &&
        // Check if _absoluteChangeEndTime of last loop overlaps the current tween - 检查最后一个循环的绝对变化结束时间是否与当前补间重叠
        prevAbsEndTime + (prevParent.duration - prevParent.iterationDuration) > tweenAbsStartTime
      ) {

        // TODO: Find a way to only override the iterations overlapping with the tween
        overrideTween(prevSibling); // 覆盖前一个兄弟

        let prevPrevSibling = prevSibling._prevRep; // 获取前一个兄弟的前一个兄弟

        // If the tween was part of a set of keyframes, override its siblings - 如果补间是关键帧集合的一部分，覆盖其兄弟
        while (prevPrevSibling && prevPrevSibling.parent.id === prevParent.id) {
          overrideTween(prevPrevSibling); // 覆盖前一个兄弟的前一个兄弟
          prevPrevSibling = prevPrevSibling._prevRep; // 移动到下一个前一个兄弟
        }

      }

      const absoluteUpdateStartTime = tweenAbsStartTime - tween._delay; // 计算绝对更新开始时间

      if (prevAbsEndTime > absoluteUpdateStartTime) {

        const prevChangeStartTime = prevSibling._startTime; // 获取前一个兄弟的变化开始时间
        const prevTLOffset = prevAbsEndTime - (prevChangeStartTime + prevSibling._updateDuration); // 计算前一个时间线偏移

        prevSibling._changeDuration = absoluteUpdateStartTime - prevTLOffset - prevChangeStartTime; // 设置前一个兄弟的变化持续时间
        prevSibling._currentTime = prevSibling._changeDuration; // 设置前一个兄弟的当前时间
        prevSibling._isOverlapped = 1; // 设置重叠标志

        if (prevSibling._changeDuration < minValue) {
          overrideTween(prevSibling); // 如果变化持续时间小于最小值，覆盖前一个兄弟
        }
      }

      // Pause (and cancel) the parent if it only contains overlapped tweens - 如果父对象只包含重叠的补间，暂停（并取消）父对象

      let pausePrevParentAnimation = true; // 暂停前一个父动画标志

      forEachChildren(prevParent, (/** @type Tween */t) => {
        if (!t._isOverlapped) pausePrevParentAnimation = false; // 如果有未重叠的补间，不暂停
      });

      if (pausePrevParentAnimation) {
        const prevParentTL = prevParent.parent; // 获取前一个父对象的时间线
        if (prevParentTL) {
          let pausePrevParentTL = true; // 暂停前一个父时间线标志
          forEachChildren(prevParentTL, (/** @type JSAnimation */a) => {
            if (a !== prevParent) {
              forEachChildren(a, (/** @type Tween */t) => {
                if (!t._isOverlapped) pausePrevParentTL = false; // 如果有未重叠的补间，不暂停
              });
            }
          });
          if (pausePrevParentTL) {
            prevParentTL.cancel(); // 取消前一个父时间线
          }
        } else {
          prevParent.cancel(); // 取消前一个父对象
          // Previously, calling .cancel() on a timeline child would affect the render order of other children
          // Worked around this by marking it as .completed and using .pause() for safe removal in the engine loop
          // This is no longer needed since timeline tween composition is now handled separatly
          // Keeping this here for reference
          // prevParent.completed = true;
          // prevParent.pause();
        }
      }

    }

    // let nextSibling = tween._nextRep;

    // // All the next siblings are automatically overridden

    // if (nextSibling && nextSibling._absoluteStartTime >= tweenAbsStartTime) {
    //   while (nextSibling) {
    //     overrideTween(nextSibling);
    //     nextSibling = nextSibling._nextRep;
    //   }
    // }

    // if (nextSibling && nextSibling._absoluteStartTime < tweenAbsStartTime) {
    //   while (nextSibling) {
    //     overrideTween(nextSibling);
    //     console.log(tween.id, nextSibling.id);
    //     nextSibling = nextSibling._nextRep;
    //   }
    // }

  // Handle additive tweens composition - 处理加法补间组合

  } else if (tweenCompositionType === compositionTypes.blend) {

    const additiveTweenSiblings = getTweenSiblings(tween.target, tween.property, '_add'); // 获取加法补间兄弟
    const additiveAnimation = addAdditiveAnimation(lookups._add); // 添加加法动画

    let lookupTween = additiveTweenSiblings._head; // 获取查找补间

    if (!lookupTween) {
      lookupTween = { ...tween }; // 复制补间
      lookupTween._composition = compositionTypes.replace; // 设置组合类型为替换
      lookupTween._updateDuration = minValue; // 设置更新持续时间为最小值
      lookupTween._startTime = 0; // 设置开始时间为0
      lookupTween._numbers = cloneArray(tween._fromNumbers); // 克隆起始数字数组
      lookupTween._number = 0; // 设置数字为0
      lookupTween._next = null;
      lookupTween._prev = null;
      addChild(additiveTweenSiblings, lookupTween);
      addChild(additiveAnimation, lookupTween);
    }

    // Convert the values of TO to FROM and set TO to 0

    const toNumber = tween._toNumber;
    tween._fromNumber = lookupTween._fromNumber - toNumber;
    tween._toNumber = 0;
    tween._numbers = cloneArray(tween._fromNumbers);
    tween._number = 0;
    lookupTween._fromNumber = toNumber;

    if (tween._toNumbers) {
      const toNumbers = cloneArray(tween._toNumbers);
      if (toNumbers) {
        toNumbers.forEach((value, i) => {
          tween._fromNumbers[i] = lookupTween._fromNumbers[i] - value;
          tween._toNumbers[i] = 0;
        });
      }
      lookupTween._fromNumbers = toNumbers;
    }

    addChild(additiveTweenSiblings, tween, null, '_prevAdd', '_nextAdd');

  }

  return tween;

}

/**
 * @param  {Tween} tween
 * @return {Tween}
 */
export const removeTweenSliblings = tween => {
  const tweenComposition = tween._composition;
  if (tweenComposition !== compositionTypes.none) {
    const tweenTarget = tween.target;
    const tweenProperty = tween.property;
    const replaceTweensLookup = lookups._rep;
    const replaceTargetProps = replaceTweensLookup.get(tweenTarget);
    const tweenReplaceSiblings = replaceTargetProps[tweenProperty];
    removeChild(tweenReplaceSiblings, tween, '_prevRep', '_nextRep');
    if (tweenComposition === compositionTypes.blend) {
      const addTweensLookup = lookups._add;
      const addTargetProps = addTweensLookup.get(tweenTarget);
      if (!addTargetProps) return;
      const additiveTweenSiblings = addTargetProps[tweenProperty];
      const additiveAnimation = additive.animation;
      removeChild(additiveTweenSiblings, tween, '_prevAdd', '_nextAdd');
      // If only one tween is left in the additive lookup, it's the tween lookup
      const lookupTween = additiveTweenSiblings._head;
      if (lookupTween && lookupTween === additiveTweenSiblings._tail) {
        removeChild(additiveTweenSiblings, lookupTween, '_prevAdd', '_nextAdd');
        removeChild(additiveAnimation, lookupTween);
        let shouldClean = true;
        for (let prop in addTargetProps) {
          if (addTargetProps[prop]._head) {
            shouldClean = false;
            break;
          }
        }
        if (shouldClean) {
          addTweensLookup.delete(tweenTarget);
        }
      }
    }
  }
  return tween;
}
