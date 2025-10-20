const {
  withDangerousMod,
  withAndroidManifest,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// --- Utility to recursively copy files/folders ---
async function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  await fs.promises.mkdir(dest, { recursive: true });

  const files = await fs.promises.readdir(src);
  for (const file of files) {
    const s = path.join(src, file);
    const d = path.join(dest, file);
    const stat = await fs.promises.lstat(s);

    if (stat.isDirectory()) {
      await copyRecursive(s, d);
    } else {
      await fs.promises.copyFile(s, d);
    }
  }
}

// --- Add <receiver> for widget in AndroidManifest ---
function addWidgetReceiver(androidManifest) {
  const app = androidManifest.manifest.application[0];

  // Prevent duplicate receiver entries
  const alreadyExists = app.receiver?.some((r) =>
    r['$']?.['android:name']?.includes('HomeScreenWidget')
  );

  if (!alreadyExists) {
    const receiver = {
      $: {
        'android:name': '.HomeScreenWidget', // ✅ matches your Kotlin file path
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
              },
            },
          ],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/widget_info',
          },
        },
      ],
    };

    if (!app.receiver) app.receiver = [];
    app.receiver.push(receiver);
  }

  return androidManifest;
}

// --- Main plugin function ---
const withCounterWidget = (config) => {
  // 1️⃣ Copy widget files from template to android/app/src/main
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;

      const srcPath = path.join(
        projectRoot,
        'plugins/expo-native-counter-plugin/template/counterwidget/src/main'
      );
      const destPath = path.join(projectRoot, 'android/app/src/main');

      await copyRecursive(srcPath, destPath);
      console.log('✅ Copied CounterWidget files to android/app/src/main');

      return config;
    },
  ]);

  // 2️⃣ Add widget receiver to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    config.modResults = addWidgetReceiver(config.modResults);
    return config;
  });

  return config;
};

module.exports = withCounterWidget;
