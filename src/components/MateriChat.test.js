import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../i18n.js';
import MateriChat from './MateriChat.js';
import { hasGeminiKey, sendGeminiMessage } from '../services/geminiChat.js';

// The AI is replaced by a fake: the tests never reach the network and can
// choose each reply (parseGeminiReply stays the real one)
vi.mock('../services/geminiChat.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    hasGeminiKey: vi.fn(() => true),
    sendGeminiMessage: vi.fn(),
  };
});

const INPUT_PLACEHOLDER = /type romaji/i;

const renderChat = () => render(
  <LanguageProvider>
    <MateriChat />
  </LanguageProvider>
);

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = () => {};
  hasGeminiKey.mockReset().mockReturnValue(true);
  sendGeminiMessage.mockReset();
});

describe('the AI chat', () => {
  test('opens with the greeting message', () => {
    renderChat();
    expect(screen.getByText('こんにちは！おなまえはなんですか。')).toBeInTheDocument();
  });

  test('hides romaji and meaning by default, and reveals progressively on clicking help (click 1: romaji, click 2: romaji and meaning, click 3: hide)', () => {
    renderChat();
    const romajiText = 'konnichiwa! onamae wa nan desu ka.';
    const meaningText = 'Hello! What is your name?';
    expect(screen.queryByText(romajiText)).toBeNull();
    expect(screen.queryByText(meaningText)).toBeNull();

    const helpBtn = document.querySelector('.materi-chat-help-btn');
    expect(helpBtn).not.toBeNull();

    // Click 1: shows romaji only
    fireEvent.click(helpBtn);
    expect(screen.getByText(romajiText)).toBeInTheDocument();
    expect(screen.queryByText(meaningText)).toBeNull();

    // Click 2: shows both romaji and meaning
    fireEvent.click(helpBtn);
    expect(screen.getByText(romajiText)).toBeInTheDocument();
    expect(screen.getByText(meaningText)).toBeInTheDocument();

    // Click 3: hides both
    fireEvent.click(helpBtn);
    expect(screen.queryByText(romajiText)).toBeNull();
    expect(screen.queryByText(meaningText)).toBeNull();
  });

  test('user sent message provides progressive help reveal with romaji and meaning', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: 'どういたしまして！',
      romaji: 'douitashimashite!',
      meaning: 'You are welcome!',
    });

    renderChat();
    const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER);
    fireEvent.change(input, { target: { value: 'arigatou' } });
    fireEvent.submit(input.closest('form'));

    // User message bubble appears
    expect(screen.getByText('ありがとう')).toBeInTheDocument();

    const userHelpBtn = document.querySelector('.materi-chat-help-btn.user');
    expect(userHelpBtn).not.toBeNull();

    // Initially romaji and meaning are hidden
    expect(screen.queryByText('arigatou')).toBeNull();
    expect(screen.queryByText('Thank you')).toBeNull();

    // Click 1: romaji appears
    fireEvent.click(userHelpBtn);
    expect(screen.getByText('arigatou')).toBeInTheDocument();
    expect(screen.queryByText('Thank you')).toBeNull();

    // Click 2: romaji and meaning appear
    fireEvent.click(userHelpBtn);
    expect(screen.getByText('arigatou')).toBeInTheDocument();
    expect(screen.getByText('Thank you')).toBeInTheDocument();

    // Click 3: hides both
    fireEvent.click(userHelpBtn);
    expect(screen.queryByText('arigatou')).toBeNull();
    expect(screen.queryByText('Thank you')).toBeNull();

    await waitFor(() => {
      expect(screen.getByText('どういたしまして！')).toBeInTheDocument();
    });
  });

  test('the composer help button toggles help for all bot messages', () => {
    renderChat();
    const romajiText = 'konnichiwa! onamae wa nan desu ka.';
    expect(screen.queryByText(romajiText)).toBeNull();

    // the composer help button opens the panel; showing every message's help
    // is the toggle-all button inside that panel
    fireEvent.click(document.querySelector('.materi-chat-composer-help-btn'));
    const toggleAllBtn = document.querySelector('.materi-chat-help-toggle-all-btn');
    expect(toggleAllBtn).not.toBeNull();
    fireEvent.click(toggleAllBtn);
    expect(screen.getByText(romajiText)).toBeInTheDocument();

    fireEvent.click(toggleAllBtn);
    expect(screen.queryByText(romajiText)).toBeNull();
  });

  test('converts romaji to kana in real time as the user types', () => {
    renderChat();
    const input = screen.getByRole('textbox');
    
    // Initial value should be romaji
    fireEvent.change(input, { target: { value: 'konnichiwa' } });
    // IME mode maps the typed romaji letter by letter; the doubled "nn" of
    // こんにちは would need a second n: the raw conversion is こんいちわ
    expect(input.value).toBe('こんいちわ');
    
    // Adding more text
    fireEvent.change(input, { target: { value: 'どうも' } });
    expect(input.value).toBe('どうも');
  });

  test('selecting a phrase from help panel inserts it into the input', () => {
    renderChat();
    const input = screen.getByRole('textbox');
    
    // Open help panel
    const helpBtn = document.querySelector('.materi-chat-composer-help-btn');
    expect(helpBtn).not.toBeNull();
    fireEvent.click(helpBtn);
    
    // Click a phrase chip (first one)
    const phraseChips = document.querySelectorAll('.materi-chat-phrase-chip');
    if (phraseChips.length > 0) {
      fireEvent.click(phraseChips[0]);
      
      // Input should now contain the selected Japanese phrase
      const jpChar = phraseChips[0].querySelector('.materi-chat-phrase-jp').textContent;
      expect(input.value).toContain(jpChar);
    }
  });

  test('closing the help panel is possible via close button', () => {
    renderChat();
    const helpBtn = document.querySelector('.materi-chat-composer-help-btn');
    
    // Open help panel
    fireEvent.click(helpBtn);
    expect(document.querySelector('.materi-chat-help-panel')).not.toBeNull();
    
    // Close via X button
    const closeButton = document.querySelector('.materi-chat-help-panel-close');
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton);
    
    expect(document.querySelector('.materi-chat-help-panel')).toBeNull();
    
    // Help button should show inactive state
    expect(helpBtn.classList.contains('active')).toBe(false);
  });

  test('sends a learner turn and displays the AI tutor reply', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: 'わたしはたろうです。よろしくね！',
      romaji: 'watashi wa tarou desu. yoroshiku ne!',
      meaning: 'I am Taro. Nice to meet you!',
    });

    renderChat();
    const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER);
    fireEvent.change(input, { target: { value: 'watashi wa tarou desu' } });
    fireEvent.submit(input.closest('form'));

    // the sent turn reaches the thread as kana, not as the typed romaji
    expect(screen.getByText('わたし わ たろう です')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('わたしはたろうです。よろしくね！')).toBeInTheDocument();
    });
  });

  test('displays streaming Japanese text while the reply is arriving', async () => {
    sendGeminiMessage.mockImplementation((_msgs, _lang, _hints, opts) => {
      if (opts?.onUpdate) {
        opts.onUpdate('あめですね\name desu ne\nHujan ya');
      }
      return Promise.resolve({
        jp: 'あめですね',
        romaji: 'ame desu ne',
        meaning: 'Hujan ya',
      });
    });

    renderChat();
    const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER);
    fireEvent.change(input, { target: { value: 'tenki wa?' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('あめですね')).toBeInTheDocument();
    });
  });

  test('shows an alert when the AI request fails', async () => {
    sendGeminiMessage.mockRejectedValue(new Error('NETWORK'));

    renderChat();
    const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER);
    fireEvent.change(input, { target: { value: 'konnichiwa' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('without a key the chat says so and the input is off', () => {
    hasGeminiKey.mockReturnValue(false);
    renderChat();
    expect(screen.getByRole('alert')).toHaveTextContent('VITE_GEMINI_API_KEY');
    expect(screen.getByPlaceholderText(INPUT_PLACEHOLDER)).toBeDisabled();
  });

  test('has no scenario topics or suggested replies', () => {
    renderChat();
    expect(document.querySelector('.materi-chat-scenarios')).toBeNull();
    expect(document.querySelector('.materi-chat-quick-replies')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  test('reset button restarts the conversation to the opening', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: 'げんきですか？',
      romaji: 'genki desu ka?',
      meaning: 'How are you?',
    });

    renderChat();
    const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER);
    fireEvent.change(input, { target: { value: 'watashi wa' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('げんきですか？')).toBeInTheDocument();
    });

    const resetBtn = document.querySelector('.materi-chat-reset-btn');
    fireEvent.click(resetBtn);

    expect(screen.queryByText('げんきですか？')).toBeNull();
    expect(screen.queryByText('わたし わ')).toBeNull();
    expect(screen.getByText('こんにちは！おなまえはなんですか。')).toBeInTheDocument();
  });

  test('user-sent messages have a help button that toggles romaji reading', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: 'はい！',
      romaji: 'hai!',
      meaning: 'Yes!',
    });

    renderChat();
    const input = screen.getByPlaceholderText(INPUT_PLACEHOLDER);
    fireEvent.change(input, { target: { value: 'arigatou' } });
    fireEvent.submit(input.closest('form'));

    const userBubble = document.querySelector('.materi-chat-msg.user');
    expect(userBubble).not.toBeNull();

    const userHelpBtn = userBubble.querySelector('.materi-chat-help-btn.user');
    expect(userHelpBtn).not.toBeNull();

    // Romaji should be hidden by default
    expect(userBubble.querySelector('.materi-chat-romaji')).toBeNull();

    // Click help button on user message (stage 1: romaji)
    fireEvent.click(userHelpBtn);
    expect(userBubble.querySelector('.materi-chat-romaji')).toHaveTextContent('arigatou');

    // Click 2 (stage 2: romaji and meaning)
    fireEvent.click(userHelpBtn);
    expect(userBubble.querySelector('.materi-chat-romaji')).toHaveTextContent('arigatou');

    // Click 3: toggle off
    fireEvent.click(userHelpBtn);
    expect(userBubble.querySelector('.materi-chat-romaji')).toBeNull();

    await waitFor(() => {
      expect(screen.getByText('はい！')).toBeInTheDocument();
    });
  });
});
