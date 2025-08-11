/**
 * Draggable 模块类型声明
 *
 * 拖拽功能模块，提供完整的拖拽功能
 * 包括鼠标和触摸拖拽支持、拖拽边界限制、拖拽惯性效果等
 */

import { Timer } from './timer';

/**
 * 拖拽光标参数接口
 */
export interface DraggableCursorParams {
  /** 光标样式 */
  cursor?: string;
  /** 是否显示光标 */
  show?: boolean;
}

/**
 * 拖拽参数接口
 */
export interface DraggableParams {
  /** X轴拖拽配置 */
  x?: boolean | {
    /** 映射到的属性名 */
    mapTo?: string;
    /** 拖拽范围 */
    range?: [number, number];
    /** 拖拽速度 */
    speed?: number;
  };
  /** Y轴拖拽配置 */
  y?: boolean | {
    /** 映射到的属性名 */
    mapTo?: string;
    /** 拖拽范围 */
    range?: [number, number];
    /** 拖拽速度 */
    speed?: number;
  };
  /** 拖拽触发器 */
  trigger?: any;
  /** 拖拽修饰器 */
  modifier?: (value: number, target: any, property: string) => number;
  /** 释放缓动函数 */
  releaseEase?: string | Function | {
    /** 弹簧缓动 */
    ease: string;
    /** 弹簧持续时间 */
    duration: number;
  };
  /** 弹簧质量 */
  releaseMass?: number;
  /** 弹簧刚度 */
  releaseStiffness?: number;
  /** 弹簧阻尼 */
  releaseDamping?: number;
  /** 拖拽容器 */
  container?: any;
  /** 拖拽边界 */
  bounds?: [number, number, number, number] | string;
  /** 拖拽速度 */
  dragSpeed?: number;
  /** 最大速度 */
  maxVelocity?: number;
  /** 最小速度 */
  minVelocity?: number;
  /** 速度倍数 */
  velocityMultiplier?: number;
  /** 光标配置 */
  cursor?: boolean | DraggableCursorParams;
  /** 抓取回调 */
  onGrab?: (draggable: Draggable) => void;
  /** 拖拽回调 */
  onDrag?: (draggable: Draggable) => void;
  /** 释放回调 */
  onRelease?: (draggable: Draggable) => void;
  /** 拖拽开始回调 */
  onDragStart?: (draggable: Draggable) => void;
  /** 拖拽结束回调 */
  onDragEnd?: (draggable: Draggable) => void;
}

/**
 * DOM代理类接口
 * 为Canvas元素提供DOM-like接口
 */
export interface DOMProxy {
  /** 元素对象 */
  el: any;
  /** Z轴层级 */
  zIndex: number;
  /** 父元素 */
  parentElement: any;
  /** 类列表 */
  classList: {
    add: (className: string) => void;
    remove: (className: string) => void;
  };
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 获取边界矩形 */
  getBoundingClientRect(): DOMRect;
}

/**
 * 变换类接口
 */
export interface Transforms {
  /** 元素 */
  $el: any;
  /** 内联变换 */
  inlineTransforms: Record<string, string>;
  /** 构造函数 */
  constructor($el: any): void;
  /** 标准化点 */
  normalizePoint(x: number, y: number): [number, number];
  /** 向上遍历 */
  traverseUp(cb: (el: any, i: number) => void): void;
  /** 获取矩阵 */
  getMatrix(): DOMMatrix;
  /** 移除变换 */
  remove(): void;
  /** 恢复变换 */
  revert(): void;
}

/**
 * 可拖拽类
 * 实现元素的拖拽功能
 */
