import { requireNativeComponent, ViewStyle } from "react-native";

const NativeCounterView = requireNativeComponent<{ style?: ViewStyle }>("NativeCounterView");

export default NativeCounterView;