/**
 * anime.js 主入口文件类型声明
 *
 * 这是 anime.js 的主要入口点，导出所有公共 API
 * 包括渲染引擎、定时器、动画、时间轴等核心功能
 */

// 从各个模块导出的类型
export { engine } from './engine';
export { createTimer, Timer } from './timer';
export { animate, JSAnimation } from './animation';
export { createTimeline, Timeline } from './timeline';
export { createAnimatable, Animatable } from './animatable';
export { createDraggable, Draggable } from './draggable';
export { createScope, Scope } from './scope';
export { onScroll, ScrollObserver, scrollContainers } from './scroll';
// TODO: Implement these modules
// export { createSpring, Spring } from './spring';
// export { waapi, WAAPIAnimation } from './waapi';
// export { utils } from './utils';
// export { svg } from './svg';
export { stagger } from './stagger';
export { eases } from './eases';

/**
 * anime.js 主函数类型
 * 用于创建和管理动画
 */
export interface Anime {
  // 基础动画配置
  targets: any | any[];
  duration: number;
  easing: string | Function;
  delay: number | Function;

  // 动画属性
  [key: string]: any;
}

/**
 * 创建动画实例的函数类型
 * @param params - 动画参数对象
 * @returns 返回动画实例
 */
export function anime(params: Anime): any;

/**
 * 默认导出的 anime 函数
 */
export default anime;