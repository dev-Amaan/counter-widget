## CounterWidget React Native App (Android Only)

This is a React Native project with a native Android Counter Widget.

---

## **Setup Instructions**

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo run:android
   ```

## Notes

The app includes a native Android CounterView module with a TextView and INCREASE and DECREASE Buttons.

The Decrease button disables automatically when the count is 0.

Counter value is saved between app launches using SharedPreferences.

The Increase and Decrease buttons with colors (blue and red) are React Native buttons that send commands to the native counter.

React Native buttons (Increase / Decrease) are synced with the native counter value even after restarting the app.

All unnecessary folders (node_modules, android/build, .expo, .cxx, etc.) have been removed for a clean project.