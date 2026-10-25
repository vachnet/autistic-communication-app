# Implementation status

The user supplied the article text on 24 October 2026. Requirements now follow that text.

## Requirements and source implementation

- Four stages: subject → verb → object → modifier.
- First tap previews sound; a second tap on the same card confirms.
- Automatic advancement and top-strip removal of selected/dependent words.
- Built-in semantic filtering and per-device frequency sorting.
- Completion after subject + verb or after later stages via a stop action.
- Summary speaks once, with replay and restart.
- Personal cards use a photo followed by recorded audio without typing or an adult-only gate.
- Local persistent custom media and usage.

## Completed source work

1. Expo SDK 58 + TypeScript configuration and native permissions.
2. Pure sentence engine, 40 curated Thai words, and 45 executable tests across domain, session, audio control, storage, and design.
3. Phone/tablet scrolling layout with font-aware columns, selection flow, sentence strip, summary, and three saved color palettes.
4. Cancellable sequential playback for Thai TTS and recordings.
5. Camera/library → recording → save flow, 30-second recording limit, and permission/error messages.
6. Ordered local persistence, relative media filenames, and protection against overwriting unreadable saved data.
7. EAS APK and iOS simulator profiles, both GitHub build workflows, a local iOS simulator script, release notes, and installation instructions.
8. One bounded sub-agent implementation task plus a focused review by the same agent. Review fixes cover recording lifecycle and media portability.

## Verification and delivery remaining

- Latest checks on 25 October 2026: full TypeScript checking, all 45 pure-module tests, and all 17 component scenarios passed. Android Metro/Hermes bundle export also succeeded. Native APK and emulator interactions remain unverified.
- Text contrast and 288 responsive-sizing combinations passed arithmetic checks. Native screenshots and every-screen validation remain pending; see docs/UI_QA.md.
- iOS target confirmed by user: simulator first, without paid Apple Developer membership.
- The user installed dependencies successfully from Terminal; package-lock.json is present. Agent-side network access and ADB remain restricted.
- Git metadata creation was denied by the session workspace restrictions.
- User confirmed the public destination: `vachnet/autistic-communication-app`. Publish only after real simulation checks pass. GitHub CLI currently reports invalid credentials; GitHub integration was suggested but connection is unconfirmed.
- Local Java 8 and Android SDK 30/31 require updates for the current toolchain. GitHub Actions and EAS configurations provide alternative build paths.
- Android build attempt failed because Expo is unavailable; iOS build attempt failed because full Xcode is missing. No APK, iOS simulator app, GitHub push, or release upload has been verified.
- Latest simulation preflight: no Android virtual devices were listed; ADB could not start its socket listener (`Operation not permitted`). npm still reports DNS resolution failure. Full Xcode remains unavailable.

## Initial limits

Starter illustrations are emoji and built-in audio uses Thai device TTS; original article photo/audio assets were not supplied. The 40-word vocabulary is curated, not a verified top-100 frequency list. Custom cards are permissive until semantic mapping is added. Device testing and feedback from intended users remain necessary.
