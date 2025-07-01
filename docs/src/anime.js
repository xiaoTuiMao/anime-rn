// 主入口文件 - 导出所有公共API
// Main entry file - exports all public APIs

export { engine } from './engine.js'; // 渲染引擎
export { createTimer, Timer } from './timer.js'; // 定时器创建函数和类
export { animate, JSAnimation } from './animation.js'; // 动画创建函数和类
export { createTimeline, Timeline } from './timeline.js'; // 时间轴创建函数和类
export { createAnimatable, Animatable } from './animatable.js'; // 可动画对象创建函数和类
export { createDraggable, Draggable } from './draggable.js'; // 拖拽创建函数和类
export { createScope, Scope } from './scope.js'; // 作用域创建函数和类
export { onScroll, ScrollObserver, scrollContainers } from './scroll.js'; // 滚动相关功能
export { createSpring, Spring } from './spring.js'; // 弹簧动画创建函数和类
export { waapi, WAAPIAnimation } from './waapi.js'; // Web Animations API相关
export { utils } from './utils.js'; // 工具函数
export { svg } from './svg.js'; // SVG相关功能
export { stagger } from './stagger.js'; // 错开动画功能
export { eases } from './eases.js'; // 缓动函数库