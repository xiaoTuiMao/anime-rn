# @anime-rn/base

一个基于 react-native-reanimated 的动画按钮组件，点击后会在指定时间内消失。

## 安装

```bash
npm install @anime-rn/base react-native-reanimated
```

## 使用方法

```tsx
import { Base } from '@anime-rn/base';

function App() {
  return (
    <Base
      title="点击我消失"
      onPress={() => console.log('按钮被点击了！')}
      duration={1000}
    />
  );
}
```

## Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| title | string | '点击我' | 按钮显示的文本 |
| onPress | () => void | - | 点击回调函数 |
| style | ViewStyle | - | 容器样式 |
| textStyle | TextStyle | - | 文本样式 |
| duration | number | 1000 | 消失动画持续时间（毫秒） |

## 特性

- 使用 react-native-reanimated 实现流畅的动画效果
- 支持自定义样式和文本
- 点击后自动消失，无需手动管理状态
- 支持自定义动画持续时间