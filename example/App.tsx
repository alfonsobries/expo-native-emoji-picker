import { pickEmoji, pickEmojis } from 'expo-native-emoji-picker';
import { useState } from 'react';
import { Button, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function App() {
  const [picked, setPicked] = useState<string | null>(null);
  const [reactions, setReactions] = useState<string[]>([]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>expo-native-emoji-picker</Text>

        <Group name="Single pick">
          <Button
            title="Pick an emoji"
            onPress={async () => {
              const emoji = await pickEmoji();
              if (emoji) {
                setPicked(emoji);
              }
            }}
          />
          <Text style={styles.emoji}>{picked ?? '·'}</Text>
        </Group>

        <Group name="Keyboard mode (multiple)">
          <Button
            title="Add reactions"
            onPress={() =>
              pickEmojis({
                cancelLabel: 'Done',
                onPick: (emoji) => setReactions((current) => [...current, emoji]),
                onDelete: () => setReactions((current) => current.slice(0, -1)),
              })
            }
          />
          <Text style={styles.emoji}>{reactions.length > 0 ? reactions.join(' ') : '·'}</Text>
        </Group>

        <Group name="Custom options">
          <Button
            title="Stronger backdrop, no tap outside"
            onPress={async () => {
              const emoji = await pickEmoji({ backdropOpacity: 0.4, dismissOnTapOutside: false });
              if (emoji) {
                setPicked(emoji);
              }
            }}
          />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: { fontSize: 30, margin: 20 },
  groupHeader: { fontSize: 20, marginBottom: 20 },
  group: { margin: 20, backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  container: { flex: 1, backgroundColor: '#eee' },
  emoji: { fontSize: 40, marginTop: 12, textAlign: 'center' as const },
};
