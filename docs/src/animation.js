/// <reference path='./types.js' />

import {
  K,
  minValue,
  tweenTypes,
  valueTypes,
  compositionTypes,
  isDomSymbol,
  transformsSymbol,
  emptyString,
  transformsFragmentStrings,
} from './consts.js';

import {
  mergeObjects,
  cloneArray,
  isArr,
  isObj,
  isUnd,
  isKey,
  addChild,
  forEachChildren,
  clampInfinity,
  normalizeTime,
  isNum,
  round,
} from './helpers.js';

import {
  globals,
} from './globals.js';

import {
  registerTargets,
} from './targets.js';

import {
  parseEasings,
} from './eases.js';

import {
  getRelativeValue,
  getFunctionValue,
  getOriginalAnimatableValue,
  getTweenType,
  setValue,
  decomposeRawValue,
  decomposeTweenValue,
  decomposedOriginalValue,
  createDecomposedValueTargetObject,
} from './values.js';

import {
  sanitizePropertyName,
} from './properties.js';

import {
  convertValueUnit,
} from './units.js';

import {
  composeTween,
  getTweenSiblings,
  overrideTween,
} from './compositions.js';

import {
  additive,
} from './additive.js';

import {
  Timer,
} from './timer.js';

/**
 * 清理内联样式 - 将动画元素恢复到原始状态
 * @template {Renderable} T
 * @param {T} renderable - 可渲染对象
 * @return {T} - 返回清理后的对象
 */
export const cleanInlineStyles = renderable => {
  // 允许在时间轴上调用cleanInlineStyles()
  if (renderable._hasChildren) {
    forEachChildren(renderable, cleanInlineStyles, true);
  } else {
    const animation = /** @type {JSAnimation} */(renderable);
    animation.pause();
    forEachChildren(animation, (/** @type {Tween} */tween) => {
      const tweenProperty = tween.property;
      const tweenTarget = tween.target;
      if (tweenTarget[isDomSymbol]) {
        const targetStyle = /** @type {DOMTarget} */(tweenTarget).style;
        const originalInlinedValue = animation._inlineStyles[tweenProperty];
        if (tween._tweenType === tweenTypes.TRANSFORM) {
          // 处理变换属性
          const cachedTransforms = tweenTarget[transformsSymbol];
          if (isUnd(originalInlinedValue) || originalInlinedValue === emptyString) {
            delete cachedTransforms[tweenProperty];
          } else {
            cachedTransforms[tweenProperty] = originalInlinedValue;
          }
          if (tween._renderTransforms) {
            if (!Object.keys(cachedTransforms).length) {
              targetStyle.removeProperty('transform');
            } else {
              let str = emptyString;
              for (let key in cachedTransforms) {
                str += transformsFragmentStrings[key] + cachedTransforms[key] + ') ';
              }
              targetStyle.transform = str;
            }
          }
        } else {
          // 处理普通CSS属性
          if (isUnd(originalInlinedValue) || originalInlinedValue === emptyString) {
            targetStyle.removeProperty(tweenProperty);
          } else {
            targetStyle[tweenProperty] = originalInlinedValue;
          }
        }
        // 清理空的style属性
        if (animation._tail === tween) {
          animation.targets.forEach(t => {
            if (t.getAttribute && t.getAttribute('style') === emptyString) {
              t.removeAttribute('style');
            };
          });
        }
      }
    })
  }
  return renderable;
}

// 定义分解值的目标对象，只创建一次并在后续修改其属性以避免垃圾回收
// TODO: 也许将对象创建移到values.js中，并使用decompose函数创建基础对象
const fromTargetObject = createDecomposedValueTargetObject();
const toTargetObject = createDecomposedValueTargetObject();
const toFunctionStore = { func: null };
const keyframesTargetArray = [null];
const fastSetValuesArray = [null, null];
/** @type {TweenKeyValue} */
const keyObjectTarget = { to: null };

let tweenId = 0;
let keyframes;
/** @type {TweenParamsOptions & TweenValues} */
let key;

/**
 * 生成关键帧 - 将关键帧语法转换为标准属性语法
 * @param {DurationKeyframes | PercentageKeyframes} keyframes - 关键帧数据
 * @param {AnimationParams} parameters - 动画参数
 * @return {AnimationParams} - 转换后的属性对象
 */
