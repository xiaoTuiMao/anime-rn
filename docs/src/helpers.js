import {
  isBrowser,
  lowerCaseRgx,
  hexTestRgx,
  maxValue,
  minValue,
} from './consts.js';

import {
  globals,
} from './globals.js';

// Strings
// 字符串处理工具

/**
 * @param  {String} str
 * @return {String}
 */
export const toLowerCase = str => str.replace(lowerCaseRgx, '$1-$2').toLowerCase(); // 驼峰命名转短横线命名

/**
 * Prioritize this method instead of regex when possible
 * 优先使用此方法而不是正则表达式
 * @param  {String} str
 * @param  {String} sub
 * @return {Boolean}
 */
export const stringStartsWith = (str, sub) => str.indexOf(sub) === 0; // 检查字符串是否以指定子串开头

// Time
// 时间处理
// Note: Date.now is used instead of performance.now since it is precise enough for timings calculations, performs slightly faster and works in Node.js environement.
// 注意：使用Date.now而不是performance.now，因为对于时间计算来说精度足够，性能稍快，且在Node.js环境中工作
export const now = Date.now; // 获取当前时间戳

// Types checkers
// 类型检查器

export const isArr = Array.isArray; // 检查是否为数组
/**@param {any} a @return {a is Record<String, any>} */
export const isObj = a => a && a.constructor === Object; // 检查是否为普通对象
/**@param {any} a @return {a is Number} */
export const isNum = a => typeof a === 'number' && !isNaN(a); // 检查是否为有效数字
/**@param {any} a @return {a is String} */
export const isStr = a => typeof a === 'string'; // 检查是否为字符串
/**@param {any} a @return {a is Function} */
export const isFnc = a => typeof a === 'function'; // 检查是否为函数
/**@param {any} a @return {a is undefined} */
export const isUnd = a => typeof a === 'undefined'; // 检查是否为undefined
/**@param {any} a @return {a is null | undefined} */
export const isNil = a => isUnd(a) || a === null; // 检查是否为null或undefined
/**@param {any} a @return {a is SVGElement} */
export const isSvg = a => isBrowser && a instanceof SVGElement; // 检查是否为SVG元素
/**@param {any} a @return {Boolean} */
export const isHex = a => hexTestRgx.test(a); // 检查是否为十六进制颜色
/**@param {any} a @return {Boolean} */
export const isRgb = a => stringStartsWith(a, 'rgb'); // 检查是否为RGB颜色
/**@param {any} a @return {Boolean} */
export const isHsl = a => stringStartsWith(a, 'hsl'); // 检查是否为HSL颜色
/**@param {any} a @return {Boolean} */
export const isCol = a => isHex(a) || isRgb(a) || isHsl(a); // 检查是否为颜色值
/**@param {any} a @return {Boolean} */
export const isKey = a => !globals.defaults.hasOwnProperty(a); // 检查是否为有效键名

// Number
// 数值处理

/**
 * @param  {Number|String} str
 * @return {Number}
 */
export const parseNumber = str => isStr(str) ?
  parseFloat(/** @type {String} */(str)) :
  /** @type {Number} */(str); // 解析数值，支持字符串和数字输入

// Math
// 数学函数

export const pow = Math.pow;     // 幂运算
export const sqrt = Math.sqrt;   // 平方根
export const sin = Math.sin;     // 正弦
export const cos = Math.cos;     // 余弦
export const abs = Math.abs;     // 绝对值
export const exp = Math.exp;     // 指数
export const ceil = Math.ceil;   // 向上取整
export const floor = Math.floor; // 向下取整
export const asin = Math.asin;   // 反正弦
export const max = Math.max;     // 最大值
export const atan2 = Math.atan2; // 反正切
export const PI = Math.PI;       // 圆周率
export const _round = Math.round; // 四舍五入

/**
 * @param  {Number} v
 * @param  {Number} min
 * @param  {Number} max
 * @return {Number}
 */
export const clamp = (v, min, max) => v < min ? min : v > max ? max : v; // 将数值限制在指定范围内

const powCache = {}; // 幂运算缓存

/**
 * @param  {Number} v
 * @param  {Number} decimalLength
 * @return {Number}
 */
