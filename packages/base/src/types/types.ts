/**
 * Types 模块类型声明
 *
 * 定义 anime.js 中所有核心类型和接口
 * 包括动画参数、拖拽参数、回调函数等
 */

import { JSAnimation } from './animation';
// TODO: Implement WAAPI module
// import { WAAPIAnimation } from './waapi';
import { Timer } from './timer';
import { Timeline } from './timeline';
import { Draggable } from './draggable';
import { ScrollObserver } from './scroll';
import { Scope } from './scope';
// TODO: Implement Spring module
// import { Spring } from './spring';

/**
 * 默认参数接口
 */
export interface DefaultsParams {
  /** 唯一标识符 */
  id?: number | string;
  /** 关键帧配置 */
  keyframes?: PercentageKeyframes | DurationKeyframes;
  /** 播放缓动函数 */
  playbackEase?: EasingParam;
  /** 播放速率 */
  playbackRate?: number;
  /** 帧率 */
  frameRate?: number;
  /** 循环设置 */
  loop?: number | boolean;
  /** 是否反向播放 */
  reversed?: boolean;
  /** 是否交替播放 */
  alternate?: boolean;
  /** 自动播放设置 */
  autoplay?: boolean | ScrollObserver;
  /** 持续时间 */
  duration?: number | FunctionValue;
  /** 延迟时间 */
  delay?: number | FunctionValue;
  /** 循环延迟 */
  loopDelay?: number;
  /** 缓动函数 */
  ease?: EasingParam;
  /** 合成类型 */
  composition?: 'none' | 'replace' | 'blend' | string;
  /** 修饰器函数 */
  modifier?: (v: any) => any;
  /** 开始回调 */
  onBegin?: (tickable: Tickable) => void;
  /** 更新前回调 */
  onBeforeUpdate?: (tickable: Tickable) => void;
  /** 更新回调 */
  onUpdate?: (tickable: Tickable) => void;
  /** 循环回调 */
  onLoop?: (tickable: Tickable) => void;
  /** 暂停回调 */
  onPause?: (tickable: Tickable) => void;
  /** 完成回调 */
  onComplete?: (tickable: Tickable) => void;
  /** 渲染回调 */
  onRender?: (renderable: Renderable) => void;
}

/**
 * 可渲染对象类型
 */
export type Renderable = JSAnimation | Timeline;

/**
 * 可计时对象类型
 */
export type Tickable = Timer | Renderable;

/**
 * 回调函数参数类型
 */
export type CallbackArgument = Timer & JSAnimation & Timeline;

/**
 * 可恢复对象类型
 */
export type Revertible = any | Tickable | Draggable | ScrollObserver | Scope;

/**
 * 拖拽轴参数接口
 */
export interface DraggableAxisParam {
  /** 映射到属性 */
  mapTo?: string;
  /** 修饰器 */
  modifier?: TweenModifier;
  /** 合成类型 */
  composition?: TweenComposition;
  /** 吸附设置 */
  snap?: number | number[] | ((draggable: Draggable) => number | number[]);
}

/**
 * 拖拽光标参数接口
 */
export interface DraggableCursorParams {
  /** 悬停时样式 */
  onHover?: string;
  /** 抓取时样式 */
  onGrab?: string;
}

/**
 * 拖拽参数接口
 */
export interface DraggableParams {
  /** 触发元素 */
  trigger?: DOMTargetSelector;
  /** 容器元素 */
  container?: DOMTargetSelector | number[] | ((draggable: Draggable) => DOMTargetSelector | number[]);
  /** X轴拖拽设置 */
  x?: boolean | DraggableAxisParam;
  /** Y轴拖拽设置 */
  y?: boolean | DraggableAxisParam;
  /** 修饰器 */
  modifier?: TweenModifier;
  /** 吸附设置 */
  snap?: number | number[] | ((draggable: Draggable) => number | number[]);
  /** 容器内边距 */
  containerPadding?: number | number[] | ((draggable: Draggable) => number | number[]);
  /** 容器摩擦力 */
  containerFriction?: number | ((draggable: Draggable) => number);
  /** 释放容器摩擦力 */
  releaseContainerFriction?: number | ((draggable: Draggable) => number);
  /** 拖拽速度 */
  dragSpeed?: number | ((draggable: Draggable) => number);
  /** 滚动速度 */
  scrollSpeed?: number | ((draggable: Draggable) => number);
  /** 滚动阈值 */
  scrollThreshold?: number | ((draggable: Draggable) => number);
  /** 最小速度 */
  minVelocity?: number | ((draggable: Draggable) => number);
  /** 最大速度 */
  maxVelocity?: number | ((draggable: Draggable) => number);
  /** 速度倍数 */
  velocityMultiplier?: number | ((draggable: Draggable) => number);
  /** 释放质量 */
  releaseMass?: number;
  /** 释放刚度 */
  releaseStiffness?: number;
  /** 释放阻尼 */
  releaseDamping?: number;
  /** 释放缓动 */
  releaseEase?: EasingParam;
  /** 光标设置 */
  cursor?: boolean | DraggableCursorParams | ((draggable: Draggable) => boolean | DraggableCursorParams);
  /** 抓取回调 */
  onGrab?: Callback<Draggable>;
  /** 拖拽回调 */
  onDrag?: Callback<Draggable>;
  /** 释放回调 */
  onRelease?: Callback<Draggable>;
  /** 更新回调 */
  onUpdate?: Callback<Draggable>;
  /** 稳定回调 */
  onSettle?: Callback<Draggable>;
  /** 吸附回调 */
  onSnap?: Callback<Draggable>;
  /** 调整大小回调 */
  onResize?: Callback<Draggable>;
  /** 调整大小后回调 */
  onAfterResize?: Callback<Draggable>;
}

/**
 * 可绘制的SVG几何元素
 */
export interface DrawableSVGGeometry extends SVGGeometryElement {
  setAttribute(name: 'draw', value: `${number} ${number}`): void;
  draw: `${number} ${number}`;
}

/**
 * 其他类型定义
 */
export type PercentageKeyframes = any;
export type DurationKeyframes = any;
export type EasingParam = any;
export type FunctionValue = any;
export type TweenModifier = any;
export type TweenComposition = any;
export type DOMTargetSelector = any;
export type Callback<T> = (instance: T) => void;
export type Target = any;
export type DOMTarget = any;
export type TweenPropValue = any;