const generateKeyframes = (keyframes, parameters) => {
  /** @type {AnimationParams} */
  const properties = {};
  if (isArr(keyframes)) {
    // 处理持续时间关键帧数组语法
    const propertyNames = [].concat(.../** @type {DurationKeyframes} */(keyframes).map(key => Object.keys(key))).filter(isKey);
    for (let i = 0, l = propertyNames.length; i < l; i++) {
      const propName = propertyNames[i];
      const propArray = /** @type {DurationKeyframes} */(keyframes).map(key => {
        /** @type {TweenKeyValue} */
        const newKey = {};
        for (let p in key) {
          const keyValue = /** @type {TweenPropValue} */(key[p]);
          if (isKey(p)) {
            if (p === propName) {
              newKey.to = keyValue;
            }
          } else {
            newKey[p] = keyValue;
          }
        }
        return newKey;
      });
      properties[propName] = /** @type {ArraySyntaxValue} */(propArray);
    }

  } else {
    // 处理百分比关键帧对象语法
    const totalDuration = /** @type {Number} */(setValue(parameters.duration, globals.defaults.duration));
    const keys = Object.keys(keyframes)
    .map(key => { return {o: parseFloat(key) / 100, p: keyframes[key]} })
    .sort((a, b) => a.o - b.o);
    keys.forEach(key => {
      const offset = key.o;
      const prop = key.p;
      for (let name in prop) {
        if (isKey(name)) {
          let propArray = /** @type {Array} */(properties[name]);
          if (!propArray) propArray = properties[name] = [];
          const duration = offset * totalDuration;
          let length = propArray.length;
          let prevKey = propArray[length - 1];
          const keyObj = { to: prop[name] };
          let durProgress = 0;
          for (let i = 0; i < length; i++) {
            durProgress += propArray[i].duration;
          }
          if (length === 1) {
            keyObj.from = prevKey.to;
          }
          if (prop.ease) {
            keyObj.ease = prop.ease;
          }
          keyObj.duration = duration - (length ? durProgress : 0);
          propArray.push(keyObj);
        }
      }
      return key;
    });

    // 处理缓动参数
    for (let name in properties) {
      const propArray = /** @type {Array} */(properties[name]);
      let prevEase;
      // let durProgress = 0
      for (let i = 0, l = propArray.length; i < l; i++) {
        const prop = propArray[i];
        // 模拟WAAPI缓动参数位置
        const currentEase = prop.ease;
        prop.ease = prevEase ? prevEase : undefined;
        prevEase = currentEase;
        // durProgress += prop.duration;
        // if (i === l - 1 && durProgress !== totalDuration) {
        //   propArray.push({ from: prop.to, ease: prop.ease, duration: totalDuration - durProgress })
        // }
      }
      if (!propArray[0].duration) {
        propArray.shift();
      }
    }

  }

  return properties;
}

/**
 * JS动画类 - 继承自Timer，实现具体的动画逻辑
 */