export class Draggable extends Timer {
  /** 拖拽目标 */
  $target: any;
  /** 拖拽触发器 */
  $trigger: any;
  /** 拖拽容器 */
  $container: any;
  /** 滚动容器 */
  $scrollContainer: any;
  /** 是否固定定位 */
  fixed: boolean = false;
  /** 是否精细指针 */
  isFinePointer: boolean = false;
  /** 容器内边距 */
  containerPadding: [number, number, number, number] = [0, 0, 0, 0];
  /** 容器摩擦力 */
  containerFriction: number = 0.8;
  /** 释放容器摩擦力 */
  releaseContainerFriction: number = 0.8;
  /** X轴对齐 */
  snapX: number | number[] = 0;
  /** Y轴对齐 */
  snapY: number | number[] = 0;
  /** 滚动速度 */
  scrollSpeed: number = 1;
  /** 滚动阈值 */
  scrollThreshold: number = 0.1;
  /** 拖拽速度 */
  dragSpeed: number = 1;
  /** 最大速度 */
  maxVelocity: number = 1000;
  /** 最小速度 */
  minVelocity: number = 0;
  /** 速度倍数 */
  velocityMultiplier: number = 1;
  /** 光标配置 */
  cursor: boolean | DraggableCursorParams = false;
  /** X轴释放弹簧 */
  releaseXSpring: any = null;
  /** Y轴释放弹簧 */
  releaseYSpring: any = null;
  /** 释放缓动函数 */
  releaseEase: Function = () => {};
  /** 是否有释放弹簧 */
  hasReleaseSpring: boolean = false;
  /** 抓取回调 */
  onGrab: (draggable: Draggable) => void = () => {};
  /** 拖拽回调 */
  onDrag: (draggable: Draggable) => void = () => {};
  /** 释放回调 */
  onRelease: (draggable: Draggable) => void = () => {};
  /** 拖拽开始回调 */
  onDragStart: (draggable: Draggable) => void = () => {};
  /** 拖拽结束回调 */
  onDragEnd: (draggable: Draggable) => void = () => {};

  /**
   * 可拖拽构造函数
   *
   * 这个构造函数会：
   * 1. 解析拖拽目标和参数
   * 2. 设置拖拽容器和边界
   * 3. 配置拖拽属性和选项
   * 4. 初始化拖拽事件系统
   * 5. 设置弹簧动画和缓动函数
   *
   * @param target - 拖拽目标（DOM元素、Canvas元素等）
   * @param parameters - 拖拽参数对象
   */
  constructor(target: any, parameters?: DraggableParams);

  /**
   * 计算拖拽速度
   * @param dx - X轴位移
   * @param dy - Y轴位移
   * @returns 速度值
   */
  computeVelocity(dx: number, dy: number): number;

  /**
   * 设置X坐标
   * @param x - X坐标值
   * @param muteUpdateCallback - 是否静音更新回调
   * @returns 返回自身
   */
  setX(x: number, muteUpdateCallback?: boolean): this;

  /**
   * 设置Y坐标
   * @param y - Y坐标值
   * @param muteUpdateCallback - 是否静音更新回调
   * @returns 返回自身
   */
  setY(y: number, muteUpdateCallback?: boolean): this;

  /** X坐标 */
  get x(): number;
  set x(x: number);

  /** Y坐标 */
  get y(): number;
  set y(y: number);

  /** X轴进度 */
  get progressX(): number;
  set progressX(x: number);

  /** Y轴进度 */
  get progressY(): number;
  set progressY(y: number);

  /**
   * 更新滚动坐标
   */
  updateScrollCoords(): void;

  /**
   * 更新边界值
   */
  updateBoundingValues(): void;

  /**
   * 检查是否超出边界
   * @param bounds - 边界数组
   * @param x - X坐标
   * @param y - Y坐标
   * @returns 是否超出边界
   */
  isOutOfBounds(bounds: [number, number, number, number], x: number, y: number): boolean;

  /**
   * 刷新拖拽状态
   */
  refresh(): void;

  /**
   * 更新拖拽状态
   */
  update(): void;

  /**
   * 停止拖拽
   */
  stop(): void;

  /**
   * 滚动到视图中
   * @param duration - 动画持续时间
   * @param gap - 边距
   * @param ease - 缓动函数
   */
  scrollInView(duration?: number, gap?: number, ease?: Function): void;

  /**
   * 处理悬停事件
   */
  handleHover(): void;

  /**
   * 动画进入视图
   * @param duration - 动画持续时间
   * @param gap - 边距
   * @param ease - 缓动函数
   */
  animateInView(duration?: number, gap?: number, ease?: Function): void;

  /**
   * 处理按下事件
   * @param e - 事件对象
   */
  handleDown(e: Event): void;

  /**
   * 处理移动事件
   * @param e - 事件对象
   */
  handleMove(e: Event): void;

  /**
   * 处理释放事件
   */
  handleUp(): void;

  /**
   * 重置拖拽状态
   */
  reset(): void;

  /**
   * 启用拖拽
   */
  enable(): void;

  /**
   * 禁用拖拽
   */
  disable(): void;

  /**
   * 恢复拖拽状态
   */
  revert(): void;

  /**
   * 处理事件
   * @param e - 事件对象
   */
  handleEvent(e: Event): void;
}

/**
 * 创建拖拽对象的工厂函数
 * @param target - 拖拽目标
 * @param parameters - 拖拽参数
 * @returns 拖拽对象实例
 */
export function createDraggable(target: any, parameters?: DraggableParams): Draggable;