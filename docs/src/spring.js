/// <reference path='./types.js' />

import {
  minValue,
  K,
} from './consts.js';

import {
  globals,
} from './globals.js';

import {
  round,
  clamp,
  sqrt,
  exp,
  cos,
  sin,
  abs,
} from './helpers.js';

import {
  setValue,
} from './values.js';

/*
 * Spring ease solver adapted from https://webkit.org/demos/spring/spring.js
 * Webkit Copyright © 2016 Apple Inc
 */

/**
 * @typedef {Object} SpringParams
 * @property {Number} [mass=1] - Mass, default 1
 * @property {Number} [stiffness=100] - Stiffness, default 100
 * @property {Number} [damping=10] - Damping, default 10
 * @property {Number} [velocity=0] - Initial velocity, default 0
 */

export class Spring {
  /**
   * @param {SpringParams} [parameters]
   */
  constructor(parameters = {}) {
    this.timeStep = .02; // Interval fed to the solver to calculate duration - 求解器计算持续时间的间隔
    this.restThreshold = .0005; // Values below this threshold are considered resting position - 低于此阈值的值被认为是静止位置
    this.restDuration = 200; // Duration in ms used to check if the spring is resting after reaching restThreshold - 用于检查弹簧在达到静止阈值后是否静止的持续时间（毫秒）
    this.maxDuration = 60000; // The maximum allowed spring duration in ms (default 1 min) - 弹簧的最大允许持续时间（毫秒，默认1分钟）
    this.maxRestSteps = this.restDuration / this.timeStep / K; // How many steps allowed after reaching restThreshold before stopping the duration calculation - 在停止持续时间计算之前，达到静止阈值后允许的步数
    this.maxIterations = this.maxDuration / this.timeStep / K; // Calculate the maximum iterations allowed based on maxDuration - 根据最大持续时间计算允许的最大迭代次数
    this.m = clamp(setValue(parameters.mass, 1), 0, K); // 质量
    this.s = clamp(setValue(parameters.stiffness, 100), 1, K); // 刚度
    this.d = clamp(setValue(parameters.damping, 10), .1, K); // 阻尼
    this.v = clamp(setValue(parameters.velocity, 0), -K, K); // 初始速度
    this.w0 = 0; // 自然频率
    this.zeta = 0; // 阻尼比
    this.wd = 0; // 阻尼频率
    this.b = 0; // 常数
    this.solverDuration = 0; // 求解器持续时间
    this.duration = 0; // 持续时间
    this.compute(); // 计算弹簧参数
    /** @type {EasingFunction} */
    this.ease = t => t === 0 || t === 1 ? t : this.solve(t * this.solverDuration); // 缓动函数
  }

  /** @type {EasingFunction} */
  solve(time) {
    const { zeta, w0, wd, b } = this; // 解构弹簧参数
    let t = time; // 时间
    if (zeta < 1) {
      // 欠阻尼情况
      t = exp(-t * zeta * w0) * (1 * cos(wd * t) + b * sin(wd * t)); // 欠阻尼振荡公式
    } else {
      // 过阻尼或临界阻尼情况
      t = (1 + b * t) * exp(-t * w0); // 过阻尼公式
    }
    return 1 - t; // 返回补间值
  } // 求解弹簧运动

  compute() {
    const { maxRestSteps, maxIterations, restThreshold, timeStep, m, d, s, v } = this; // 解构参数
    const w0 = this.w0 = clamp(sqrt(s / m), minValue, K); // 计算自然频率
    const zeta = this.zeta = d / (2 * sqrt(s * m)); // 计算阻尼比
    const wd = this.wd = zeta < 1 ? w0 * sqrt(1 - zeta * zeta) : 0; // 计算阻尼频率
    this.b = zeta < 1 ? (zeta * w0 + -v) / wd : -v + w0; // 计算常数b
    let solverTime = 0; // 求解器时间
    let restSteps = 0; // 静止步数
    let iterations = 0; // 迭代次数
    while (restSteps < maxRestSteps && iterations < maxIterations) {
      // 循环直到达到静止条件或最大迭代次数
      if (abs(1 - this.solve(solverTime)) < restThreshold) {
        restSteps++; // 如果接近静止位置，增加静止步数
      } else {
        restSteps = 0; // 否则重置静止步数
      }
      this.solverDuration = solverTime; // 更新求解器持续时间
      solverTime += timeStep; // 增加时间步长
      iterations++; // 增加迭代次数
    }
    this.duration = round(this.solverDuration * K, 0) * globals.timeScale; // 计算最终持续时间
  } // 计算弹簧参数和持续时间

  get mass() {
    return this.m; // 返回质量
  }

  set mass(v) {
    this.m = clamp(setValue(v, 1), 0, K); // 设置质量
    this.compute(); // 重新计算
  }

  get stiffness() {
    return this.s; // 返回刚度
  }

  set stiffness(v) {
    this.s = clamp(setValue(v, 100), 1, K); // 设置刚度
    this.compute(); // 重新计算
  }

  get damping() {
    return this.d; // 返回阻尼
  }

  set damping(v) {
    this.d = clamp(setValue(v, 10), .1, K); // 设置阻尼
    this.compute(); // 重新计算
  }

  get velocity() {
    return this.v; // 返回初始速度
  }

  set velocity(v) {
    this.v = clamp(setValue(v, 0), -K, K); // 设置初始速度
    this.compute(); // 重新计算
  }
}

/**
 * @param {SpringParams} [parameters]
 * @returns {Spring}
 */
export const createSpring = (parameters) => new Spring(parameters); // 创建弹簧的工厂函数
