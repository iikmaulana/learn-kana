import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../i18n.js';
import MateriChat, { OPENING_QUESTIONS, createOpening } from './MateriChat.js';
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

const getChatInput = () => document.querySelector('.materi-chat-input');

const renderChat = () => render(
  <LanguageProvider>
    <MateriChat />
  </LanguageProvider>
);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('language', 'en');
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.scrollTo = () => {};
  hasGeminiKey.mockReset().mockReturnValue(true);
  sendGeminiMessage.mockReset();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

describe('the AI chat', () => {
  test('opens with the greeting message', () => {
    renderChat();
    expect(screen.getByText('ヤッホー、せんぱい〜！おなまえは、なんですか〜？')).toBeInTheDocument();
  });

  test('hides romaji and meaning by default, and reveals progressively on clicking help (click 1: romaji, click 2: romaji and meaning, click 3: hide)', () => {
    renderChat();
    const romajiText = 'yahho-, senpai~! onamae wa, nan desu ka~?';
    const meaningText = 'Yahho, Senpai~! What is your name? Introduce yourself nyaa~';
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
    const input = getChatInput();
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

  test('the header 3-dots menu toggles romaji and meaning for bot messages', () => {
    renderChat();
    const romajiText = 'yahho-, senpai~! onamae wa, nan desu ka~?';
    expect(screen.queryByText(romajiText)).toBeNull();

    // the header 3-dots button opens the menu; showing romaji via toggle
    fireEvent.click(document.querySelector('.materi-chat-menu-container .materi-chat-header-btn'));
    const romajiBtn = screen.getByText('Show Romaji').closest('button');
    expect(romajiBtn).not.toBeNull();
    fireEvent.click(romajiBtn);
    expect(screen.getByText(romajiText)).toBeInTheDocument();

    fireEvent.click(romajiBtn);
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

  test('selecting a suggestion chip inserts it into the input', () => {
    renderChat();
    const input = screen.getByRole('textbox');
    
    // Open help panel
    const helpBtn = document.querySelector('.materi-chat-composer-help-btn');
    expect(helpBtn).not.toBeNull();
    fireEvent.click(helpBtn);
    
    // Click a suggestion chip (first one)
    const suggestionChips = document.querySelectorAll('.materi-chat-phrase-chip');
    expect(suggestionChips.length).toBe(3);
    fireEvent.click(suggestionChips[0]);
    
    // Input should now contain the selected Japanese phrase
    const jpChar = suggestionChips[0].querySelector('.materi-chat-phrase-jp').textContent;
    expect(input.value).toContain(jpChar);
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
    const input = getChatInput();
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
    const input = getChatInput();
    fireEvent.change(input, { target: { value: 'tenki wa?' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('あめですね')).toBeInTheDocument();
    });
  });

  test('shows an alert when the AI request fails', async () => {
    sendGeminiMessage.mockRejectedValue(new Error('NETWORK'));

    renderChat();
    const input = getChatInput();
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
    expect(getChatInput()).toBeDisabled();
  });

  test('renders 3 dynamic quick reply suggestion chips based on bot question when help is opened', () => {
    renderChat();

    // Open help
    fireEvent.click(document.querySelector('.materi-chat-composer-help-btn'));

    // Bot starts with "ヤッホー、せんぱい！おなまえはなんですか。" (name question)
    const chips = document.querySelectorAll('.materi-chat-phrase-chip');
    expect(chips.length).toBe(3);
    expect(chips[0]).toHaveTextContent('わたしは [なまえ] です');
    expect(chips[1]).toHaveTextContent('はじめまして！');
    expect(chips[2]).toHaveTextContent('よろしくおねがいします');

    // Clicking a chip inserts phrase into input
    const input = screen.getByRole('textbox');
    fireEvent.click(chips[0]);
    expect(input.value).toContain('わたしは [なまえ] です');
  });

  test('does not render quick reply chips when the bot message is not a question', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: 'すごいですね、せんぱい！とても じょうずです！',
      romaji: 'sugoi desu ne, senpai! totemo jouzu desu!',
      meaning: 'Hebat sekali, senpai! Sangat pandai!',
    });

    renderChat();
    const input = getChatInput();
    fireEvent.change(input, { target: { value: 'arigatou' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('すごいですね、せんぱい！とても じょうずです！')).toBeInTheDocument();
    });

    // Open help panel
    fireEvent.click(document.querySelector('.materi-chat-composer-help-btn'));

    // Bot message was not a question, so no phrase chips should be displayed
    const chips = document.querySelectorAll('.materi-chat-phrase-chip');
    expect(chips.length).toBe(0);
  });

  test('user-sent messages have a help button that toggles romaji reading', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: 'はい！',
      romaji: 'hai!',
      meaning: 'Yes!',
    });

    renderChat();
    const input = getChatInput();
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

  test('pressing Enter submits the message, while Shift+Enter allows newline', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: 'はい、おはようございます！',
      romaji: 'hai, ohayou gozaimasu!',
      meaning: 'Yes, good morning!',
    });

    renderChat();
    const input = getChatInput();
    fireEvent.focus(input);
    expect(document.body.classList.contains('chat-keyboard-open')).toBe(true);
    fireEvent.change(input, { target: { value: 'ohayou' } });

    // Shift+Enter does not send
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });
    expect(document.querySelector('.materi-chat-msg.user')).toBeNull();

    // Plain Enter submits the message
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: false });
    expect(document.querySelector('.materi-chat-msg.user')).not.toBeNull();
    expect(screen.getByText('おはよう')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('はい、おはようございます！')).toBeInTheDocument();
    });
  });

  test('automatically displays romaji and meaning for new messages when show romaji and show meaning are both active', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: 'どういたしまして！',
      romaji: 'douitashimashite!',
      meaning: 'You are welcome!',
    });

    renderChat();

    // Initially romaji and meaning are hidden
    expect(screen.queryByText('yahho-, senpai~! onamae wa, nan desu ka~?')).toBeNull();

    // Open header 3-dots menu and activate both "Show Romaji" and "Show Meaning"
    fireEvent.click(document.querySelector('.materi-chat-menu-container .materi-chat-header-btn'));
    const romajiBtn = screen.getByText('Show Romaji').closest('button');
    const meaningBtn = screen.getByText('Show Meaning').closest('button');
    fireEvent.click(romajiBtn);
    fireEvent.click(meaningBtn);

    // Initial greeting now shows romaji and meaning
    expect(screen.getByText('yahho-, senpai~! onamae wa, nan desu ka~?')).toBeInTheDocument();

    // Learner sends a message
    const input = getChatInput();
    fireEvent.change(input, { target: { value: 'arigatou' } });
    fireEvent.submit(input.closest('form'));

    // The user bubble automatically displays both romaji and meaning without manual clicks
    const userBubble = document.querySelector('.materi-chat-msg.user');
    expect(userBubble).not.toBeNull();
    expect(userBubble.querySelector('.materi-chat-romaji')).toHaveTextContent('arigatou');
    expect(userBubble.querySelector('.materi-chat-meaning')).toHaveTextContent('Thank you');

    // Bot reply automatically displays both romaji and meaning as well
    await waitFor(() => {
      expect(screen.getByText('どういたしまして！')).toBeInTheDocument();
    });
    expect(screen.getByText('douitashimashite!')).toBeInTheDocument();
    expect(screen.getByText('You are welcome!')).toBeInTheDocument();
  });

  test('toggles N5 Kanji setting in header 3-dots menu and passes useN5Kanji to sendGeminiMessage', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: '今日は何をしますか？',
      romaji: 'kyou wa nani o shimasu ka?',
      meaning: 'What are you doing today?',
    });

    renderChat();

    // Open header 3-dots menu
    fireEvent.click(document.querySelector('.materi-chat-menu-container .materi-chat-header-btn'));

    // Find N5 Kanji toggle button
    const n5Toggle = screen.getByText('N5 Kanji').closest('button');
    expect(n5Toggle).toBeInTheDocument();
    expect(n5Toggle.querySelector('.materi-chat-menu-switch')).not.toHaveClass('active');

    // Click to enable N5 Kanji
    fireEvent.click(n5Toggle);
    expect(n5Toggle.querySelector('.materi-chat-menu-switch')).toHaveClass('active');

    // Send a message
    const input = getChatInput();
    fireEvent.change(input, { target: { value: 'genki' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(sendGeminiMessage).toHaveBeenCalled();
    });

    const options = sendGeminiMessage.mock.calls[0][3];
    expect(options.useN5Kanji).toBe(true);
  });

  test('renders bot message as WhatsApp-style voice note bubble when Sora mood decides isVoiceNote is true', async () => {
    const vnReply = 'せんぱい〜、だいすきだよ！';
    const vnRomaji = 'senpai~, daisuki da yo!';
    const vnMeaning = 'Senpai~, aku suka banget sama kamu!';
    sendGeminiMessage.mockResolvedValue({
      jp: vnReply,
      romaji: vnRomaji,
      meaning: vnMeaning,
      isVoiceNote: true,
    });

    renderChat();

    // Send a message
    const input = getChatInput();
    fireEvent.change(input, { target: { value: 'sora chan' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(document.querySelector('.materi-chat-msg.bot.voice-note')).not.toBeNull();
    });

    const vnBubble = document.querySelector('.materi-chat-msg.bot.voice-note');
    expect(vnBubble).toBeInTheDocument();
    expect(vnBubble.querySelector('.materi-chat-vn-avatar')).toBeInTheDocument();
    expect(vnBubble.querySelector('.materi-chat-vn-mic-badge')).toBeInTheDocument();
    expect(vnBubble.querySelector('.materi-chat-vn-waveform')).toBeInTheDocument();

    // Initially, transcript text is hidden (audio-only voice note)
    expect(screen.queryByText(vnReply)).toBeNull();

    // Clicking play button toggles playback
    const playBtn = vnBubble.querySelector('.materi-chat-vn-play-btn');
    expect(playBtn).not.toBeNull();
    fireEvent.click(playBtn);

    const helpBtn = vnBubble.querySelector('.materi-chat-help-btn');
    expect(helpBtn).not.toBeNull();

    // Click 1: Reveals Japanese text (lihat teks)
    fireEvent.click(helpBtn);
    expect(screen.getByText(vnReply)).toBeInTheDocument();
    expect(screen.queryByText(vnRomaji)).toBeNull();
    expect(screen.queryByText(vnMeaning)).toBeNull();

    // Click 2: Reveals Romaji
    fireEvent.click(helpBtn);
    expect(screen.getByText(vnReply)).toBeInTheDocument();
    expect(screen.getByText(vnRomaji)).toBeInTheDocument();
    expect(screen.queryByText(vnMeaning)).toBeNull();

    // Click 3: Reveals Meaning
    fireEvent.click(helpBtn);
    expect(screen.getByText(vnReply)).toBeInTheDocument();
    expect(screen.getByText(vnRomaji)).toBeInTheDocument();
    expect(screen.getByText(vnMeaning)).toBeInTheDocument();

    // Click 4: Closes back to hidden voice note
    fireEvent.click(helpBtn);
    expect(screen.queryByText(vnReply)).toBeNull();
    expect(screen.queryByText(vnRomaji)).toBeNull();
    expect(screen.queryByText(vnMeaning)).toBeNull();
  });

  test('does not render bot message as voice note even if text is long when isVoiceNote is false', async () => {
    const longReply = 'せんぱい、日本語の勉強はとても楽しいですね！毎日少しずつ練習していきましょう。応援していますよ！';
    const longRomaji = 'senpai, nihongo no benkyou wa totemo tanoshii desu ne! mainichi sukoshizutsu renshuu shite ikimashou. ouen shite imasu yo!';
    const longMeaning = 'Senpai, belajar bahasa Jepang sangat menyenangkan ya! Mari berlatih sedikit demi sedikit setiap hari. Aku selalu mendukungmu!';
    sendGeminiMessage.mockResolvedValue({
      jp: longReply,
      romaji: longRomaji,
      meaning: longMeaning,
      isVoiceNote: false,
    });

    renderChat();

    const input = getChatInput();
    fireEvent.change(input, { target: { value: 'halo' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText(longReply)).toBeInTheDocument();
    });

    expect(document.querySelector('.materi-chat-msg.bot.voice-note')).toBeNull();
  });

  test('picks a randomized opening question based on Math.random', () => {
    // Return index 1 from OPENING_QUESTIONS (which is the hometown/origin question)
    vi.spyOn(Math, 'random').mockReturnValue(1 / OPENING_QUESTIONS.length);
    renderChat();
    expect(screen.getByText(OPENING_QUESTIONS[1].jp)).toBeInTheDocument();
  });

  test('passes allowVoiceNote: false during initial approach turns and true after rapport is built', async () => {
    sendGeminiMessage.mockResolvedValue({
      jp: 'こんにちは！',
      romaji: 'konnichiwa!',
      meaning: 'Hello!',
      isVoiceNote: false,
    });

    renderChat();

    // Turn 1
    const input = getChatInput();
    fireEvent.change(input, { target: { value: 'hai' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(sendGeminiMessage).toHaveBeenCalled();
    });

    expect(sendGeminiMessage.mock.calls[0][3].allowVoiceNote).toBe(false);

    // Turn 2
    fireEvent.change(input, { target: { value: 'genki' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(sendGeminiMessage).toHaveBeenCalledTimes(2);
    });

    expect(sendGeminiMessage.mock.calls[1][3].allowVoiceNote).toBe(false);

    // Turn 3
    fireEvent.change(input, { target: { value: 'hai sou desu' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(sendGeminiMessage).toHaveBeenCalledTimes(3);
    });

    expect(sendGeminiMessage.mock.calls[2][3].allowVoiceNote).toBe(true);
  });

  test('renders message timestamps and WhatsApp-style read status ticks', async () => {
    let streamCallback;
    sendGeminiMessage.mockImplementation((_msgs, _lang, _hints, opts) => {
      streamCallback = opts?.onUpdate;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            jp: 'こんにちは！',
            romaji: 'konnichiwa!',
            meaning: 'Hello!',
            isVoiceNote: false,
          });
        }, 50);
      });
    });

    renderChat();

    // Bot greeting has a timestamp
    const initialBotBubble = document.querySelector('.materi-chat-msg.bot');
    expect(initialBotBubble.querySelector('.materi-chat-time')).toBeInTheDocument();
    expect(initialBotBubble.querySelector('.materi-chat-time').textContent).toMatch(/^\d{2}:\d{2}$/);

    // Send user message
    const input = getChatInput();
    fireEvent.change(input, { target: { value: 'ohayou' } });
    fireEvent.submit(input.closest('form'));

    const userBubble = document.querySelector('.materi-chat-msg.user');
    expect(userBubble).toBeInTheDocument();

    // User message has a timestamp
    expect(userBubble.querySelector('.materi-chat-time')).toBeInTheDocument();
    expect(userBubble.querySelector('.materi-chat-time').textContent).toMatch(/^\d{2}:\d{2}$/);

    // Initial tick state after request starts is delivered (2 grey ticks)
    const ticks = userBubble.querySelector('.materi-chat-ticks');
    expect(ticks).toBeInTheDocument();
    expect(ticks.classList.contains('ticks-delivered') || ticks.classList.contains('ticks-sent')).toBe(true);

    // When bot starts streaming, status transitions to read (ticks-read)
    if (streamCallback) {
      act(() => {
        streamCallback('こんにちは\nkonnichiwa\nHello');
      });
    }

    await waitFor(() => {
      expect(userBubble.querySelector('.materi-chat-ticks')).toHaveClass('ticks-read');
    });
  });

  test('header 3-dots menu contains WhatsApp toggles and closes on Escape', () => {
    renderChat();

    const menuBtn = document.querySelector('.materi-chat-menu-container .materi-chat-header-btn');
    expect(menuBtn).toBeInTheDocument();

    // Initially menu is closed
    expect(document.querySelector('.materi-chat-menu-dropdown')).toBeNull();

    // Click opens menu
    fireEvent.click(menuBtn);
    const dropdown = document.querySelector('.materi-chat-menu-dropdown');
    expect(dropdown).toBeInTheDocument();

    // Check menu items
    expect(screen.getByText('Auto Kana')).toBeInTheDocument();
    expect(screen.getByText('Show Romaji')).toBeInTheDocument();
    expect(screen.getByText('Show Meaning')).toBeInTheDocument();
    expect(screen.getByText('N5 Kanji')).toBeInTheDocument();
    expect(screen.getByText('Clear Chat History')).toBeInTheDocument();

    // Press Escape closes menu
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.materi-chat-menu-dropdown')).toBeNull();
  });
});
