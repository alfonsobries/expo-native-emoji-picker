Pod::Spec.new do |s|
  s.name           = 'ExpoNativeEmojiPicker'
  s.version        = '1.0.0'
  s.summary        = 'Native iOS emoji picker that opens the system emoji keyboard'
  s.description    = 'Opens the system emoji-only keyboard (the one Reminders uses) from any trigger and resolves with the picked emoji. Single and keyboard-like multiple modes.'
  s.author         = 'Alfonso Bribiesca'
  s.homepage       = 'https://github.com/alfonsobries/expo-native-emoji-picker'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: 'https://github.com/alfonsobries/expo-native-emoji-picker.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
