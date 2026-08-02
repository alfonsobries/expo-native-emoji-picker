package expo.modules.nativeemojipicker

import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class EmojiPickerPresentOptions : Record {
  /** Stay open and stream every tap, instead of resolving on the first one. */
  @Field
  var multiple: Boolean = false

  @Field
  var cancelLabel: String? = null

  @Field
  var showCancelButton: Boolean = true

  @Field
  var backdropOpacity: Double? = null

  @Field
  var dismissOnTapOutside: Boolean = true

  @Field
  var colors: EmojiPickerColors? = null
}

/** Hex colors from the caller's design system; null means "use the theme". */
class EmojiPickerColors : Record {
  @Field
  var background: String? = null

  @Field
  var label: String? = null

  @Field
  var accent: String? = null
}

class ExpoNativeEmojiPickerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoNativeEmojiPicker")

    Events("onPick", "onDelete")

    AsyncFunction("presentAsync") { options: EmojiPickerPresentOptions, promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
        ?: throw Exceptions.MissingActivity()

      activity.runOnUiThread {
        EmojiPickerSheet(
          activity = activity,
          options = options,
          onPick = { emoji -> sendEvent("onPick", mapOf("emoji" to emoji)) },
          onFinish = { picked ->
            if (options.multiple) {
              promise.resolve(picked)
            } else {
              promise.resolve(picked.firstOrNull())
            }
          }
        ).show()
      }
    }
  }
}
