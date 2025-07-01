// Environments
// 环境检测

// TODO: Do we need to check if we're running inside a worker ?
// TODO: 是否需要检查是否在worker中运行？
export const isBrowser = typeof window !== 'undefined'; // 检测是否在浏览器环境中

/** @type {Object|Null} */
export const win = isBrowser ? window : null; // 全局window对象引用

/** @type {Document} */
export const doc = isBrowser ? document : null; // 全局document对象引用

// Enums
// 枚举定义

/** @enum {Number} */
export const tweenTypes = {
  OBJECT: 0,    // 对象属性动画
  ATTRIBUTE: 1, // SVG属性动画
  CSS: 2,       // CSS属性动画
  TRANSFORM: 3, // CSS变换动画
  CSS_VAR: 4,   // CSS变量动画
}

/** @enum {Number} */
export const valueTypes = {
  NUMBER: 0,  // 数值类型
  UNIT: 1,    // 带单位类型
  COLOR: 2,   // 颜色类型
  COMPLEX: 3, // 复杂类型
}

/** @enum {Number} */
export const tickModes = {
  NONE: 0,  // 不渲染
  AUTO: 1,  // 自动渲染
  FORCE: 2, // 强制渲染
}

/** @enum {Number} */
export const compositionTypes = {
  replace: 0, // 替换模式
  none: 1,    // 无组合
  blend: 2,   // 混合模式
}

// Cache symbols
// 缓存符号

export const isRegisteredTargetSymbol = Symbol(); // 目标注册状态符号
export const isDomSymbol = Symbol();              // DOM元素标识符号
export const isSvgSymbol = Symbol();              // SVG元素标识符号
export const transformsSymbol = Symbol();         // 变换缓存符号
export const morphPointsSymbol = Symbol();        // 变形点符号
export const proxyTargetSymbol = Symbol();        // 代理目标符号

// Numbers
// 数值常量

export const minValue = 1e-11; // 最小有效值
export const maxValue = 1e12;  // 最大有效值
export const K = 1e3;          // 千位单位
export const maxFps = 120;     // 最大帧率

// Strings
// 字符串常量

export const emptyString = ''; // 空字符串
export const shortTransforms = new Map(); // 简写变换映射表

shortTransforms.set('x', 'translateX'); // x轴平移简写
shortTransforms.set('y', 'translateY'); // y轴平移简写
shortTransforms.set('z', 'translateZ'); // z轴平移简写

export const validTransforms = [
  'translateX',   // X轴平移
  'translateY',   // Y轴平移
  'translateZ',   // Z轴平移
  'rotate',       // 旋转
  'rotateX',      // X轴旋转
  'rotateY',      // Y轴旋转
  'rotateZ',      // Z轴旋转
  'scale',        // 缩放
  'scaleX',       // X轴缩放
  'scaleY',       // Y轴缩放
  'scaleZ',       // Z轴缩放
  'skew',         // 倾斜
  'skewX',        // X轴倾斜
  'skewY',        // Y轴倾斜
  'perspective',  // 透视
  'matrix',       // 矩阵变换
  'matrix3d',     // 3D矩阵变换
];

// 生成变换函数字符串映射表
export const transformsFragmentStrings = validTransforms.reduce((a, v) => ({...a, [v]: v + '('}), {});

// Functions
// 函数常量

/** @return {void} */
export const noop = () => {}; // 空操作函数

// Regex
// 正则表达式

export const hexTestRgx = /(^#([\da-f]{3}){1,2}$)|(^#([\da-f]{4}){1,2}$)/i; // 十六进制颜色测试
export const rgbExecRgx = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i // RGB颜色解析
export const rgbaExecRgx = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(-?\d+|-?\d*.\d+)\s*\)/i // RGBA颜色解析
export const hslExecRgx = /hsl\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*\)/i; // HSL颜色解析
export const hslaExecRgx = /hsla\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)\s*\)/i; // HSLA颜色解析
// export const digitWithExponentRgx = /[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g;
export const digitWithExponentRgx = /[-+]?\d*\.?\d+(?:e[-+]?\d)?/gi; // 带指数的数字解析
// export const unitsExecRgx = /^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)+([a-z]+|%)$/i;
export const unitsExecRgx = /^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)([a-z]+|%)$/i // 带单位的数值解析
export const lowerCaseRgx = /([a-z])([A-Z])/g; // 驼峰命名转小写
export const transformsExecRgx = /(\w+)(\([^)]+\)+)/g; // Match inline transforms with cacl() values, returns the value wrapped in ()
// 内联变换解析，匹配calc()值，返回括号内的值
export const relativeValuesExecRgx = /(\*=|\+=|-=)/; // 相对值操作符解析
