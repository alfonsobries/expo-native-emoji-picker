import { EmojiPickerOptions, PickEmojisOptions } from './ExpoNativeEmojiPicker.types';
import ExpoNativeEmojiPickerModule from './ExpoNativeEmojiPickerModule';

export type {
  EmojiPickerColors,
  EmojiPickerOptions,
  PickEmojisOptions,
} from './ExpoNativeEmojiPicker.types';

/**
 * Opens the native iOS emoji keyboard (the emoji-only panel Reminders uses)
 * and resolves with the picked emoji, or null when dismissed without picking.
 * Trigger it from any UI — the picker itself is headless. Resolves null on
 * platforms without the native implementation.
 */
export async function pickEmoji(options: EmojiPickerOptions = {}): Promise<string | null> {
  if (!ExpoNativeEmojiPickerModule) {
    return null;
  }
  const result = await ExpoNativeEmojiPickerModule.presentAsync(options);
  return typeof result === 'string' ? result : null;
}

/**
 * Keyboard-like multi pick: stays open streaming every tap through `onPick`
 * (backspace triggers `onDelete`), then resolves with all picked emoji once
 * the keyboard is dismissed. Resolves empty on platforms without the native
 * implementation.
 */
export async function pickEmojis(options: PickEmojisOptions = {}): Promise<string[]> {
  const { onPick, onDelete, ...rest } = options;
  if (!ExpoNativeEmojiPickerModule) {
    return [];
  }

  const pickSubscription = onPick
    ? ExpoNativeEmojiPickerModule.addListener('onPick', (event) => onPick(event.emoji))
    : null;
  const deleteSubscription = onDelete
    ? ExpoNativeEmojiPickerModule.addListener('onDelete', onDelete)
    : null;

  try {
    const result = await ExpoNativeEmojiPickerModule.presentAsync({ ...rest, multiple: true });
    return Array.isArray(result) ? result : [];
  } finally {
    pickSubscription?.remove();
    deleteSubscription?.remove();
  }
}
