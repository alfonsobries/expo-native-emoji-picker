import { pickEmoji, pickEmojis } from '../index';

const mockPresentAsync = jest.fn();
const mockAddListener = jest.fn();

jest.mock('../ExpoNativeEmojiPickerModule', () => ({
  __esModule: true,
  get default() {
    return { presentAsync: mockPresentAsync, addListener: mockAddListener };
  },
}));

beforeEach(() => {
  mockPresentAsync.mockReset();
  mockAddListener.mockReset();
  mockAddListener.mockReturnValue({ remove: jest.fn() });
});

describe('pickEmoji', () => {
  it('resolves with the picked emoji', async () => {
    mockPresentAsync.mockResolvedValue('🦖');

    await expect(pickEmoji()).resolves.toBe('🦖');
    expect(mockPresentAsync).toHaveBeenCalledWith({});
  });

  it('resolves null when dismissed', async () => {
    mockPresentAsync.mockResolvedValue(null);

    await expect(pickEmoji()).resolves.toBeNull();
  });

  it('forwards options to the native module', async () => {
    mockPresentAsync.mockResolvedValue(null);

    await pickEmoji({ cancelLabel: 'Done', backdropOpacity: 0.4 });

    expect(mockPresentAsync).toHaveBeenCalledWith({ cancelLabel: 'Done', backdropOpacity: 0.4 });
  });
});

describe('pickEmojis', () => {
  it('presents in multiple mode and resolves with all picks', async () => {
    mockPresentAsync.mockResolvedValue(['😀', '🎉']);

    await expect(pickEmojis()).resolves.toEqual(['😀', '🎉']);
    expect(mockPresentAsync).toHaveBeenCalledWith({ multiple: true });
  });

  it('streams picks through onPick and removes the subscription after', async () => {
    const remove = jest.fn();
    let emitPick: ((event: { emoji: string }) => void) | undefined;
    mockAddListener.mockImplementation((event: string, listener: never) => {
      if (event === 'onPick') {
        emitPick = listener;
      }
      return { remove };
    });
    mockPresentAsync.mockImplementation(async () => {
      emitPick?.({ emoji: '🍕' });
      return ['🍕'];
    });

    const onPick = jest.fn();
    await expect(pickEmojis({ onPick })).resolves.toEqual(['🍕']);

    expect(onPick).toHaveBeenCalledWith('🍕');
    expect(remove).toHaveBeenCalled();
  });

  it('does not subscribe when no callbacks are provided', async () => {
    mockPresentAsync.mockResolvedValue([]);

    await pickEmojis();

    expect(mockAddListener).not.toHaveBeenCalled();
  });
});
