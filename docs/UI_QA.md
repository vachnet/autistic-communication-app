# Screen layout and sensory design checks

## Verified without native dependencies

- Layout calculations fit 16 logical widths from 280 to 1366 points/dp, six font scales from 1× to 3×, and three safe-area inset configurations: 288 combinations.
- Columns reduce as text grows; content width is capped on wide tablets.
- Every enabled palette text/background pairing in the contrast test meets 4.5:1. Card boundaries and selection boundaries meet 3:1 against their tested surfaces.
- Layout decisions use the actual safe-area content width rather than raw screen width.

These are arithmetic and source checks, not screenshots. They cannot prove that all native screens render correctly.

## Source changes for usability

- The full main page scrolls. Fixed headers no longer consume the available viewport in landscape or with large fonts.
- Text has no fixed line count and buttons grow with content. Primary actions are at least 60 dp high; settings and cards exceed 48 dp.
- Green, warm cream, and blue-gray palettes use muted surfaces with contrasting text. Color choice persists locally.
- Selection includes a check mark, text hint, and border. Color is not the sole cue.
- No flashing, looping decoration, or modal transition animation. Sentence autoplay can be disabled. Playback can be stopped.
- Personal cards have numbered screen-reader labels in addition to their recorded audio. These are fallback labels, not descriptions of the photos; meaningful photo descriptions remain a limitation.

No single palette can be certified as suitable for every autistic child. Choose with the child and caregiver and observe comfort. The implementation follows [W3C distinguishability principles](https://www.w3.org/WAI/fundamentals/accessibility-principles/), [cognitive focus guidance](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o5-user-focus/), and [National Autistic Society guidance on individual sensory differences](https://www.autism.org.uk/advice-and-guidance/about-autism/sensory-processing).

## Rendered verification still required

| Viewport in logical points/dp | Font scales | Platforms | Status |
| --- | --- | --- | --- |
| 320×568 and 568×320 | 1×, 2× | iOS simulator, Android emulator | Pending |
| 360×640 and 640×360 | 1×, 2× | Android emulator | Pending |
| 390×844 and 844×390 | 1×, 2× | iOS simulator, Android emulator | Pending |
| 768×1024 and 1024×768 | 1×, 2× | iPad simulator, Android tablet emulator | Pending |
| 1024×1366 and 1366×1024 | 1×, 2× | iPad simulator | Pending |
| 280-wide split view | 1×, 3× | Supported tablet split view | Pending |

For each row, inspect subject, verb, object, modifier, summary, preferences, photo entry, recording, recorded preview, and error/permission states. Confirm all controls are reachable by scrolling, no text or photos overlap, selected cards can scroll horizontally, and system bars do not cover controls.

Component tests now pass for the main flow at eight viewport/font combinations (verified 25 October 2026). All 17 component scenarios pass. They use mocked native services and do not replace native screenshot inspection.

## Native screenshot flow

After installing Maestro and the built app on a simulator/emulator, run:

```sh
maestro test .maestro/communication.yaml
```

The flow captures the four vocabulary stages, summary, preferences and photo entry. Run it for each matrix configuration and inspect the images; successful tapping alone does not validate visual quality. Camera, recording, denied permissions, large-text overflow, and actual image scaling require additional device checks. The flow clears this app's local test data and has not been executed in this session.
