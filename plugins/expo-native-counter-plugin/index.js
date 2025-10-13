const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(source)) return;
  const files = fs.readdirSync(source);
  for (const file of files) {
    const src = path.join(source, file);
    const dest = path.join(target, file);
    if (fs.lstatSync(src).isDirectory()) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      copyFolderRecursiveSync(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function findMainApplicationFiles(androidAppMain) {
  const candidates = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.lstatSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (/MainApplication\.(kt|java)$/.test(entry)) {
        candidates.push(full);
      }
    }
  }
  walk(path.join(androidAppMain, 'kotlin'));
  walk(path.join(androidAppMain, 'java'));
  return candidates;
}

function patchMainApplicationFile(mainAppPath) {
  let content = fs.readFileSync(mainAppPath, 'utf8');

  // Adjust these to match your package/class
  const fullPackageImport = 'com.dev_amaan.CounterWidget.CustomPackage';
  const importLineJava = `import ${fullPackageImport};`;
  const importLineKotlin = `import ${fullPackageImport}`;

  const isJava = mainAppPath.endsWith('.java');
  const isKotlin = mainAppPath.endsWith('.kt');

  // Insert import if missing
  if (isJava) {
    if (!content.includes(importLineJava)) {
      const importMatches = content.match(/import\s+.*?;/g);
      if (importMatches && importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        content = content.replace(lastImport, `${lastImport}\n${importLineJava}`);
      } else {
        content = content.replace(/(package\s+[\s\S]*?;)/, `$1\n\n${importLineJava}`);
      }
    }
  } else if (isKotlin) {
    if (!content.includes(importLineKotlin)) {
      const importMatches = content.match(/import\s+.*?\n/g);
      if (importMatches && importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        content = content.replace(lastImport, `${lastImport}${importLineKotlin}\n`);
      } else {
        content = content.replace(/(package\s+[\s\S]*?\n)/, `$1\n${importLineKotlin}\n`);
      }
    }
  }

  // Insert package addition idempotently
  if (isJava) {
    if (!/new\s+CustomPackage\(\)/.test(content)) {
      // Try to insert after packages list creation (common patterns)
      if (/List<ReactPackage>\s+packages\s*=\s*new\s+ArrayList/.test(content)) {
        content = content.replace(/(List<ReactPackage>\s+packages\s*=\s*new\s+ArrayList<.*?>\s*\(\s*\)\s*;)/, `$1\n    packages.add(new CustomPackage());`);
      } else {
        // Try to add before return packages;
        if (content.includes('return packages;')) {
          content = content.replace('return packages;', 'packages.add(new CustomPackage());\n    return packages;');
        } else {
          // fallback: append inside getPackages method body (naive)
          content = content.replace(/(public\s+List<ReactPackage>\s+getPackages\(\)\s*\{\s*)/, `$1\n    packages.add(new CustomPackage());\n`);
        }
      }
    }
  } else if (isKotlin) {
    if (!/CustomPackage\(\)/.test(content)) {
      // common RN Kotlin pattern: val packages = PackageList(this).packages.toMutableList()
      if (/val\s+packages\s*=\s*PackageList\(this\)\.packages\.toMutableList\(\)/.test(content)) {
        content = content.replace(/(val\s+packages\s*=\s*PackageList\(this\)\.packages\.toMutableList\(\))/,
          `$1\n        if (packages.none { it is com.dev_amaan.CounterWidget.CustomPackage }) { packages.add(CustomPackage()) }`);
      } else if (content.includes('return packages')) {
        content = content.replace('return packages', 'if (packages.none { it is com.dev_amaan.CounterWidget.CustomPackage }) { packages.add(CustomPackage()) }\n        return packages');
      } else {
        // fallback: try to insert before end of getPackages method (naive)
        content = content.replace(/(override fun getPackages\(\): MutableList<ReactPackage> \{\s*)/, `$1\n        if (packages.none { it is com.dev_amaan.CounterWidget.CustomPackage }) { packages.add(CustomPackage()) }\n`);
      }
    }
  }

  fs.writeFileSync(mainAppPath, content, 'utf8');
  console.log(`expo-native-counter-plugin: patched MainApplication at ${mainAppPath}`);
}

module.exports = function expoNativeCounterPlugin(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const templateDir = path.join(__dirname, 'template', 'counterwidget');
      const androidAppMain = path.join(projectRoot, 'android', 'app', 'src', 'main');

      // Copy Kotlin files into the generated android project
      const srcMain = path.join(templateDir, 'src', 'main');
      if (fs.existsSync(srcMain)) {
        copyFolderRecursiveSync(srcMain, androidAppMain);
        console.log('✅ Copied CounterWidget native files into android/app/src/main/');
      } else {
        console.warn('⚠️ No Kotlin sources found in', srcMain);
      }

      // Try to find and patch MainApplication (Kotlin or Java)
      try {
        const candidates = findMainApplicationFiles(androidAppMain);
        if (candidates.length === 0) {
          console.warn('expo-native-counter-plugin: No MainApplication file found to patch.');
        } else {
          // patch the first candidate (typical case)
          patchMainApplicationFile(candidates[0]);
        }
      } catch (e) {
        console.warn('expo-native-counter-plugin: Error while patching MainApplication:', e);
      }

      return cfg;
    },
  ]);
};
