// Monorepo-aware Metro yapılandırması (Expo).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Workspace kökünü izle (paylaşılan paketler için) + node_modules çözümlemesi.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// TEK React kaynağı: Monorepo'da kök (web için 19.2.x) ve mobil (RN için 19.1.x) iki ayrı
// React kopyası barındırıyor. Kökteki paketler (ör. expo-keep-awake) kök React'i, RN renderer
// ise mobil React'i çekince iki dispatcher oluşuyor → "Cannot read property 'useId' of null".
// React ailesini DAİMA mobilin kendi node_modules'ından çöz, böylece bundle'da tek React kalır.
// Not: scheduler mobilde yok (yalnız kökte, tek kopya) → onu zorlamak çözümü bozar; sadece react.
const mobileModules = path.resolve(projectRoot, "node_modules");
const forceLocal = (moduleName) =>
  moduleName === "react" || moduleName.startsWith("react/");

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest || context.resolveRequest;
  if (forceLocal(moduleName)) {
    return resolve(
      { ...context, nodeModulesPaths: [mobileModules], disableHierarchicalLookup: true },
      moduleName,
      platform
    );
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
