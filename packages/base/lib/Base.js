"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_reanimated_1 = __importStar(require("react-native-reanimated"));
const Base = ({ title = '点击我', onPress, style, textStyle, duration = 1000, }) => {
    const [isVisible, setIsVisible] = (0, react_1.useState)(true);
    const opacity = (0, react_native_reanimated_1.useSharedValue)(1);
    const scale = (0, react_native_reanimated_1.useSharedValue)(1);
    const handlePress = () => {
        // 触发点击回调
        onPress?.();
        // 开始消失动画
        opacity.value = (0, react_native_reanimated_1.withTiming)(0, { duration }, () => {
            (0, react_native_reanimated_1.runOnJS)(setIsVisible)(false);
        });
        scale.value = (0, react_native_reanimated_1.withTiming)(0.8, { duration });
    };
    const animatedStyle = (0, react_native_reanimated_1.useAnimatedStyle)(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
        };
    });
    if (!isVisible) {
        return null;
    }
    return (<react_native_reanimated_1.default.View style={[styles.container, style, animatedStyle]}>
      <react_native_1.TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.8}>
        <react_native_1.Text style={[styles.text, textStyle]}>{title}12 2热更新测试</react_native_1.Text>
      </react_native_1.TouchableOpacity>
    </react_native_reanimated_1.default.View>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
exports.default = Base;
//# sourceMappingURL=Base.js.map