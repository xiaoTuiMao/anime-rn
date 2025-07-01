/// <reference path='./types.js' />

import {
  K,
  noop,
  maxFps,
  compositionTypes,
  win,
  doc,
  isBrowser,
} from './consts.js';

/** @type {DefaultsParams} */
export const defaults = {
  id: null,                    // 动画ID
  keyframes: null,             // 关键帧
  playbackEase: null,          // 播放缓动函数
  playbackRate: 1,             // 播放速率
  frameRate: maxFps,           // 帧率
  loop: 0,                     // 循环次数
  reversed: false,             // 是否反向播放
  alternate: false,            // 是否交替播放
  autoplay: true,              // 是否自动播放
  duration: K,                 // 动画持续时间
  delay: 0,                    // 延迟时间
  loopDelay: 0,                // 循环延迟
  ease: 'out(2)',              // 缓动函数
  composition: compositionTypes.replace, // 组合模式
  modifier: v => v,            // 值修改器
  onBegin: noop,               // 开始回调
  onBeforeUpdate: noop,        // 更新前回调
  onUpdate: noop,              // 更新回调
  onLoop: noop,                // 循环回调
  onPause: noop,               // 暂停回调
  onComplete: noop,            // 完成回调
  onRender: noop,              // 渲染回调
} // 默认动画参数

export const globals = {
  /** @type {DefaultsParams} */
  defaults,                    // 默认参数
  /** @type {Document|DOMTarget} */
  root: doc,                   // 根元素
  /** @type {Scope} */
  scope: null,                 // 当前作用域
  /** @type {Number} */
  precision: 4,                // 数值精度
  /** @type {Number} */
  timeScale: 1,                // 时间缩放
  /** @type {Number} */
  tickThreshold: 200,          // 渲染阈值
} // 全局配置对象

export const globalVersions = { version: '__packageVersion__', engine: null }; // 全局版本信息

if (isBrowser) {
  if (!win.AnimeJS) win.AnimeJS = []; // 如果全局AnimeJS数组不存在，则创建
  win.AnimeJS.push(globalVersions); // 将版本信息添加到全局数组
} // 在浏览器环境中注册全局版本信息
