# สื่อสารด้วยกัน · Communicate Together

A React Native + Expo app for Thai picture-based communication, based on the article supplied by the user: [Develop application for autistic students](https://medium.com/@palmmanee28/develop-application-for-autistic-students-a53414c58bf1).

## Source behavior

1. Choose a subject, verb, object, and modifier in sequence.
2. Tap a card to hear it. Tap the same card again to confirm; there is no fast double-tap deadline.
3. Advance automatically. Tap a selected card at the top to remove it and dependent words.
4. Filter built-in choices by semantic tags: a building cannot eat; eating offers food objects.
5. Finish after subject + verb using the `—` action, or continue to object and modifier.
6. Play the completed sentence once. Replay it or start a new sentence.
7. Sort cards by local confirmation counts, retaining starter order for ties.
8. Add a card at the current stage with a camera/library image followed by recorded audio. No typing or adult-only gate is required.
9. Keep personal media, usage, and preferences on the device across restarts.
10. Choose one of three muted palettes and optionally disable automatic sentence playback.

The initial vocabulary contains 40 curated Thai entries, rather than a verified top-100 list. Bundled cards use emoji illustrations and device Thai text-to-speech; the article's photo/audio assets were not supplied. Custom cards use actual photos and recordings. Custom entries without semantic metadata remain compatible with any preceding word. Built-in filters are simple editorial rules. Questions and negatives are outside the article's initial scope.

## Install an Android APK

After publishing and a successful build:

1. Open the repository's **Releases** page on your Android phone or tablet.
2. Download `communicate-together-android.apk` from the latest preview release.
3. Open it and allow your browser/file manager to install apps when prompted.
4. Install and open **สื่อสารด้วยกัน**. Standalone APKs run without a development server.
5. Install a Thai TTS voice in Android settings for built-in words. Verify airplane-mode playback on the target device. Recorded custom words do not need a TTS voice.

No APK build or GitHub release has been completed in this workspace yet.

## Development setup

- Node.js 22.13+ on the 22 LTS line; this project targets Expo SDK 58.
- VS Code or another editor.
- A physical device or emulator. Match Expo Go to SDK 58, or use a development build.
- Android Studio/current SDK and a current JDK for local Android builds; follow [Expo environment guidance](https://docs.expo.dev/get-started/set-up-your-environment/) for compatible versions.
- Full Xcode and a simulator runtime for local iOS builds.

```sh
npm install
npx expo install --check
npm run check
npm start
```

Dependencies were installed from the user’s Terminal, and `package-lock.json` is now available. Use `npm ci` for repeatable builds.

```sh
# Local native builds, after installing the Android/iOS toolchain:
npm run android
npm run ios
```

## Build a directly installable APK

### GitHub Actions

`.github/workflows/android-apk.yml` checks source, generates Android files, and builds a standalone release-mode APK. Expo's generated project signs this testing APK using the template debug key. For production, use your private signing key or EAS-managed credentials.

- Run **Actions → Android preview APK → Run workflow** to download a build artifact.
- Push a version tag to build and attach the APK to a public GitHub prerelease.
- The workflow also uploads its generated dependency lockfile; validate and commit it.

```sh
git tag v0.1.0
git push origin v0.1.0
```

### EAS managed signing

An Expo account and initialized EAS project are required. Follow the interactive prompts locally; keep credentials out of source files.

```sh
npx eas-cli@latest login
npx eas-cli@latest init
npm run build:apk
```

The `preview` profile requests an APK with internal distribution. EAS returns a build/install link. The production profile produces an AAB for Google Play. See [Expo APK documentation](https://docs.expo.dev/build-reference/apk/).

## iOS Simulator build

This build targets the simulator first, as requested, and does not require paid Apple Developer membership. It cannot be installed on a physical iPhone.

- Cloud: initialize an EAS project, then run `npm run build:ios:simulator`. An Expo account is required.
- Local: install full Xcode and CocoaPods, install project dependencies, then run `npm run build:ios:local`.
- GitHub: run the **iOS Simulator app** workflow. It uses a macOS runner and uploads `communicate-together-ios-simulator.tar.gz`.

For a successful local or downloaded simulator build, extract the archive and install the `.app` on a booted compatible simulator:

```sh
xcrun simctl install booted /path/to/Application.app
xcrun simctl launch booted com.communicatetogether.app
```

The app archive has not been produced in this session: Xcode is missing and dependency downloads are blocked. The prepared build script validates prerequisites and stops with the exact missing requirement rather than claiming success.

## Publish to public GitHub

Supply the intended owner/repository and authenticate GitHub CLI. For a new repository, run from this directory:

```sh
gh auth login
git init -b main
git add .
git commit -m "Build Thai React Native communication app"
gh repo create OWNER/REPOSITORY --public --source=. --remote=origin --push
```

For an existing repository, inspect and integrate its history first. Do not force-push. Verify the remote commit and the resulting APK build independently.

## Verification

`npm test` runs 45 dependency-free tests for vocabulary, session behavior, playback sequencing/cancellation, storage, responsive sizing, and palette contrast. `npm run test:components` runs 17 prepared React Native component scenarios, including eight viewport configurations, after Jest dependencies are installed. `npm run check` requires full type checking and both test suites before native builds.

The latest complete check (25 October 2026) passed full TypeScript checking, all 45 unit tests and all 17 component scenarios. Android JavaScript bundle export also succeeded. Coverage is 100% lines and about 95% branches across the five pure modules measured; this excludes native adapters, React screens and component tests. Native APK builds and rendered emulator screen checks are still unverified. Read [UI verification scope](docs/UI_QA.md) and [verification record](docs/VERIFICATION.md).

Device checks before everyday use:

- Preview and confirm with two separate taps; selecting a different card resets confirmation.
- Correct stage transitions and downstream clearing when a selected card is removed.
- Two-word completion; summary plays once and replay works.
- Rapid replay, navigation, camera launch, and backgrounding cancel audio without loops.
- Camera/microphone permission denial is recoverable; canceling creation saves no card.
- Photo and recording survive restart and play in the correct sentence order.
- Frequency sorting survives restart; storage errors are visible.
- Tablet rotation, large fonts, screen readers, and long labels remain usable.
- Thai TTS and recordings work in airplane mode on the actual target device.

Domain tests do not verify native audio, camera, or accessibility. See [implementation status](IMPLEMENTATION_PLAN.md) and [agent workflow](docs/AGENT_WORKFLOW.md).

## Data

No backend, account, analytics, or upload function. Camera/microphone permissions are requested when needed. Uninstalling deletes local data. Export, cross-device backup, card deletion, and caregiver-defined semantic relationships are future work.
