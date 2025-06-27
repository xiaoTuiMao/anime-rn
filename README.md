# Anime RN
一个用于 React Native 组件开发的 monorepo 仓库，使用 Lerna 进行管理。

## 项目结构

```
anime-rn/
├── packages/          # 组件包
│   └── base/         # Base 组件 - 点击消失的动画按钮
├── examples/         # 示例应用
│   └── demo/         # Expo Demo 应用
└── package.json      # 根目录配置
```

## 组件

### @anime-rn/base

一个基于 react-native-reanimated 的动画按钮组件，点击后会在指定时间内消失。

**特性：**
- 使用 react-native-reanimated 实现流畅的动画效果
- 支持自定义样式和文本
- 点击后自动消失，无需手动管理状态
- 支持自定义动画持续时间

**安装：**
```bash
npm install @anime-rn/base react-native-reanimated
```

**使用：**
```tsx
import { Base } from '@anime-rn/base';

<Base
  title="点击我消失"
  onPress={() => console.log('按钮被点击了！')}
  duration={1000}
/>
```

## 开发

### 开发组件
cd packages/base
npm run dev

### 构建组件

```bash
# 构建 Base 组件
cd packages/base
npm install
npm run build
```

### 运行 Demo

```bash
# 进入 Demo 目录
cd examples/demo

# 安装依赖
npm install

# 启动开发服务器
npm start

# 在 iOS 模拟器上运行
npm run ios

# 在 Android 设备上运行
npm run android
```

----
> 如果要开发组件同时预览，需要在组件对应文件夹下运行 `npm run dev`, 同时启动 example 中的 Demo 工程
----

## 技术栈

- **Monorepo 管理**: Lerna
- **包管理器**: Yarn
- **语言**: TypeScript
- **动画库**: react-native-reanimated
- **Demo 框架**: Expo

## 支持平台

- iOS (模拟器和真机)
- Android (模拟器和真机)
- Web (通过 Expo)