export class JSAnimation extends Timer {
  /**
   * JS动画构造函数
   * @param {TargetsParam} targets - 动画目标
   * @param {AnimationParams} parameters - 动画参数
   * @param {Timeline} [parent] - 父时间轴
   * @param {Number} [parentPosition] - 在父时间轴中的位置
   * @param {Boolean} [fastSet=false] - 是否快速设置
   * @param {Number} [index=0] - 目标索引
   * @param {Number} [length=0] - 目标总数
   */
  constructor(
    targets,
    parameters,
    parent,
    parentPosition,
    fastSet = false,
    index = 0,
    length = 0
  ) {

    super(/** @type {TimerParams&AnimationParams} */(parameters), parent, parentPosition);

    // 解析并注册目标
    const parsedTargets = registerTargets(targets);
    const targetsLength = parsedTargets.length;

    // 如果参数对象包含"keyframes"属性，将所有关键帧值转换为常规属性

    const kfParams = /** @type {AnimationParams} */(parameters).keyframes;
    const params = /** @type {AnimationParams} */(kfParams ? mergeObjects(generateKeyframes(/** @type {DurationKeyframes} */(kfParams), parameters), parameters) : parameters);

    // 提取动画参数
    const {
      delay,
      duration,
      ease,
      playbackEase,
      modifier,
      composition,
      onRender,
    } = params;

    // 设置动画默认值
    const animDefaults = parent ? parent.defaults : globals.defaults;
    const animaPlaybackEase = setValue(playbackEase, animDefaults.playbackEase);
    const animEase = animaPlaybackEase ? parseEasings(animaPlaybackEase) : null;
    const hasSpring = !isUnd(ease) && !isUnd(/** @type {Spring} */(ease).ease);
    const tEasing = hasSpring ? /** @type {Spring} */(ease).ease : setValue(ease, animEase ? 'linear' : animDefaults.ease);
    const tDuration = hasSpring ? /** @type {Spring} */(ease).duration : setValue(duration, animDefaults.duration);
    const tDelay = setValue(delay, animDefaults.delay);
    const tModifier = modifier || animDefaults.modifier;
    // 如果没有定义组合且目标数量很高（>= 1000），将组合设置为'none'（0）以加快tween创建
    const tComposition = isUnd(composition) && targetsLength >= K ? compositionTypes.none : !isUnd(composition) ? composition : animDefaults.composition;
    // TODO: 在知道动画将生成内联样式之前不要创建空对象
    const animInlineStyles = {};
    // const absoluteOffsetTime = this._offset;
    const absoluteOffsetTime = this._offset + (parent ? parent._offset : 0);

    let iterationDuration = NaN;
    let iterationDelay = NaN;
    let animationAnimationLength = 0;
    let shouldTriggerRender = 0;

    // 遍历所有目标
    for (let targetIndex = 0; targetIndex < targetsLength; targetIndex++) {

      const target = parsedTargets[targetIndex];
      const ti = index || targetIndex;
      const tl = length || targetsLength;

      let lastTransformGroupIndex = NaN;
      let lastTransformGroupLength = NaN;

      // 遍历所有属性
      for (let p in params) {

        if (isKey(p)) {

          const tweenType = getTweenType(target, p);

          const propName = sanitizePropertyName(p, target, tweenType);

          let propValue = params[p];

          const isPropValueArray = isArr(propValue);

          // 快速设置模式处理
          if (fastSet && !isPropValueArray) {
            fastSetValuesArray[0] = propValue;
            fastSetValuesArray[1] = propValue;
            propValue = fastSetValuesArray;
          }

          // TODO: 允许在ObjectValue值中嵌套关键帧（prop: { to: [.5, 1, .75, 2, 3] }）
          // 将属性值标准化为有效的关键帧语法：
          // [x, y] 转换为 [{to: [x, y]}] 或 {to: x} 转换为 [{to: x}] 或保持keys语法 [{}, {}, {}...]
          // const keyframes = isArr(propValue) ? propValue.length === 2 && !isObj(propValue[0]) ? [{ to: propValue }] : propValue : [propValue];
          if (isPropValueArray) {
            const arrayLength = /** @type {Array} */(propValue).length;
            const isNotObjectValue = !isObj(propValue[0]);
            // 将 [x, y] 转换为 [{to: [x, y]}]
            if (arrayLength === 2 && isNotObjectValue) {
              keyObjectTarget.to = /** @type {TweenParamValue} */(/** @type {unknown} */(propValue));
              keyframesTargetArray[0] = keyObjectTarget;
              keyframes = keyframesTargetArray;
            // 将 [x, y, z] 转换为 [[x, y], z]
            } else if (arrayLength > 2 && isNotObjectValue) {
              keyframes = [];
              /** @type {Array.<Number>} */(propValue).forEach((v, i) => {
                if (!i) {
                  fastSetValuesArray[0] = v;
                } else if (i === 1) {
                  fastSetValuesArray[1] = v;
                  keyframes.push(fastSetValuesArray);
                } else {
                  keyframes.push(v);
                }
              });
            } else {
              keyframes = /** @type {Array.<TweenKeyValue>} */(propValue);
            }
          } else {
            keyframesTargetArray[0] = propValue;
            keyframes = keyframesTargetArray;
          }

          let siblings = null;
          let prevTween = null;
          let firstTweenChangeStartTime = NaN;
          let lastTweenChangeEndTime = 0;
          let tweenIndex = 0;

          // 遍历关键帧创建tween
          for (let l = keyframes.length; tweenIndex < l; tweenIndex++) {

            const keyframe = keyframes[tweenIndex];

            if (isObj(keyframe)) {
              key = keyframe;
            } else {
              keyObjectTarget.to = /** @type {TweenParamValue} */(keyframe);
              key = keyObjectTarget;
            }

            toFunctionStore.func = null;

            const computedToValue = getFunctionValue(key.to, target, ti, tl, toFunctionStore);

            let tweenToValue;
            // 允许基于函数的值返回对象语法值（{to: v}）
            if (isObj(computedToValue) && !isUnd(computedToValue.to)) {
              key = computedToValue;
              tweenToValue = computedToValue.to;
            } else {
              tweenToValue = computedToValue;
            }
            const tweenFromValue = getFunctionValue(key.from, target, ti, tl);
            const keyEasing = key.ease;
            const hasSpring = !isUnd(keyEasing) && !isUnd(/** @type {Spring} */(keyEasing).ease);
            // 缓动处理不同，不接受基于函数的值以防止必须传递总是返回另一个函数的函数包装器
            const tweenEasing = hasSpring ? /** @type {Spring} */(keyEasing).ease : keyEasing || tEasing;
            // 通过将关键帧总数除以来计算默认的单个关键帧持续时间
            const tweenDuration = hasSpring ? /** @type {Spring} */(keyEasing).duration : getFunctionValue(setValue(key.duration, (l > 1 ? getFunctionValue(tDuration, target, ti, tl) / l : tDuration)), target, ti, tl);
            // 默认延迟值应该只应用于第一个tween
            const tweenDelay = getFunctionValue(setValue(key.delay, (!tweenIndex ? tDelay : 0)), target, ti, tl);
            const computedComposition = getFunctionValue(setValue(key.composition, tComposition), target, ti, tl);
            const tweenComposition = isNum(computedComposition) ? computedComposition : compositionTypes[computedComposition];
            // 修饰符处理不同，不接受基于函数的值以防止必须传递函数包装器
            const tweenModifier = key.modifier || tModifier;
            const hasFromvalue = !isUnd(tweenFromValue);
            const hasToValue = !isUnd(tweenToValue);
            const isFromToArray = isArr(tweenToValue);
            const isFromToValue = isFromToArray || (hasFromvalue && hasToValue);
            const tweenStartTime = prevTween ? lastTweenChangeEndTime + tweenDelay : tweenDelay;
            const absoluteStartTime = absoluteOffsetTime + tweenStartTime;

            // 如果动画包含至少一个from值且autoplay设置为false，强制触发onRender回调
            if (!shouldTriggerRender && (hasFromvalue || isFromToArray)) shouldTriggerRender = 1;

            let prevSibling = prevTween;

            // 处理组合动画
            if (tweenComposition !== compositionTypes.none) {
              if (!siblings) siblings = getTweenSiblings(target, propName);
              let nextSibling = siblings._head;
              // 遍历所有下一个兄弟，直到找到具有相等或较低开始时间的兄弟
              while (nextSibling && !nextSibling._isOverridden && nextSibling._absoluteStartTime <= absoluteStartTime) {
                prevSibling = nextSibling;
                nextSibling = nextSibling._nextRep;
                // 如果下一个兄弟在相同时间或之后开始，则覆盖所有下一个兄弟
                if (nextSibling && nextSibling._absoluteStartTime >= absoluteStartTime) {
                  while (nextSibling) {
                    overrideTween(nextSibling);
                    // 一旦所有下一个兄弟都被覆盖，这将结束当前while循环和上层循环
                    nextSibling = nextSibling._nextRep;
                  }
                }
              }
            }

            // 分解值
            if (isFromToValue) {
              decomposeRawValue(isFromToArray ? getFunctionValue(tweenToValue[0], target, ti, tl) : tweenFromValue, fromTargetObject);
              decomposeRawValue(isFromToArray ? getFunctionValue(tweenToValue[1], target, ti, tl, toFunctionStore) : tweenToValue, toTargetObject);
              if (fromTargetObject.t === valueTypes.NUMBER) {
                if (prevSibling) {
                  if (prevSibling._valueType === valueTypes.UNIT) {
                    fromTargetObject.t = valueTypes.UNIT;
                    fromTargetObject.u = prevSibling._unit;
                  }
                } else {
                  decomposeRawValue(
                    getOriginalAnimatableValue(target, propName, tweenType, animInlineStyles),
                    decomposedOriginalValue
                  );
                  if (decomposedOriginalValue.t === valueTypes.UNIT) {
                    fromTargetObject.t = valueTypes.UNIT;
                    fromTargetObject.u = decomposedOriginalValue.u;
                  }
                }
              }
            } else {
              if (hasToValue) {
                decomposeRawValue(tweenToValue, toTargetObject);
              } else {
                if (prevTween) {
                  decomposeTweenValue(prevTween, toTargetObject);
                } else {
                  // 如果tween是时间轴的一部分并且有属于同一时间轴的先前兄弟，则无需获取和解析原始值
                  decomposeRawValue(parent && prevSibling && prevSibling.parent.parent === parent ? prevSibling._value :
                  getOriginalAnimatableValue(target, propName, tweenType, animInlineStyles), toTargetObject);
                }
              }
              if (hasFromvalue) {
                decomposeRawValue(tweenFromValue, fromTargetObject);
              } else {
                if (prevTween) {
                  decomposeTweenValue(prevTween, fromTargetObject);
                } else {
                  decomposeRawValue(parent && prevSibling && prevSibling.parent.parent === parent ? prevSibling._value :
                  // 如果tween是时间轴的一部分并且有属于同一时间轴的先前兄弟，则无需获取和解析原始值
                  getOriginalAnimatableValue(target, propName, tweenType, animInlineStyles), fromTargetObject);
                }
              }
            }

            // 应用操作符
            if (fromTargetObject.o) {
              fromTargetObject.n = getRelativeValue(
                !prevSibling ? decomposeRawValue(
                  getOriginalAnimatableValue(target, propName, tweenType, animInlineStyles),
                  decomposedOriginalValue
                ).n : prevSibling._toNumber,
                fromTargetObject.n,
                fromTargetObject.o
              );
            }

            if (toTargetObject.o) {
              toTargetObject.n = getRelativeValue(fromTargetObject.n, toTargetObject.n, toTargetObject.o);
            }

            // 在"from"和"to"类型不同的情况下进行值同质化
            if (fromTargetObject.t !== toTargetObject.t) {
              if (fromTargetObject.t === valueTypes.COMPLEX || toTargetObject.t === valueTypes.COMPLEX) {
                const complexValue = fromTargetObject.t === valueTypes.COMPLEX ? fromTargetObject : toTargetObject;
                const notComplexValue = fromTargetObject.t === valueTypes.COMPLEX ? toTargetObject : fromTargetObject;
                notComplexValue.t = valueTypes.COMPLEX;
                notComplexValue.s = cloneArray(complexValue.s);
                notComplexValue.d = complexValue.d.map(() => notComplexValue.n);
              } else if (fromTargetObject.t === valueTypes.UNIT || toTargetObject.t === valueTypes.UNIT) {
                const unitValue = fromTargetObject.t === valueTypes.UNIT ? fromTargetObject : toTargetObject;
                const notUnitValue = fromTargetObject.t === valueTypes.UNIT ? toTargetObject : fromTargetObject;
                notUnitValue.t = valueTypes.UNIT;
                notUnitValue.u = unitValue.u;
              } else if (fromTargetObject.t === valueTypes.COLOR || toTargetObject.t === valueTypes.COLOR) {
                const colorValue = fromTargetObject.t === valueTypes.COLOR ? fromTargetObject : toTargetObject;
                const notColorValue = fromTargetObject.t === valueTypes.COLOR ? toTargetObject : fromTargetObject;
                notColorValue.t = valueTypes.COLOR;
                notColorValue.s = colorValue.s;
                notColorValue.d = [0, 0, 0, 1];
              }
            }

            // 单位转换
            if (fromTargetObject.u !== toTargetObject.u) {
              let valueToConvert = toTargetObject.u ? fromTargetObject : toTargetObject;
              valueToConvert = convertValueUnit(/** @type {DOMTarget} */(target), valueToConvert, toTargetObject.u ? toTargetObject.u : fromTargetObject.u, false);
              // TODO:
              // convertValueUnit(target, to.u ? from : to, to.u ? to.u : from.u);
            }

            // 填充不存在的复杂值
            if (toTargetObject.d && fromTargetObject.d && (toTargetObject.d.length !== fromTargetObject.d.length)) {
              const longestValue = fromTargetObject.d.length > toTargetObject.d.length ? fromTargetObject : toTargetObject;
              const shortestValue = longestValue === fromTargetObject ? toTargetObject : fromTargetObject;
              // TODO: 检查是否应该使用n而不是0作为默认复杂值
              shortestValue.d = longestValue.d.map((_, i) => isUnd(shortestValue.d[i]) ? 0 : shortestValue.d[i]);
              shortestValue.s = cloneArray(longestValue.s);
            }

            // Tween工厂

            // 这里需要四舍五入以最小化浮点错误
            const tweenUpdateDuration = round(+tweenDuration || minValue, 12);

            /** @type {Tween} */
            const tween = {
              parent: this,
              id: tweenId++,
              property: propName,
              target: target,
              _value: null,
              _func: toFunctionStore.func,
              _ease: parseEasings(tweenEasing),
              _fromNumbers: cloneArray(fromTargetObject.d),
              _toNumbers: cloneArray(toTargetObject.d),
              _strings: cloneArray(toTargetObject.s),
              _fromNumber: fromTargetObject.n,
              _toNumber: toTargetObject.n,
              _numbers: cloneArray(fromTargetObject.d), // 用于加法tween和animatables
              _number: fromTargetObject.n, // 用于加法tween和animatables
              _unit: toTargetObject.u,
              _modifier: tweenModifier,
              _currentTime: 0,
              _startTime: tweenStartTime,
              _delay: +tweenDelay,
              _updateDuration: tweenUpdateDuration,
              _changeDuration: tweenUpdateDuration,
              _absoluteStartTime: absoluteStartTime,
              // 注意：研究位打包以存储ENUM / BOOL
              _tweenType: tweenType,
              _valueType: toTargetObject.t,
              _composition: tweenComposition,
              _isOverlapped: 0,
              _isOverridden: 0,
              _renderTransforms: 0,
              _prevRep: null, // 用于替换的tween
              _nextRep: null, // 用于替换的tween
              _prevAdd: null, // 用于加法tween
              _nextAdd: null, // 用于加法tween
              _prev: null,
              _next: null,
            }

            if (tweenComposition !== compositionTypes.none) {
              composeTween(tween, siblings);
            }

            if (isNaN(firstTweenChangeStartTime)) {
              firstTweenChangeStartTime = tween._startTime;
            }
            // 这里需要四舍五入以最小化浮点错误
            lastTweenChangeEndTime = round(tweenStartTime + tweenUpdateDuration, 12);
            prevTween = tween;
            animationAnimationLength++;

            addChild(this, tween);

          }

          // 使用添加的tween属性更新动画时间

          if (isNaN(iterationDelay) || firstTweenChangeStartTime < iterationDelay) {
            iterationDelay = firstTweenChangeStartTime;
          }

          if (isNaN(iterationDuration) || lastTweenChangeEndTime > iterationDuration) {
            iterationDuration = lastTweenChangeEndTime;
          }

          // TODO: 找到一种方法在这里内联tween._renderTransforms = 1
          if (tweenType === tweenTypes.TRANSFORM) {
            lastTransformGroupIndex = animationAnimationLength - tweenIndex;
            lastTransformGroupLength = animationAnimationLength;
          }

        }

      }

      // 将_renderTransforms设置为最后一个变换属性以正确渲染变换列表
      if (!isNaN(lastTransformGroupIndex)) {
        let i = 0;
        forEachChildren(this, (/** @type {Tween} */tween) => {
          if (i >= lastTransformGroupIndex && i < lastTransformGroupLength) {
            tween._renderTransforms = 1;
            if (tween._composition === compositionTypes.blend) {
              forEachChildren(additive.animation, (/** @type {Tween} */additiveTween) => {
                if (additiveTween.id === tween.id) {
                  additiveTween._renderTransforms = 1;
                }
              });
            }
          }
          i++;
        });
      }

    }

    if (!targetsLength) {
      console.warn(`No target found. Make sure the element you're trying to animate is accessible before creating your animation.`);
    }

    // 调整迭代延迟
    if (iterationDelay) {
      forEachChildren(this, (/** @type {Tween} */tween) => {
        // 如果(startTime - delay)等于0，这意味着tween在动画开始时，所以我们也需要修剪延迟
        if (!(tween._startTime - tween._delay)) {
          tween._delay -= iterationDelay;
        }
        tween._startTime -= iterationDelay;
      });
      iterationDuration -= iterationDelay;
    } else {
      iterationDelay = 0;
    }

    // 如果没有提供有效的可动画属性，防止iterationDuration为NaN
    // 如果没有提供有效的可动画属性，防止_iterationCount为NaN
    if (!iterationDuration) {
      iterationDuration = minValue;
      this.iterationCount = 0;
    }
    /** @type {TargetsArray} */
    this.targets = parsedTargets;
    /** @type {Number} */
    this.duration = iterationDuration === minValue ? minValue : clampInfinity(((iterationDuration + this._loopDelay) * this.iterationCount) - this._loopDelay) || minValue;
    /** @type {Callback<this>} */
    this.onRender = onRender || animDefaults.onRender;
    /** @type {EasingFunction} */
    this._ease = animEase;
    /** @type {Number} */
    this._delay = iterationDelay;
    // 注意：我将延迟值与时间轴中的偏移分开，因为延迟可以覆盖先前的tween，调试具有覆盖tween且没有关联可见延迟的时间轴可能会令人困惑。
    // this._delay = parent ? 0 : iterationDelay;
    // this._offset += parent ? iterationDelay : 0;
    /** @type {Number} */
    this.iterationDuration = iterationDuration;
    /** @type {{}} */
    this._inlineStyles = animInlineStyles;

    if (!this._autoplay && shouldTriggerRender) this.onRender(this);
  }

