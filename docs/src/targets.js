/// <reference path='./types.js' />

import {
  globals,
} from './globals.js';

import {
  isRegisteredTargetSymbol,
  isDomSymbol,
  isSvgSymbol,
  transformsSymbol,
  isBrowser,
} from './consts.js';

import {
  isSvg,
  isNil,
  isArr,
  isStr,
} from './helpers.js';

/**
 * @param  {DOMTargetsParam|TargetsParam} v
 * @return {NodeList|HTMLCollection}
 */
export function getNodeList(v) {
  const n = isStr(v) ? globals.root.querySelectorAll(v) : v; // 如果是字符串，使用选择器查询，否则直接使用
  if (n instanceof NodeList || n instanceof HTMLCollection) return n; // 如果是NodeList或HTMLCollection，直接返回
} // 获取节点列表

/**
 * @overload
 * @param  {DOMTargetsParam} targets
 * @return {DOMTargetsArray}
 *
 * @overload
 * @param  {JSTargetsParam} targets
 * @return {JSTargetsArray}
 *
 * @overload
 * @param  {TargetsParam} targets
 * @return {TargetsArray}
 *
 * @param  {DOMTargetsParam|JSTargetsParam|TargetsParam} targets
 */
export function parseTargets(targets) {
  if (isNil(targets)) return /** @type {TargetsArray} */([]); // 如果目标为空，返回空数组
  if (isArr(targets)) {
    const flattened = targets.flat(Infinity); // 扁平化数组
    /** @type {TargetsArray} */
    const parsed = []; // 解析后的目标数组
    for (let i = 0, l = flattened.length; i < l; i++) {
      const item = flattened[i]; // 当前项
      if (!isNil(item)) {
        const nodeList = getNodeList(item); // 获取节点列表
        if (nodeList) {
          // 如果是节点列表，遍历所有节点
          for (let j = 0, jl = nodeList.length; j < jl; j++) {
            const subItem = nodeList[j]; // 子项
            if (!isNil(subItem)) {
              let isDuplicate = false; // 是否重复标志
              // 检查是否重复
              for (let k = 0, kl = parsed.length; k < kl; k++) {
                if (parsed[k] === subItem) {
                  isDuplicate = true;
                  break;
                }
              }
              if (!isDuplicate) {
                parsed.push(subItem); // 添加非重复项
              }
            }
          }
        } else {
          // 如果不是节点列表，直接检查重复
          let isDuplicate = false;
          for (let j = 0, jl = parsed.length; j < jl; j++) {
            if (parsed[j] === item) {
              isDuplicate = true;
              break;
            }
          }
          if (!isDuplicate) {
            parsed.push(item); // 添加非重复项
          }
        }
      }
    }
    return parsed; // 返回解析后的数组
  }
  if (!isBrowser) return /** @type {JSTargetsArray} */([targets]); // 非浏览器环境，直接返回包装数组
  const nodeList = getNodeList(targets); // 获取节点列表
  if (nodeList) return /** @type {DOMTargetsArray} */(Array.from(nodeList)); // 如果是节点列表，转换为数组
  return /** @type {TargetsArray} */([targets]); // 否则直接返回包装数组
} // 解析目标，支持多种输入格式并去重

/**
 * @overload
 * @param  {DOMTargetsParam} targets
 * @return {DOMTargetsArray}
 *
 * @overload
 * @param  {JSTargetsParam} targets
 * @return {JSTargetsArray}
 *
 * @overload
 * @param  {TargetsParam} targets
 * @return {TargetsArray}
 *
 * @param  {DOMTargetsParam|JSTargetsParam|TargetsParam} targets
 */
export function registerTargets(targets) {
  const parsedTargetsArray = parseTargets(targets); // 解析目标
  const parsedTargetsLength = parsedTargetsArray.length; // 目标数量
  if (parsedTargetsLength) {
    for (let i = 0; i < parsedTargetsLength; i++) {
      const target = parsedTargetsArray[i]; // 当前目标
      if (!target[isRegisteredTargetSymbol]) {
        target[isRegisteredTargetSymbol] = true; // 标记为已注册
        const isSvgType = isSvg(target); // 是否为SVG元素
        const isDom = /** @type {DOMTarget} */(target).nodeType || isSvgType; // 是否为DOM元素
        if (isDom) {
          target[isDomSymbol] = true; // 标记为DOM元素
          target[isSvgSymbol] = isSvgType; // 标记是否为SVG
          target[transformsSymbol] = {}; // 初始化变换缓存
        }
      }
    }
  }
  return parsedTargetsArray; // 返回注册后的目标数组
} // 注册目标，为DOM元素添加必要的符号标记

