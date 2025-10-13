import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, UIManager, View, findNodeHandle } from 'react-native';
import NativeCounterView from '../components/NativeCounterView';

export default function App() {
  const counterRef = useRef<any>(null);
  const [count, setCount] = useState<number>(0);

  const sendCommand = useCallback((command: 'increase' | 'decrease') => {
    if (counterRef.current) {
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(counterRef.current),
        command,
        []
      );
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Native Android Counter */}
      <View style={styles.counterWrapper}>
        <NativeCounterView
          ref={counterRef}
          style={{ flex: 1 }}
          onCountChange={(event) => setCount(event.nativeEvent.count)}
        />
      </View>

      {/* Custom Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Increase Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: 'blue' }]}
          onPress={() => sendCommand('increase')}
        >
          <Text style={styles.buttonText}>Increase</Text>
        </TouchableOpacity>

        {/* Decrease Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: count === 0 ? 'lightgray' : 'red' }
          ]}
          onPress={() => sendCommand('decrease')}
          disabled={count === 0}
        >
          <Text style={styles.buttonText}>Decrease</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  counterWrapper: {
    width: 200,
    height: 150,
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});