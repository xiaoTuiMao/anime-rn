/// <reference path='./types.js' />

import {
  K,
  isSvgSymbol,
  morphPointsSymbol,
  proxyTargetSymbol,
} from './consts.js';

import {
  round,
  isSvg,
  atan2,
  sqrt,
  PI,
  isFnc,
} from './helpers.js';

import {
  parseTargets
} from './targets.js';

/**
 * @param  {TargetsParam} path
 * @return {SVGGeometryElement|undefined}
 */
const getPath = path => {
  const parsedTargets = parseTargets(path); // 解析目标
  const $parsedSvg = /** @type {SVGGeometryElement} */(parsedTargets[0]); // 获取解析后的SVG元素
  if (!$parsedSvg || !isSvg($parsedSvg)) return; // 如果不是SVG元素，返回undefined
  return $parsedSvg; // 返回SVG几何元素
} // 获取路径元素

/**
 * @param  {TargetsParam} path2
 * @param  {Number} [precision]
 * @return {FunctionValue}
 */
const morphTo = (path2, precision = .33) => ($path1) => {
  const $path2 = /** @type {SVGGeometryElement} */(getPath(path2)); // 获取目标路径
  if (!$path2) return; // 如果目标路径不存在，返回
  const isPath = $path1.tagName === 'path'; // 是否为path元素
  const separator = isPath ? ' ' : ','; // 分隔符
  const previousPoints = $path1[morphPointsSymbol]; // 获取之前的点
  if (previousPoints) $path1.setAttribute(isPath ? 'd' : 'points', previousPoints); // 如果有之前的点，设置属性

  let v1 = '', v2 = ''; // 两个路径的值

  if (!precision) {
    // 如果没有精度要求，直接获取属性值
    v1 = $path1.getAttribute(isPath ? 'd' : 'points');
    v2 = $path2.getAttribute(isPath ? 'd' : 'points');
  } else {
    // 如果有精度要求，按精度采样点
    const length1 = /** @type {SVGGeometryElement} */($path1).getTotalLength(); // 获取路径1的总长度
    const length2 = $path2.getTotalLength(); // 获取路径2的总长度
    const maxPoints = Math.max(Math.ceil(length1 * precision), Math.ceil(length2 * precision)); // 计算最大点数
    for (let i = 0; i < maxPoints; i++) {
      const t = i / (maxPoints - 1); // 计算参数t
      const pointOnPath1 = /** @type {SVGGeometryElement} */($path1).getPointAtLength(length1 * t); // 获取路径1上的点
      const pointOnPath2 = $path2.getPointAtLength(length2 * t); // 获取路径2上的点
      const prefix = isPath ? (i === 0 ? 'M' : 'L') : ''; // 路径前缀
      v1 += prefix + round(pointOnPath1.x, 3) + separator + pointOnPath1.y + ' '; // 构建路径1的值
      v2 += prefix + round(pointOnPath2.x, 3) + separator + pointOnPath2.y + ' '; // 构建路径2的值
    }
  }

  $path1[morphPointsSymbol] = v2; // 保存目标路径的值

  return [v1, v2]; // 返回两个路径的值
} // 创建路径变形函数

/**
 * @param {SVGGeometryElement} [$el]
 * @return {Number}
 */
const getScaleFactor = $el => {
  let scaleFactor = 1; // 默认缩放因子
  if ($el && $el.getCTM) {
    const ctm = $el.getCTM(); // 获取当前变换矩阵
    if (ctm) {
      const scaleX = sqrt(ctm.a * ctm.a + ctm.b * ctm.b); // 计算X方向缩放
      const scaleY = sqrt(ctm.c * ctm.c + ctm.d * ctm.d); // 计算Y方向缩放
      scaleFactor = (scaleX + scaleY) / 2; // 计算平均缩放因子
    }
  }
  return scaleFactor; // 返回缩放因子
} // 获取SVG元素的缩放因子

/**
 * Creates a proxy that wraps an SVGGeometryElement and adds drawing functionality.
 * @param {SVGGeometryElement} $el - The SVG element to transform into a drawable
 * @param {number} start - Starting position (0-1)
 * @param {number} end - Ending position (0-1)
 * @return {DrawableSVGGeometry} - Returns a proxy that preserves the original element's type with additional 'draw' attribute functionality
 */
