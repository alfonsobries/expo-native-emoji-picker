import { registerWebModule, NativeModule } from 'expo';

import { EmojiPickerOptions, ExpoNativeEmojiPickerModuleEvents } from './ExpoNativeEmojiPicker.types';

// The native emoji keyboard is iOS-only; on web the picker resolves empty.
class ExpoNativeEmojiPickerModule extends NativeModule<ExpoNativeEmojiPickerModuleEvents> {
  async presentAsync(
    options: EmojiPickerOptions & { multiple?: boolean }
  ): Promise<string | string[] | null> {
    return options.multiple ? [] : null;
  }
}

export default registerWebModule(ExpoNativeEmojiPickerModule, 'ExpoNativeEmojiPickerModule');
