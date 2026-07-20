const {
  AndroidConfig,
  createRunOncePlugin,
  withGradleProperties,
} = require("expo/config-plugins");

const JVMARGS = "-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8";

/**
 * Avoid local release-build OOMs during Android lintVital (Metaspace) by
 * raising the Gradle JVM heap/metaspace and skipping release lint checks.
 */
function withAndroidReleaseBuildMemory(config) {
  return withGradleProperties(config, (config) => {
    config.modResults = AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      config.modResults,
      "org.gradle.jvmargs",
      JVMARGS,
    );
    config.modResults = AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      config.modResults,
      "android.lint.checkReleaseBuilds",
      "false",
    );
    return config;
  });
}

module.exports = createRunOncePlugin(
  withAndroidReleaseBuildMemory,
  "with-android-release-build-memory",
  "1.0.0",
);