const createDrawableProxy = ($el, start, end) => {
  const pathLength = K; // 路径长度
  const computedStyles = getComputedStyle($el); // 获取计算样式
  const strokeLineCap = computedStyles.strokeLinecap; // 获取线条端点样式
  // @ts-ignore
  const $scalled = computedStyles.vectorEffect === 'non-scaling-stroke' ? $el : null; // 获取非缩放描边元素
  let currentCap = strokeLineCap; // 当前端点样式

  const proxy = new Proxy($el, {
    get(target, property) {
      const value = target[property]; // 获取目标属性值
      if (property === proxyTargetSymbol) return target; // 如果是代理目标符号，返回目标
      if (property === 'setAttribute') {
        return (...args) => {
          if (args[0] === 'draw') {
            // 处理draw属性
            const value = args[1]; // 获取值
            const values = value.split(' '); // 分割值
            const v1 = +values[0]; // 第一个值
            const v2 = +values[1]; // 第二个值
            // TOTO: Benchmark if performing two slices is more performant than one split
            // const spaceIndex = value.indexOf(' ');
            // const v1 = round(+value.slice(0, spaceIndex), precision);
            // const v2 = round(+value.slice(spaceIndex + 1), precision);
            const scaleFactor = getScaleFactor($scalled); // 获取缩放因子
            const os = v1 * -pathLength * scaleFactor; // 计算偏移量
            const d1 = (v2 * pathLength * scaleFactor) + os; // 计算第一个虚线长度
            const d2 = (pathLength * scaleFactor +
                      ((v1 === 0 && v2 === 1) || (v1 === 1 && v2 === 0) ? 0 : 10 * scaleFactor) - d1); // 计算第二个虚线长度
            if (strokeLineCap !== 'butt') {
              // 如果不是平头端点，调整端点样式
              const newCap = v1 === v2 ? 'butt' : strokeLineCap; // 计算新的端点样式
              if (currentCap !== newCap) {
                target.style.strokeLinecap = `${newCap}`; // 设置端点样式
                currentCap = newCap; // 更新当前端点样式
              }
            }
            target.setAttribute('stroke-dashoffset', `${os}`); // 设置虚线偏移
            target.setAttribute('stroke-dasharray', `${d1} ${d2}`); // 设置虚线数组
          }
          return Reflect.apply(value, target, args); // 调用原始方法
        };
      }

      if (isFnc(value)) {
        return (...args) => Reflect.apply(value, target, args); // 如果是函数，直接调用
      } else {
        return value; // 否则返回值
      }
    }
  });

  if ($el.getAttribute('pathLength') !== `${pathLength}`) {
    $el.setAttribute('pathLength', `${pathLength}`); // 设置路径长度
    proxy.setAttribute('draw', `${start} ${end}`); // 设置绘制属性
  }

  return /** @type {DrawableSVGGeometry} */(proxy); // 返回代理对象
} // 创建可绘制的代理对象

/**
 * Creates drawable proxies for multiple SVG elements.
 * @param {TargetsParam} selector - CSS selector, SVG element, or array of elements and selectors
 * @param {number} [start=0] - Starting position (0-1)
 * @param {number} [end=0] - Ending position (0-1)
 * @return {Array<DrawableSVGGeometry>} - Array of proxied elements with drawing functionality
 */
const createDrawable = (selector, start = 0, end = 0) => {
  const els = parseTargets(selector); // 解析目标
  return els.map($el => createDrawableProxy(
    /** @type {SVGGeometryElement} */($el), // 转换为SVG几何元素
    start,
    end
  ));
}; // 为多个SVG元素创建可绘制代理

// Motion path animation

/**
 * @param {SVGGeometryElement} $path
 * @param {Number} progress
 * @param {Number}lookup
 * @return {DOMPoint}
 */
const getPathPoint = ($path, progress, lookup = 0) => {
  return $path.getPointAtLength(progress + lookup >= 1 ? progress + lookup : 0); // 获取路径上的点
} // 获取路径点

/**
 * @param {SVGGeometryElement} $path
 * @param {String} pathProperty
 * @return {FunctionValue}
 */
const getPathProgess = ($path, pathProperty) => {
  return $el => {
    const totalLength = +($path.getTotalLength()); // 获取路径总长度
    const inSvg = $el[isSvgSymbol]; // 是否在SVG中
    const ctm = $path.getCTM(); // 获取当前变换矩阵
    /** @type {TweenObjectValue} */
    return {
      from: 0,
      to: totalLength,
      /** @type {TweenModifier} */
      modifier: progress => {
        if (pathProperty === 'a') {
          // 如果是角度属性
          const p0 = getPathPoint($path, progress, -1); // 获取前一个点
          const p1 = getPathPoint($path, progress, +1); // 获取后一个点
          return atan2(p1.y - p0.y, p1.x - p0.x) * 180 / PI; // 计算角度
        } else {
          const p = getPathPoint($path, progress, 0);
          return pathProperty === 'x' ?
            inSvg || !ctm ? p.x : p.x * ctm.a + p.y * ctm.c + ctm.e :
            inSvg || !ctm ? p.y : p.x * ctm.b + p.y * ctm.d + ctm.f
        }
      }
    }
  }
}

/**
 * @param {TargetsParam} path
 */
const createMotionPath = path => {
  const $path = getPath(path);
  if (!$path) return;
  return {
    translateX: getPathProgess($path, 'x'),
    translateY: getPathProgess($path, 'y'),
    rotate: getPathProgess($path, 'a'),
  }
}

// Check for valid SVG attribute

const cssReservedProperties = ['opacity', 'rotate', 'overflow', 'color'];

/**
 * @param  {Target} el
 * @param  {String} propertyName
 * @return {Boolean}
 */
export const isValidSVGAttribute = (el, propertyName) => {
  // Return early and use CSS opacity animation instead (already better default values (opacity: 1 instead of 0)) and rotate should be considered a transform
  if (cssReservedProperties.includes(propertyName)) return false;
  if (el.getAttribute(propertyName) || propertyName in el) {
    if (propertyName === 'scale') { // Scale
      const elParentNode = /** @type {SVGGeometryElement} */(/** @type {DOMTarget} */(el).parentNode);
      // Only consider scale as a valid SVG attribute on filter element
      return elParentNode && elParentNode.tagName === 'filter';
    }
    return true;
  }
}

export const svg = {
  morphTo,
  createMotionPath,
  createDrawable,
}
