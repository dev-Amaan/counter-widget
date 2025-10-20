import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, NativeModules, StyleSheet, Text, TouchableOpacity, UIManager, View, findNodeHandle } from 'react-native';
import NativeCounterView from '../components/NativeCounterView';

const { CounterModule } = NativeModules;

export default function App() {
  const [count, setCount] = useState<number>(0);
  const counterRef = useRef<any>(null);
  const lastSyncedCountRef = useRef(count);

  const sendCommand = useCallback((command: 'increase' | 'decrease') => {
    if (!counterRef.current) return;

    const viewId = findNodeHandle(counterRef.current);
    if (!viewId) return;

    const commandId =
      command === 'increase'
        ? UIManager.getViewManagerConfig('NativeCounterView').Commands.increase
        : UIManager.getViewManagerConfig('NativeCounterView').Commands.decrease;

    UIManager.dispatchViewManagerCommand(viewId, commandId, []);
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await CounterModule.getSharedCount();
      setCount(saved);
      lastSyncedCountRef.current = saved;
    })();
  }, []);

  const handleCountChange = useCallback(async (event: any) => {
    const newCount = event.nativeEvent.saved_count;
    setCount(newCount);
    lastSyncedCountRef.current = newCount;
    await CounterModule.setSharedCount(newCount);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      const latestCount = await CounterModule.getSharedCount();
      const diff = latestCount - lastSyncedCountRef.current;
      if (diff === 0) return;

      for (let i = 0; i < Math.abs(diff); i++) {
        if (diff > 0) sendCommand('increase');
        else sendCommand('decrease');
      }
      setCount(latestCount);
      lastSyncedCountRef.current = latestCount;
    });

    return () => subscription.remove();
  }, []);


  return (
    <View style={styles.container}>
      {/* Native Android Counter */}
      <View style={styles.counterWrapper}>
        <NativeCounterView
          ref={counterRef}
          style={{ flex: 1 }}
          onCountChange={handleCountChange}
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