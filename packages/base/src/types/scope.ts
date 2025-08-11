/**
 * Scope 模块类型声明
 *
 * 作用域管理模块，提供完整的作用域管理功能
 * 包括作用域创建和管理、全局状态隔离、资源自动清理等
 */

import { DefaultsParams } from './types';

/**
 * React 引用类型定义
 */
export interface ReactRef {
  /** React 组件的当前 DOM 元素引用 */
  current?: HTMLElement | SVGElement | null;
}

/**
 * Angular 引用类型定义
 */
export interface AngularRef {
  /** Angular 组件的原生 DOM 元素 */
  nativeElement?: HTMLElement | SVGElement;
}

/**
 * 作用域参数类型定义
 */
export interface ScopeParams {
  /** 根元素选择器或引用 */
  root?: string | HTMLElement | ReactRef | AngularRef;
  /** 作用域默认参数 */
  defaults?: DefaultsParams;
  /** 媒体查询配置 */
  mediaQueries?: Record<string, string>;
}

/**
 * 作用域清理回调函数类型
 */
export type ScopeCleanup = (scope?: Scope) => void;

/**
 * 作用域构造函数类型
 */
export type ScopeConstructor = (scope?: Scope) => ScopeCleanup | void;

/**
 * 作用域方法类型
 */
export type ScopeMethod = (...args: any[]) => ScopeCleanup | void;

/**
 * 作用域回调函数类型
 */
export type ScopedCallback = (scope: Scope) => any;

/**
 * 构造函数回调类型
 */
export type ConstructorCallback = (self: Scope) => void;

/**
 * 可恢复对象接口
 */
export interface Revertible {
  /** 恢复方法 */
  revert(): void;
}

/**
 * 作用域类
 * 管理动画和资源的作用域
 */
export class Scope {
  /** 根元素 */
  root: Document | HTMLElement;
  /** 标签映射，用于存储命名的时间点 */
  labels: Record<string, number>;
  /** 默认参数，优先使用父级默认值，否则使用全局默认值 */
  defaults: DefaultsParams;
  /** 渲染回调 */
  onRender: (scope: Scope) => void;
  /** 缓动函数 */
  _ease: Function | null;
  /** 迭代持续时间 */
  iterationDuration: number;
  /** 构造函数数组 */
  constructors: ScopeConstructor[];
  /** 恢复构造函数数组 */
  revertConstructors: Function[];
  /** 可恢复对象数组 */
  revertibles: Revertible[];
  /** 方法映射 */
  methods: Record<string, Function>;
  /** 匹配状态映射 */
  matches: Record<string, boolean>;
  /** 媒体查询列表映射 */
  mediaQueryLists: Record<string, MediaQueryList>;
  /** 数据映射 */
  data: Record<string, any>;

  /**
   * 作用域构造函数
   *
   * 这个构造函数会：
   * 1. 调用父类构造函数
   * 2. 初始化时间线特有的属性
   * 3. 设置默认参数和回调
   * 4. 配置缓动函数
   *
   * @param parameters - 作用域参数对象
   */
  constructor(parameters?: ScopeParams);

  /**
   * 在作用域内执行回调函数
   *
   * 这个方法会：
   * 1. 保存当前全局状态
   * 2. 设置当前作用域为全局状态
   * 3. 执行回调函数
   * 4. 恢复之前的全局状态
   *
   * @param cb - 要在作用域内执行的回调函数
   * @returns 回调函数的返回值
   */
  execute(cb: ScopedCallback): any;

  /**
   * 刷新作用域
   *
   * 这个方法会：
   * 1. 恢复所有可恢复对象
   * 2. 执行所有恢复构造函数
   * 3. 重新执行所有构造函数
   * 4. 更新媒体查询状态
   *
   * @returns 返回自身，支持链式调用
   */
  refresh(): this;

  /**
   * 添加构造函数或方法
   *
   * 这个方法支持两种用法：
   * 1. 添加构造函数：传入函数，自动执行并管理生命周期
   * 2. 添加方法：传入字符串和方法函数，创建命名方法
   *
   * @param a1 - 构造函数或方法名
   * @param a2 - 方法函数（可选）
   * @returns 返回自身，支持链式调用
   */
  add(a1: ScopeConstructor): this;
  add(a1: string, a2: ScopeMethod): this;

  /**
   * 处理事件
   *
   * 当前支持的事件类型：
   * - 'change': 媒体查询变化事件，自动刷新作用域
   *
   * @param e - 事件对象
   */
  handleEvent(e: Event): void;

  /**
   * 恢复作用域状态
   *
   * 这个方法会：
   * 1. 恢复所有可恢复对象
   * 2. 执行所有恢复构造函数
   * 3. 移除所有媒体查询监听器
   * 4. 清空所有状态数据
   */
  revert(): void;
}

/**
 * 创建作用域的工厂函数
 *
 * 这个函数会：
 * 1. 创建新的 Scope 实例
 * 2. 自动初始化作用域配置
 * 3. 返回配置好的作用域对象
 *
 * @param params - 作用域参数对象
 * @returns 返回配置好的作用域实例
 */
export function createScope(params?: ScopeParams): Scope;