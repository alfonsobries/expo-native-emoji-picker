import ExpoModulesCore
import UIKit

struct PresentOptions: Record {
  // When nil the system Cancel item is used, which iOS localizes automatically.
  @Field var cancelLabel: String?
  @Field var showCancelButton: Bool = true
  @Field var backdropOpacity: Double = 0.15
  @Field var dismissOnTapOutside: Bool = true
  // Keyboard-like mode: stays open emitting onPick/onDelete events per tap,
  // and resolves with every picked emoji once dismissed.
  @Field var multiple: Bool = false
}

public class ExpoNativeEmojiPickerModule: Module {
  private var picker: EmojiKeyboardPicker?

  public func definition() -> ModuleDefinition {
    Name("ExpoNativeEmojiPicker")

    Events("onPick", "onDelete")

    AsyncFunction("presentAsync") { (options: PresentOptions, promise: Promise) in
      // Cancel any in-flight picker before starting a new one.
      self.picker?.cancel()

      let picker = EmojiKeyboardPicker(options: options) { [weak self] result in
        self?.picker = nil
        promise.resolve(result)
      }
      picker.onPick = { [weak self] emoji in
        self?.sendEvent("onPick", ["emoji": emoji])
      }
      picker.onDelete = { [weak self] in
        self?.sendEvent("onDelete")
      }
      self.picker = picker
      picker.present()
    }
    .runOnQueue(.main)
  }
}

/// Presents the system emoji keyboard from a hidden text field. Single mode
/// resolves with the tapped emoji (nil when dismissed without picking); in
/// multiple mode the keyboard stays open, streams picks, and resolves with
/// every picked emoji on dismissal.
final class EmojiKeyboardPicker: NSObject, UITextFieldDelegate {
  var onPick: ((String) -> Void)?
  var onDelete: (() -> Void)?

  private let options: PresentOptions
  private let onFinish: (Any?) -> Void
  private var field: EmojiOnlyTextField?
  private var overlay: UIView?
  private var picked: [String] = []
  private var finished = false

  init(options: PresentOptions, onFinish: @escaping (Any?) -> Void) {
    self.options = options
    self.onFinish = onFinish
    super.init()
  }

  func present() {
    guard let window = Self.keyWindow() else {
      finishDismissed()
      return
    }

    // Dim the app and catch taps outside the keyboard to cancel.
    let overlay = UIView(frame: window.bounds)
    overlay.backgroundColor = UIColor.black.withAlphaComponent(
      CGFloat(max(0, min(1, options.backdropOpacity)))
    )
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    if options.dismissOnTapOutside {
      overlay.addGestureRecognizer(
        UITapGestureRecognizer(target: self, action: #selector(handleCancel))
      )
    }
    window.addSubview(overlay)
    self.overlay = overlay

    let field = EmojiOnlyTextField(frame: .zero)
    field.delegate = self
    field.autocorrectionType = .no
    field.spellCheckingType = .no
    if options.showCancelButton {
      field.inputAccessoryView = makeAccessoryView(width: window.bounds.width)
    }
    window.addSubview(field)
    self.field = field

    // A dismissal we didn't trigger (swipe, system) resolves as a cancel.
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleKeyboardWillHide),
      name: UIResponder.keyboardWillHideNotification,
      object: nil
    )

    if !field.becomeFirstResponder() {
      finishDismissed()
    }
  }

  func cancel() {
    finishDismissed()
  }

  // The keyboard delivers input through the delegate, not `insertText`, so this
  // is the reliable capture point. An empty string is a backspace.
  func textField(
    _ textField: UITextField,
    shouldChangeCharactersIn range: NSRange,
    replacementString string: String
  ) -> Bool {
    if string.isEmpty {
      if options.multiple, !picked.isEmpty {
        picked.removeLast()
        onDelete?()
      }
      return false
    }
    if options.multiple {
      picked.append(string)
      onPick?(string)
    } else {
      finish(string)
    }
    return false
  }

  @objc private func handleCancel() {
    finishDismissed()
  }

  @objc private func handleKeyboardWillHide() {
    finishDismissed()
  }

  // Dismissal resolves with the accumulated picks in multiple mode, nil in single.
  private func finishDismissed() {
    finish(options.multiple ? picked : nil)
  }

  private func finish(_ result: Any?) {
    if finished { return }
    finished = true
    NotificationCenter.default.removeObserver(self)
    field?.resignFirstResponder()
    field?.removeFromSuperview()
    field = nil
    overlay?.removeFromSuperview()
    overlay = nil
    onFinish(result)
  }

  // A UIToolbar accessory ignores fixed-space margins on modern iOS, so the
  // dismiss button lives in a custom pass-through view with real constraints.
  private func makeAccessoryView(width: CGFloat) -> UIView {
    let container = PassThroughAccessoryView(frame: CGRect(x: 0, y: 0, width: width, height: 60))
    container.backgroundColor = .clear

    var config = UIButton.Configuration.gray()
    config.cornerStyle = .capsule
    if let label = options.cancelLabel {
      config.title = label
      config.contentInsets = NSDirectionalEdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 16)
    } else {
      config.image = UIImage(
        systemName: "xmark",
        withConfiguration: UIImage.SymbolConfiguration(pointSize: 14, weight: .semibold)
      )
      config.contentInsets = NSDirectionalEdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12)
    }

    let button = UIButton(configuration: config)
    button.addTarget(self, action: #selector(handleCancel), for: .touchUpInside)
    button.translatesAutoresizingMaskIntoConstraints = false
    container.addSubview(button)
    NSLayoutConstraint.activate([
      button.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -16),
      button.centerYAnchor.constraint(equalTo: container.centerYAnchor),
    ])
    return container
  }

  static func keyWindow() -> UIWindow? {
    return UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
  }
}

/// Accessory strip that only intercepts touches on its subviews (the dismiss
/// button); taps on the empty area fall through to the backdrop underneath.
final class PassThroughAccessoryView: UIView {
  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let view = super.hitTest(point, with: event)
    return view === self ? nil : view
  }
}

/// Text field pinned to the undocumented emoji-only keyboard (type 124) that
/// Apple's Reminders uses — the emoji panel with no globe or dictation keys.
final class EmojiOnlyTextField: UITextField {
  override var keyboardType: UIKeyboardType {
    get { UIKeyboardType(rawValue: 124) ?? .default }
    set {}
  }
}
