import { NativeModule, requireOptionalNativeModule } from 'expo';

import { EmojiPickerOptions, ExpoNativeEmojiPickerModuleEvents } from './ExpoNativeEmojiPicker.types';

declare class ExpoNativeEmojiPickerModule extends NativeModule<ExpoNativeEmojiPickerModuleEvents> {
  /**
   * Opens the native iOS emoji keyboard. Single mode resolves with the picked
   * emoji (null if dismissed); with `multiple: true` it resolves with every
   * picked emoji once the keyboard is dismissed.
   */
  presentAsync(
    options: EmojiPickerOptions & { multiple?: boolean }
  ): Promise<string | string[] | null>;
}

// Null on platforms without the native implementation (Android); the public
// helpers degrade gracefully instead of throwing at import time.
export default requireOptionalNativeModule<ExpoNativeEmojiPickerModule>('ExpoNativeEmojiPicker');
