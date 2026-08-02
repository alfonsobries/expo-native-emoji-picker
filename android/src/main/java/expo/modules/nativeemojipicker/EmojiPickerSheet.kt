package expo.modules.nativeemojipicker

import android.app.Activity
import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.widget.LinearLayout
import androidx.core.content.ContextCompat
import androidx.emoji2.emojipicker.EmojiPickerView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Android's emoji picker, presented the way the platform presents one: a
 * sheet from the bottom, roughly where the keyboard would be.
 *
 * The grid itself is `androidx.emoji2:emoji2-emojipicker` — Google's own
 * component, with categories, recents and skin-tone variants already
 * solved. Android has no API to summon the system emoji keyboard the way
 * iOS does, and this is the component the platform offers instead.
 */
internal class EmojiPickerSheet(
  private val activity: Activity,
  private val options: EmojiPickerPresentOptions,
  private val onPick: (String) -> Unit,
  private val onFinish: (List<String>) -> Unit
) : Dialog(activity) {

  private val picked = mutableListOf<String>()
  private var finished = false

  private val surfaceColor by lazy {
    parseColor(options.colors?.background) ?: themeColor(android.R.attr.colorBackground, Color.WHITE)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    requestWindowFeature(Window.FEATURE_NO_TITLE)
    setContentView(buildContent())
    setCanceledOnTouchOutside(options.dismissOnTapOutside)

    window?.apply {
      setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
      decorView.setPadding(0, 0, 0, 0)
      setLayout(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.WRAP_CONTENT
      )
      setGravity(Gravity.BOTTOM)
      setDimAmount((options.backdropOpacity ?: 0.15).toFloat().coerceIn(0f, 1f))
    }

    setOnCancelListener { finish() }
  }

  override fun onStop() {
    super.onStop()
    finish()
  }

  private fun buildContent(): View {
    val sheet = LinearLayout(activity).apply {
      orientation = LinearLayout.VERTICAL
      // Rounded top corners: a bottom sheet that meets the screen edge
      // square reads as a crash, not as a sheet.
      background = GradientDrawable().apply {
        setColor(surfaceColor)
        cornerRadii = floatArrayOf(
          dp(20).toFloat(), dp(20).toFloat(),
          dp(20).toFloat(), dp(20).toFloat(),
          0f, 0f, 0f, 0f
        )
      }
      ViewCompat.setOnApplyWindowInsetsListener(this) { view, insets ->
        val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
        view.setPadding(0, 0, 0, bars.bottom)
        insets
      }
    }

    sheet.addView(grabber(), LinearLayout.LayoutParams(dp(36), dp(4)).apply {
      gravity = Gravity.CENTER_HORIZONTAL
      topMargin = dp(10)
      bottomMargin = dp(6)
    })

    val grid = EmojiPickerView(activity).apply {
      emojiGridColumns = 9
      setOnEmojiPickedListener { item ->
        picked += item.emoji
        onPick(item.emoji)

        if (!options.multiple) {
          finish()
          dismiss()
        }
      }
    }
    sheet.addView(
      grid,
      LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(320))
    )

    return sheet
  }

  private fun grabber() = View(activity).apply {
    background = GradientDrawable().apply {
      setColor(themeColor(android.R.attr.textColorSecondary, Color.GRAY) and 0x55FFFFFF)
      cornerRadius = dp(2).toFloat()
    }
  }

  private fun finish() {
    if (finished) {
      return
    }
    finished = true
    onFinish(picked.toList())
  }

  private fun parseColor(value: String?): Int? {
    val hex = value?.trim()?.takeIf { it.isNotEmpty() } ?: return null

    return runCatching { Color.parseColor(hex) }.getOrNull()
  }

  private fun themeColor(attr: Int, fallback: Int): Int {
    val value = TypedValue()
    if (!activity.theme.resolveAttribute(attr, value, true)) {
      return fallback
    }
    return if (value.resourceId != 0) {
      ContextCompat.getColor(activity, value.resourceId)
    } else {
      value.data
    }
  }

  private fun dp(value: Int) =
    (value * activity.resources.displayMetrics.density).toInt()
}
