const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FULL_PACKAGE = 'com.dev_amaan.counterwidget.CustomPackage';
const SIMPLE_CLASS = 'CustomPackage';

function copyFolderRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    if (fs.lstatSync(s).isDirectory()) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      copyFolderRecursiveSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function findMainApplicationFiles(androidMain) {
  const out = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir)) {
      const full = path.join(dir, e);
      if (fs.lstatSync(full).isDirectory()) walk(full);
      else if (/MainApplication\.(kt|java)$/.test(e)) out.push(full);
    }
  }
  walk(path.join(androidMain, 'kotlin'));
  walk(path.join(androidMain, 'java'));
  return out;
}

function ensureImport(content, importLine, isKotlin) {
  if (content.includes(importLine)) return content;
  if (isKotlin) {
    const imports = content.match(/import\s+.*?\n/g);
    if (imports && imports.length) {
      const last = imports[imports.length - 1];
      return content.replace(last, `${last}${importLine}\n`);
    }
    return content.replace(/(package\s+[\s\S]*?\n)/, `$1\n${importLine}\n`);
  } else {
    const imports = content.match(/import\s+.*?;/g);
    if (imports && imports.length) {
      const last = imports[imports.length - 1];
      return content.replace(last, `${last}\n${importLine}`);
    }
    return content.replace(/(package\s+[\s\S]*?;)/, `$1\n\n${importLine}`);
  }
}

// === Kotlin patch helpers ===
function replaceExpressionApplyKotlin(content) {
  const regex =
    /(override\s+fun\s+getPackages\s*\(\s*\)\s*:\s*List<ReactPackage>\s*=\s*PackageList\s*\(\s*this\s*\)\.packages\.apply\s*\{\s*)([\s\S]*?)(\n\s*\})/m;
  if (!regex.test(content)) return null;

  return content.replace(regex, (match, before, inner, after) => {
    if (inner.includes(SIMPLE_CLASS) || inner.includes(FULL_PACKAGE)) return match;
    const insertion = `\n        if (none { it is ${FULL_PACKAGE} }) { add(${FULL_PACKAGE}()) }\n`;
    return `${before}${insertion}${inner}${after}`;
  });
}

function replaceWholeGetPackagesFunctionKotlin(content) {
  const startRegex = /override\s+fun\s+getPackages\s*\(\s*\)\s*:\s*List<ReactPackage>\s*(=|{)/m;
  if (!startRegex.test(content)) return null;

  const match = content.match(startRegex);
  const idx = match.index;
  const rest = content.slice(idx);
  const endCandidates = rest.search(/\n\s*override\s+(fun|val)\s+/);
  const endIdx = endCandidates === -1 ? content.length : idx + endCandidates;
  const before = content.slice(0, idx);
  const after = content.slice(endIdx);

  const impl = `override fun getPackages(): List<ReactPackage> {
        val packages = PackageList(this).packages.toMutableList()
        if (packages.none { it is ${FULL_PACKAGE} }) {
            packages.add(${FULL_PACKAGE}())
        }
        return packages
    }\n\n`;

  return before + impl + after;
}

function insertPackageGenericKotlin(content) {
  let updated = replaceExpressionApplyKotlin(content);
  if (updated) return updated;

  updated = replaceWholeGetPackagesFunctionKotlin(content);
  if (updated) return updated;

  if (content.includes('return packages')) {
    return content.replace(
      'return packages',
      `if (packages.none { it is ${FULL_PACKAGE} }) { packages.add(${FULL_PACKAGE}()) }\n        return packages`
    );
  }

  return content;
}

// === Java fallback ===
function insertPackageJava(content) {
  if (content.includes(FULL_PACKAGE) || content.includes(`new ${SIMPLE_CLASS}()`)) return content;
  if (content.includes('return packages;')) {
    return content.replace(
      'return packages;',
      `if (packages.stream().noneMatch(p -> p instanceof ${FULL_PACKAGE})) { packages.add(new ${FULL_PACKAGE}()); }\n        return packages;`
    );
  }
  return content;
}

function patchMainApplicationFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const isKotlin = filePath.endsWith('.kt');
  const isJava = filePath.endsWith('.java');
  const importLine = isKotlin ? `import ${FULL_PACKAGE}` : `import ${FULL_PACKAGE};`;

  // ensure import
  content = ensureImport(content, importLine, isKotlin);

  // patch
  let newContent = content;
  if (isKotlin) {
    newContent = insertPackageGenericKotlin(content);
  } else if (isJava) {
    newContent = insertPackageJava(content);
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ expo-native-counter-plugin: Patched ${filePath}`);
  } else {
    console.warn(`⚠️ expo-native-counter-plugin: No changes made to ${filePath}`);
  }
}

module.exports = function expoNativeCounterPlugin(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const androidMain = path.join(projectRoot, 'android', 'app', 'src', 'main');
      const templateSrc = path.join(__dirname, 'template', 'counterwidget', 'src', 'main');

      // copy native sources if present
      if (fs.existsSync(templateSrc)) {
        copyFolderRecursiveSync(templateSrc, androidMain);
        console.log('✅ Copied native CounterWidget sources.');
      }

      // find and patch MainApplication
      const files = findMainApplicationFiles(androidMain);
      if (files.length === 0) {
        console.warn('⚠️ No MainApplication.kt/java files found to patch.');
      } else {
        for (const f of files) {
          try {
            patchMainApplicationFile(f);
          } catch (e) {
            console.warn('⚠️ Failed to patch', f, e);
          }
        }
      }

      return cfg;
    },
  ]);
};