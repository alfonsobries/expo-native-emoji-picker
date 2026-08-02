# expo-native-emoji-picker

[![npm version](https://img.shields.io/npm/v/expo-native-emoji-picker.svg)](https://www.npmjs.com/package/expo-native-emoji-picker)
[![CI](https://github.com/alfonsobries/expo-native-emoji-picker/actions/workflows/ci.yml/badge.svg)](https://github.com/alfonsobries/expo-native-emoji-picker/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/expo-native-emoji-picker.svg)](./LICENSE)

Native emoji picker for Expo and React Native, on **iOS and Android**. Opens the system's own emoji UI — Apple's emoji keyboard, Google's emoji grid — from any trigger, and resolves with the picked emoji.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/picker-dark.png">
    <img src="docs/picker-light.png" alt="The system emoji keyboard presented over an app, with a search bar, dismiss button, and the emoji grid" width="400">
  </picture>
</p>

- 🍎 **Apple's emoji keyboard on iOS** — the emoji-only panel Reminders uses, not a JS re-implementation. Search, skin tones, and new emoji land with each iOS release, for free.
- 🤖 **Google's emoji grid on Android** — `androidx.emoji2:emoji2-emojipicker`, the component the platform ships, in a bottom sheet where the keyboard would be. Categories, recents and skin-tone variants included.
- 🌎 **Localized by default** — both follow the device language automatically.
- 🎯 **Headless** — trigger it from any button, tile, or gesture; there's no UI to style.
- ⌨️ **Keyboard mode** — keep it open and stream picks live.
- 🪶 **No JavaScript dependencies.**

## Requirements

- iOS 16+ / Android 7+ (API 24)
- Expo SDK 52+ with a [development build](https://docs.expo.dev/develop/development-builds/introduction/) or a bare React Native app with Expo Modules — this package includes native code, so it does **not** run in Expo Go.

On web the helpers resolve `null` / `[]` so cross-platform code doesn't need guards.

## Platform differences

|            | iOS                                                                                                                 | Android                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| What opens | The system emoji keyboard                                                                                           | A bottom sheet with Google's emoji grid                                                           |
| `onDelete` | Fires on backspace                                                                                                  | Never — the grid has no backspace, and inventing one would be a control the platform doesn't have |
| `colors`   | Ignored: the picker _is_ the system keyboard, and repainting it is the one thing that would make it look non-native | `background` paints the sheet                                                                     |

## Installation

```sh
npx expo install expo-native-emoji-picker
```

Then rebuild your development build (`npx expo run:ios` or an EAS build). If you manage OTA updates with a fixed `runtimeVersion`, adding this package is a native change — bump it.

## Usage

### Pick a single emoji

```tsx
import { pickEmoji } from 'expo-native-emoji-picker';

const emoji = await pickEmoji();
if (emoji) {
  console.log(emoji); // "🦖" — null when dismissed without picking
}
```

### Keyboard mode — pick many in one session

The keyboard stays open: every tap streams through `onPick`, the keyboard's backspace fires `onDelete`, and dismissing it resolves with everything picked.

```tsx
import { pickEmojis } from 'expo-native-emoji-picker';

const all = await pickEmojis({
  cancelLabel: 'Done',
  onPick: (emoji) => addReaction(emoji),
  onDelete: () => removeLastReaction(),
});
```

### Options

Both functions accept the same presentation options:

```tsx
await pickEmoji({
  cancelLabel: 'Close', // custom dismiss label (default: system Cancel, auto-localized)
  showCancelButton: true, // hide the dismiss button entirely with false
  backdropOpacity: 0.15, // dim behind the keyboard, 0–1
  dismissOnTapOutside: true, // tap on the dim cancels
});
```

## API

### `pickEmoji(options?): Promise<string | null>`

Opens the emoji keyboard and resolves with the tapped emoji, or `null` when dismissed without picking (Cancel, tap outside, or swipe).

### `pickEmojis(options?): Promise<string[]>`

Opens the emoji keyboard in keyboard mode and resolves with every picked emoji once dismissed. Accepts two extra callbacks:

| Option     | Type                      | Description                                                |
| ---------- | ------------------------- | ---------------------------------------------------------- |
| `onPick`   | `(emoji: string) => void` | Fires live for each tap while the keyboard stays open.     |
| `onDelete` | `() => void`              | Fires when the keyboard's backspace removes the last pick. |

### `EmojiPickerOptions`

| Option                | Type      | Default            | Description                                                          |
| --------------------- | --------- | ------------------ | -------------------------------------------------------------------- |
| `cancelLabel`         | `string`  | system Cancel item | Dismiss button label. The default is localized by iOS automatically. |
| `showCancelButton`    | `boolean` | `true`             | Show the dismiss button above the keyboard.                          |
| `backdropOpacity`     | `number`  | `0.15`             | Opacity of the dim behind the keyboard, `0`–`1`.                     |
| `dismissOnTapOutside` | `boolean` | `true`             | Whether tapping the dim dismisses the picker.                        |

Skin tones (long-press) and ZWJ sequences (e.g. 👨‍👩‍👧‍👦) arrive as a single string.

## How it works

The module briefly attaches a hidden text field pinned to `UIKeyboardType(rawValue: 124)` — the undocumented emoji-only keyboard Apple uses in Reminders — and captures the input through the text field delegate. No text is ever inserted anywhere; the field exists only to summon the keyboard.

Because the keyboard type is undocumented, a future iOS release could change it; the field falls back to the default keyboard in that case rather than crashing.

## Example

The [`example`](./example) app demonstrates single pick, keyboard mode, and the presentation options:

```sh
cd example
npx expo run:ios
```

## Contributing

Issues and PRs are welcome. Commits follow [Conventional Commits](https://www.conventionalcommits.org) — releases and the changelog are generated from them.

```sh
npm install
npm run lint
npm test
npm run build
```

## License

[MIT](./LICENSE) © [Alfonso Bribiesca](https://alfonsobries.com)
