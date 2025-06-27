import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
export interface BaseProps {
    title?: string;
    onPress?: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    duration?: number;
}
declare const Base: ({ title, onPress, style, textStyle, duration, }: BaseProps) => React.JSX.Element | null;
export default Base;
//# sourceMappingURL=Base.d.ts.map