  /**
   * 拉伸动画 - 调整动画持续时间
   * @param  {Number} newDuration - 新的持续时间
   * @return {this} - 返回当前实例
   */
  stretch(newDuration) {
    const currentDuration = this.duration;
    if (currentDuration === normalizeTime(newDuration)) return this;
    const timeScale = newDuration / currentDuration;
    // 注意：找到一种更好的方法来处理stretch = 0后的动画拉伸
    forEachChildren(this, (/** @type {Tween} */tween) => {
      // 这里需要四舍五入以最小化浮点错误
      tween._updateDuration = normalizeTime(tween._updateDuration * timeScale);
      tween._changeDuration = normalizeTime(tween._changeDuration * timeScale);
      tween._currentTime *= timeScale;
      tween._startTime *= timeScale;
      tween._absoluteStartTime *= timeScale;
    });
    return super.stretch(newDuration);
  }

  /**
   * 刷新动画 - 重新计算tween的起始值
   * @return {this} - 返回当前实例
   */
  refresh() {
    forEachChildren(this, (/** @type {Tween} */tween) => {
      const ogValue = getOriginalAnimatableValue(tween.target, tween.property, tween._tweenType);
      decomposeRawValue(ogValue, decomposedOriginalValue);
      tween._fromNumbers = cloneArray(decomposedOriginalValue.d);
      tween._fromNumber = decomposedOriginalValue.n;
      if (tween._func) {
        decomposeRawValue(tween._func(), toTargetObject);
        tween._toNumbers = cloneArray(toTargetObject.d);
        tween._strings = cloneArray(toTargetObject.s);
        tween._toNumber = toTargetObject.n;
      }
    });
    return this;
  }

  /**
   * 恢复动画 - 取消动画并将受此动画影响的所有值恢复到原始状态
   * @return {this} - 返回当前实例
   */
  revert() {
    super.revert();
    return cleanInlineStyles(this);
  }

  /**
   * Promise支持 - 动画完成后的回调
   * @param  {Callback<this>} [callback] - 回调函数
   * @return {Promise} - Promise对象
   */
  then(callback) {
    return super.then(callback);
  }

}

/**
 * 创建动画实例的便捷函数
 * @param {TargetsParam} targets - 动画目标
 * @param {AnimationParams} parameters - 动画参数
 * @return {JSAnimation} - 返回动画实例
 */
export const animate = (targets, parameters) => new JSAnimation(targets, parameters, null, 0, false).init();