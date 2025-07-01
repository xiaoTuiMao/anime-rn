/// <reference path='./types.js' />

import {
  doc,
  win,
} from './consts.js';

import {
  globals,
} from './globals.js';

import {
  isFnc,
  mergeObjects,
} from './helpers.js';

import {
  parseTargets,
} from './targets.js';

/**
 * @typedef {Object} ReactRef
 * @property {HTMLElement|SVGElement|null} [current]
 */

/**
 * @typedef {Object} AngularRef
 * @property {HTMLElement|SVGElement} [nativeElement]
 */

/**
 * @typedef {Object} ScopeParams
 * @property {DOMTargetSelector|ReactRef|AngularRef} [root]
 * @property {DefaultsParams} [defaults]
 * @property {Record<String, String>} [mediaQueries]
 */

/**
 * @callback ScopeCleanup
 * @param {Scope} [scope]
 */

/**
 * @callback ScopeConstructor
 * @param {Scope} [scope]
 * @return {ScopeCleanup|void}
 */

/**
 * @callback ScopeMethod
 * @param {...*} args
 * @return {ScopeCleanup|void}
 */

export class Scope {
  /** @param {ScopeParams} [parameters] */
  constructor(parameters = {}) {
    if (globals.scope) globals.scope.revertibles.push(this); // 如果存在全局作用域，添加到可恢复列表
    const rootParam = parameters.root; // 根元素参数
    /** @type {Document|DOMTarget} */
    let root = doc; // 默认根元素为文档
    if (rootParam) {
      // 如果提供了根元素参数，解析根元素
      root = /** @type {ReactRef} */(rootParam).current ||
             /** @type {AngularRef} */(rootParam).nativeElement ||
             parseTargets(/** @type {DOMTargetSelector} */(rootParam))[0] ||
             doc;
    }
    const scopeDefaults = parameters.defaults; // 作用域默认值
    const globalDefault = globals.defaults; // 全局默认值
    const mediaQueries = parameters.mediaQueries; // 媒体查询
    /** @type {DefaultsParams} */
    this.defaults = scopeDefaults ? mergeObjects(scopeDefaults, globalDefault) : globalDefault; // 合并默认值
    /** @type {Document|DOMTarget} */
    this.root = root; // 根元素
    /** @type {Array<ScopeConstructor>} */
    this.constructors = []; // 构造函数数组
    /** @type {Array<Function>} */
    this.revertConstructors = []; // 恢复构造函数数组
    /** @type {Array<Revertible>} */
    this.revertibles = []; // 可恢复对象数组
    /** @type {Record<String, Function>} */
    this.methods = {}; // 方法映射
    /** @type {Record<String, Boolean>} */
    this.matches = {}; // 匹配状态映射
    /** @type {Record<String, MediaQueryList>} */
    this.mediaQueryLists = {}; // 媒体查询列表映射
    /** @type {Record<String, any>} */
    this.data = {}; // 数据映射
    if (mediaQueries) {
      // 如果有媒体查询，设置监听器
      for (let mq in mediaQueries) {
        const _mq = win.matchMedia(mediaQueries[mq]); // 创建媒体查询列表
        this.mediaQueryLists[mq] = _mq; // 保存媒体查询列表
        _mq.addEventListener('change', this); // 添加变化监听器
      }
    }
  }

  /**
   * @callback ScoppedCallback
   * @param {this} scope
   * @return {any}
   *
   * @param {ScoppedCallback} cb
   * @return {this}
   */
  execute(cb) {
    let activeScope = globals.scope; // 保存当前作用域
    let activeRoot = globals.root; // 保存当前根元素
    let activeDefaults = globals.defaults; // 保存当前默认值
    globals.scope = this; // 设置全局作用域为当前作用域
    globals.root = this.root; // 设置全局根元素为当前根元素
    globals.defaults = this.defaults; // 设置全局默认值为当前默认值
    const mqs = this.mediaQueryLists; // 获取媒体查询列表
    for (let mq in mqs) this.matches[mq] = mqs[mq].matches; // 更新匹配状态
    const returned = cb(this); // 执行回调函数
    globals.scope = activeScope; // 恢复全局作用域
    globals.root = activeRoot; // 恢复全局根元素
    globals.defaults = activeDefaults; // 恢复全局默认值
    return returned; // 返回回调结果
  } // 在作用域内执行回调函数

  /**
   * @return {this}
   */
  refresh() {
    this.execute(() => {
      let i = this.revertibles.length; // 可恢复对象数量
      let y = this.revertConstructors.length; // 恢复构造函数数量
      while (i--) this.revertibles[i].revert(); // 恢复所有可恢复对象
      while (y--) this.revertConstructors[y](this); // 执行所有恢复构造函数
      this.revertibles.length = 0; // 清空可恢复对象数组
      this.revertConstructors.length = 0; // 清空恢复构造函数数组
      this.constructors.forEach( constructor => {
        // 重新执行所有构造函数
        const revertConstructor = constructor(this);
        if (revertConstructor) {
          this.revertConstructors.push(revertConstructor); // 添加到恢复构造函数数组
        }
      });
    });
    return this; // 返回自身
  } // 刷新作用域

  /**
   * @callback contructorCallback
   * @param {this} self
   *
   * @overload
   * @param {String} a1
   * @param {ScopeMethod} a2
   * @return {this}
   *
   * @overload
   * @param {contructorCallback} a1
   * @return {this}
   *
   * @param {String|contructorCallback} a1
   * @param {ScopeMethod} [a2]
   */
  add(a1, a2) {
    if (isFnc(a1)) {
      // 如果第一个参数是函数，作为构造函数添加
      const constructor = /** @type {contructorCallback} */(a1);
      this.constructors.push(constructor); // 添加到构造函数数组
      this.execute(() => {
        const revertConstructor = constructor(this); // 执行构造函数
        if (revertConstructor) {
          this.revertConstructors.push(revertConstructor); // 添加到恢复构造函数数组
        }
      });
    } else {
      // 如果第一个参数是字符串，作为方法添加
      this.methods[/** @type {String} */(a1)] = (/** @type {any} */...args) => this.execute(() => a2(...args));
    }
    return this; // 返回自身
  } // 添加构造函数或方法

  /**
   * @param {Event} e
   */
  handleEvent(e) {
    switch (e.type) {
      case 'change':
        this.refresh(); // 如果是变化事件，刷新作用域
        break;
    }
  } // 处理事件

  revert() {
    const revertibles = this.revertibles; // 获取可恢复对象数组
    const revertConstructors = this.revertConstructors; // 获取恢复构造函数数组
    const mqs = this.mediaQueryLists; // 获取媒体查询列表
    let i = revertibles.length; // 可恢复对象数量
    let y = revertConstructors.length; // 恢复构造函数数量
    while (i--) revertibles[i].revert(); // 恢复所有可恢复对象
    while (y--) revertConstructors[y](this); // 执行所有恢复构造函数
    for (let mq in mqs) mqs[mq].removeEventListener('change', this); // 移除所有媒体查询监听器
    revertibles.length = 0; // 清空可恢复对象数组
    revertConstructors.length = 0; // 清空恢复构造函数数组
    this.constructors.length = 0; // 清空构造函数数组
    this.matches = {}; // 清空匹配状态映射
    this.methods = {}; // 清空方法映射
    this.mediaQueryLists = {}; // 清空媒体查询列表映射
    this.data = {}; // 清空数据映射
  }
}

/**
 * @param {ScopeParams} [params]
 * @return {Scope}
 */
export const createScope = params => new Scope(params);