export const round = (v, decimalLength) => {
  if (decimalLength < 0) return v; // 如果小数位数为负数，直接返回原值
  if (!decimalLength) return _round(v); // 如果小数位数为0，使用标准四舍五入
  let p = powCache[decimalLength];
  if (!p) p = powCache[decimalLength] = 10 ** decimalLength; // 缓存幂运算结果
  return _round(v * p) / p; // 精确到指定小数位数
};

/**
 * @param  {Number} v
 * @param  {Number|Array<Number>} increment
 * @return {Number}
 */
export const snap = (v, increment) => isArr(increment) ? increment.reduce((closest, cv) => (abs(cv - v) < abs(closest - v) ? cv : closest)) : increment ? _round(v / increment) * increment : v; // 数值吸附到指定增量

/**
 * @param  {Number} start
 * @param  {Number} end
 * @param  {Number} progress
 * @return {Number}
 */
export const interpolate = (start, end, progress) => start + (end - start) * progress; // 线性插值计算

/**
 * @param  {Number} v
 * @return {Number}
 */
export const clampInfinity = v => v === Infinity ? maxValue : v === -Infinity ? -maxValue : v; // 限制无穷大值

/**
 * @param  {Number} v
 * @return {Number}
 */
export const normalizeTime = v => v <= minValue ? minValue : clampInfinity(round(v, 11)); // 标准化时间值

// Arrays
// 数组处理

/**
 * @template T
 * @param {T[]} a
 * @return {T[]}
 */
export const cloneArray = a => isArr(a) ? [ ...a ] : a; // 克隆数组

// Objects
// 对象处理

/**
 * @template T
 * @template U
 * @param {T} o1
 * @param {U} o2
 * @return {T & U}
 */
export const mergeObjects = (o1, o2) => {
  const merged = /** @type {T & U} */({ ...o1 }); // 创建合并对象
  for (let p in o2) {
    const o1p = /** @type {T & U} */(o1)[p];
    merged[p] = isUnd(o1p) ? /** @type {T & U} */(o2)[p] : o1p; // 如果o1中没有该属性，则使用o2的值
  };
  return merged;
} // 合并对象，o1优先级更高

// Linked lists
// 链表操作

/**
 * @param {Object} parent
 * @param {Function} callback
 * @param {Boolean} [reverse]
 * @param {String} [prevProp]
 * @param {String} [nextProp]
 * @return {void}
 */
export const forEachChildren = (parent, callback, reverse, prevProp = '_prev', nextProp = '_next') => {
  let next = parent._head; // 从头节点开始
  let adjustedNextProp = nextProp;
  if (reverse) {
    next = parent._tail; // 如果反向遍历，从尾节点开始
    adjustedNextProp = prevProp;
  }
  while (next) {
    const currentNext = next[adjustedNextProp]; // 保存下一个节点引用
    callback(next); // 执行回调函数
    next = currentNext; // 移动到下一个节点
  }
} // 遍历链表中的所有子节点

/**
 * @param  {Object} parent
 * @param  {Object} child
 * @param  {String} [prevProp]
 * @param  {String} [nextProp]
 * @return {void}
 */
export const removeChild = (parent, child, prevProp = '_prev', nextProp = '_next') => {
  const prev = child[prevProp]; // 获取前一个节点
  const next = child[nextProp]; // 获取后一个节点
  prev ? prev[nextProp] = next : parent._head = next; // 更新前一个节点的next指针，或更新头节点
  next ? next[prevProp] = prev : parent._tail = prev; // 更新后一个节点的prev指针，或更新尾节点
  child[prevProp] = null; // 清空被移除节点的指针
  child[nextProp] = null;
}

/**
 * @param  {Object} parent
 * @param  {Object} child
 * @param  {Function} [sortMethod]
 * @param  {String} prevProp
 * @param  {String} nextProp
 * @return {void}
 */
export const addChild = (parent, child, sortMethod, prevProp = '_prev', nextProp = '_next') => {
  let prev = parent._tail;
  while (prev && sortMethod && sortMethod(prev, child)) prev = prev[prevProp];
  const next = prev ? prev[nextProp] : parent._head;
  prev ? prev[nextProp] = child : parent._head = child;
  next ? next[prevProp] = child : parent._tail = child;
  child[prevProp] = prev;
  child[nextProp] = next;
}
