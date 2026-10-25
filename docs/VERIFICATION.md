# Verification record

## Latest verified checks · 25 October 2026

After the user installed project dependencies from macOS Terminal, the full app checks ran here successfully:

- `npm run check`: passed full TypeScript checking, all 45 Node unit tests, and all 17 React Native component scenarios (62 tests total).
- Component scenarios include eight viewport/font configurations, sentence flow, photo/record/save flow using mocked native services, permission errors, and preferences.
- Android Metro/Hermes export succeeded: 677 modules and an approximately 1.7 MB Android bundle. This is a JavaScript bundle, not an installable APK.
- The test configuration now explicitly loads Node/Jest types and avoids Watchman. Test queries match the installed testing library API; the recording test explicitly models an active app.
- `package-lock.json` now exists after the successful dependency installation.

Still unverified: native APK compilation, actual emulator installation and interactions, native audio/camera behavior, visual screenshots, and GitHub publishing. The user's Terminal can connect to `emulator-5554` on API 37; this session remains unable to start/connect ADB.

The user should rerun `bash scripts/android-local.sh` for the native build stage. Do not publish until actual simulation checks pass.

## Historical checks · 24 October 2026

## Passed

- 45 Node unit tests: 0 failures.
- Coverage across design.ts, domain.ts, playbackCore.ts, session.ts, and storageCore.ts: 100% lines, approximately 95% branches. Native adapters and React components are not included in these percentages.
- Strict standalone type checking of those five pure modules passed using TypeScript 6.
- Syntax transpilation of all 21 TypeScript/TSX source and test files: 0 diagnostics. This is not full app type checking.
- Palette contrast tests: every tested enabled text/background pair ≥4.5:1; tested card and selected borders ≥3:1.
- Responsive sizing tests: 288 combinations (16 widths × 6 text scales × 3 inset configurations).

## Prepared, not executed

- 17 Jest/React Native component scenarios for controls, four-stage flow, early completion, preference saving, corrupt storage, photo/record/save flow, denied permissions, and eight viewport/font configurations.
- Maestro screenshots of the four vocabulary stages, summary, preferences, and photo entry.
- Android standalone APK workflow and EAS preview profile.
- iOS Simulator workflow, unsigned local build script, and EAS simulator profile.

## Failed prerequisites/build attempts

- `npm install`: `ENOTFOUND registry.npmjs.org`. Dependencies and the lockfile could not be installed/generated.
- `npm run typecheck`: failed because Expo, React Native, Jest types and the Expo base tsconfig are not installed. Full app type correctness is unverified.
- `npm run test:components`: `jest: command not found`.
- `npm run android`: `expo: command not found`.
- `python3 scripts/build_ios_simulator.py`: Xcode command-line tools are selected, but full Xcode is not installed. The script exited without a build.
- The local Android environment has Java 8 and SDK platforms 30/31, requiring updates for this project's toolchain.
- Publishing checks: Git metadata creation denied and GitHub CLI credentials invalid. The user subsequently confirmed the public destination `vachnet/autistic-communication-app`, with publication only after real simulation passes.
- Latest simulation preflight: Android virtual-device listing returned no devices, and ADB failed to start its socket listener (`Operation not permitted`). npm registry resolution and Xcode checks still fail. No native app was launched.

No Android APK, iOS simulator app, native screenshot set, GitHub push or successful CI run exists from this session. The user authorized downloads, but that authorization does not change this session's enforced network and filesystem access.

See [UI matrix and sensory design rationale](UI_QA.md). Full layout validation requires rendered inspection and target-user feedback; unit tests cannot certify every screen size or a universal color preference.

References: [Expo SDK 58 versions](https://raw.githubusercontent.com/expo/expo/sdk-58/packages/expo/bundledNativeModules.json), [Expo unit testing](https://docs.expo.dev/develop/unit-testing/), [Android APK builds](https://docs.expo.dev/build-reference/apk/), [iOS simulator builds](https://docs.expo.dev/build-reference/simulators/).
