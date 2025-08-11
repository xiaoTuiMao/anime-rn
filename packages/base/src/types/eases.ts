/**
 * Eases 模块类型声明
 *
 * 提供各种缓动函数，用于控制动画的速度变化
 * 包括线性、幂次、正弦、贝塞尔曲线等缓动类型
 */

/**
 * 缓动函数类型
 * @param t - 时间参数 (0-1)
 * @returns 缓动后的值
 */
export type EasingFunction = (t: number) => number;

/**
 * 无缓动函数，直接返回输入值
 */
export const none: EasingFunction = (t: number) => t;

/**
 * 三次贝塞尔曲线缓动函数
 * @param mX1 - 第一个控制点X坐标
 * @param mY1 - 第一个控制点Y坐标
 * @param mX2 - 第二个控制点X坐标
 * @param mY2 - 第二个控制点Y坐标
 * @returns 贝塞尔曲线缓动函数
 */
export function cubicBezier(
  mX1?: number,
  mY1?: number,
  mX2?: number,
  mY2?: number
): EasingFunction;

/**
 * 阶梯式缓动函数
 * @param steps - 阶梯数量
 * @param fromStart - 是否从开始位置跳跃
 * @returns 阶梯式缓动函数
 */
export function steps(steps?: number, fromStart?: boolean): EasingFunction;

/**
 * 线性缓动函数
 * @param args - 控制点参数
 * @returns 线性缓动函数
 */
export function linear(...args: (string | number)[]): EasingFunction;

/**
 * 不规则缓动函数
 * @param length - 长度
 * @param randomness - 随机性
 * @returns 不规则缓动函数
 */
export function irregular(length?: number, randomness?: number): EasingFunction;

/**
 * 幂次缓入函数
 * @param p - 幂次参数
 * @returns 幂次缓入函数
 */
export function easeInPower(p?: number): EasingFunction;

/**
 * 幂次缓出函数
 * @param p - 幂次参数
 * @returns 幂次缓出函数
 */
export function easeOutPower(p?: number): EasingFunction;

/**
 * 幂次缓入缓出函数
 * @param p - 幂次参数
 * @returns 幂次缓入缓出函数
 */
export function easeInOutPower(p?: number): EasingFunction;

/**
 * 正弦缓入函数
 */
export const easeInSine: EasingFunction = (t: number) => 1 - Math.cos((t * Math.PI) / 2);

/**
 * 正弦缓出函数
 */
export const easeOutSine: EasingFunction;

/**
 * 正弦缓入缓出函数
 */
export const easeInOutSine: EasingFunction;

/**
 * 余弦缓入函数
 */
export const easeInCubic: EasingFunction;

/**
 * 余弦缓出函数
 */
export const easeOutCubic: EasingFunction;

/**
 * 余弦缓入缓出函数
 */
export const easeInOutCubic: EasingFunction;

/**
 * 指数缓入函数
 */
export const easeInExpo: EasingFunction;

/**
 * 指数缓出函数
 */
export const easeOutExpo: EasingFunction;

/**
 * 指数缓入缓出函数
 */
export const easeInOutExpo: EasingFunction;

/**
 * 圆形缓入函数
 */
export const easeInCirc: EasingFunction;

/**
 * 圆形缓出函数
 */
export const easeOutCirc: EasingFunction;

/**
 * 圆形缓入缓出函数
 */
export const easeInOutCirc: EasingFunction;

/**
 * 弹性缓入函数
 */
export const easeInElastic: EasingFunction;

/**
 * 弹性缓出函数
 */
export const easeOutElastic: EasingFunction;

/**
 * 弹性缓入缓出函数
 */
export const easeInOutElastic: EasingFunction;

/**
 * 回弹缓入函数
 */
export const easeInBack: EasingFunction;

/**
 * 回弹缓出函数
 */
export const easeOutBack: EasingFunction;

/**
 * 回弹缓入缓出函数
 */
export const easeInOutBack: EasingFunction;

/**
 * 弹跳缓入函数
 */
export const easeInBounce: EasingFunction;

/**
 * 弹跳缓出函数
 */
export const easeOutBounce: EasingFunction;

/**
 * 弹跳缓入缓出函数
 */
export const easeInOutBounce: EasingFunction;

/**
 * 解析缓动字符串
 * @param string - 缓动字符串
 * @param easesFunctions - 缓动函数对象
 * @param easesLookups - 缓动查找对象
 * @returns 缓动函数
 */
export function parseEaseString(
  string: string,
  easesFunctions: Record<string, EasingFunction>,
  easesLookups: Record<string, any>
): EasingFunction;

/**
 * 缓动函数集合
 */
export const eases: {
  none: EasingFunction;
  cubicBezier: typeof cubicBezier;
  steps: typeof steps;
  linear: typeof linear;
  irregular: typeof irregular;
  easeInPower: typeof easeInPower;
  easeOutPower: (p?: number) => EasingFunction;
  easeInOutPower: (p?: number) => EasingFunction;
  easeInSine: EasingFunction;
  easeOutSine: EasingFunction;
  easeInOutSine: EasingFunction;
  easeInCubic: EasingFunction;
  easeOutCubic: EasingFunction;
  easeInOutCubic: EasingFunction;
  easeInExpo: EasingFunction;
  easeOutExpo: EasingFunction;
  easeInOutExpo: EasingFunction;
  easeInCirc: EasingFunction;
  easeOutCirc: EasingFunction;
  easeInOutCirc: EasingFunction;
  easeInElastic: EasingFunction;
  easeOutElastic: EasingFunction;
  easeInOutElastic: EasingFunction;
  easeInBack: EasingFunction;
  easeOutBack: EasingFunction;
  easeInOutBack: EasingFunction;
  easeInBounce: EasingFunction;
  easeOutBounce: EasingFunction;
  easeInOutBounce: EasingFunction;
  parseEaseString: typeof parseEaseString;
};