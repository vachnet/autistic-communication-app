#!/bin/bash
# Run in macOS Terminal when this agent's sandbox cannot access ADB/network.
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"
mkdir -p deliverables
log_path="$project_dir/deliverables/android-local.log"
exec > >(tee "$log_path") 2>&1
trap 'printf "\nStopped at line %s. Share this log with Codex: %s\n" "$LINENO" "$log_path"' ERR

studio_java="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
if [ ! -x "$studio_java/bin/java" ]; then
  printf 'Android Studio bundled Java was not found at %s\n' "$studio_java"
  exit 1
fi
export JAVA_HOME="$studio_java"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

printf 'Using project: %s\n' "$project_dir"
node --version
java -version
adb start-server
adb devices -l
device_serial="$(adb devices | awk '$1 ~ /^emulator-/ && $2 == "device" { print $1; exit }')"
if [ -z "$device_serial" ]; then
  printf 'No running Android emulator is ready. Start the AVD and wait for its home screen, then rerun.\n'
  exit 1
fi
export ANDROID_SERIAL="$device_serial"
printf 'Using emulator: %s\n' "$device_serial"
adb -s "$device_serial" shell getprop ro.build.version.sdk

# The emulator API level and the project's compile SDK are separate.
if [ ! -d "$ANDROID_HOME/platforms/android-36" ]; then
  sdkmanager_path="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
  if [ ! -x "$sdkmanager_path" ]; then
    printf 'Install Android SDK Platform 36 in Android Studio SDK Manager, then rerun. API 37 on the emulator can stay.\n'
    exit 1
  fi
  "$sdkmanager_path" --install 'platforms;android-36'
fi

npm install --cache .npm-cache
npx expo install --check
npm run check

# A release-mode APK embeds JavaScript and runs without a Metro server.
npx expo run:android --variant release --device "$device_serial"
apk_path="$project_dir/android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$apk_path" ]; then
  printf 'Expected APK was not found at %s\n' "$apk_path"
  exit 1
fi
cp "$apk_path" "$project_dir/deliverables/communicate-together-android.apk"
adb -s "$device_serial" shell am start -W -n com.communicatetogether.app/.MainActivity
printf '\nBuild and launch commands completed. APK: %s\n' "$project_dir/deliverables/communicate-together-android.apk"
printf 'Log: %s\n' "$log_path"
printf 'Native interaction and screenshot verification are still required.\n'
