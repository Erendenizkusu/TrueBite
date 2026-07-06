const { withProjectBuildGradle } = require("expo/config-plugins");

// play-services-ads 25.4.0 (AdMob) Kotlin 2.3.0 metadata ile derlenmis; Expo SDK 54'un
// Kotlin 2.1.0 derleyicisi bunu okurken "incompatible metadata version" (sert hata) veriyor.
// Metadata FORMATI uyumlu, sadece surum etiketi ileri -> tum Kotlin derleme gorevlerinde
// surum kontrolunu atlayarak (-Xskip-metadata-version-check) build'i geciririz.
const SNIPPET = `
// Volicious: AdMob (play-services-ads 25.4.0) Kotlin 2.3.0 metadata -> surum kontrolunu atla.
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            freeCompilerArgs += ["-Xskip-metadata-version-check"]
        }
    }
}
`;

module.exports = function withKotlinMetadataSkip(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error("withKotlinMetadataSkip: yalnizca groovy android/build.gradle destekleniyor");
    }
    if (!cfg.modResults.contents.includes("Xskip-metadata-version-check")) {
      cfg.modResults.contents += SNIPPET;
    }
    return cfg;
  });
};
