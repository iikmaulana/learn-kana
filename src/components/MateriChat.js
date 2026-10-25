import React, { useState, useEffect, useRef } from 'react';
import { toKana, toRomaji } from 'wanakana';
import { useLanguage } from '../i18n.js';
import Icon from './Icon.js';
import soraAvatar from '../assets/sora-avatar.webp';
import { isSpeechSupported } from '../speech.js';
import { hasGeminiKey, sendGeminiMessage, parseGeminiReply } from '../services/geminiChat.js';
import { hasElevenLabsKey, playBotSpeech, playUserSpeech, stopElevenLabsAudio } from '../services/elevenlabs.js';
import { lookupUserMeaning, resolveUserMeaning } from '../services/userMeaning.js';
import { getQuickRepliesForQuestion } from '../services/chatReplies.js';
import { readJson, write } from '../storage.js';

export const CHAT_HISTORY_KEY = 'chatHistory';
export const CHAT_AUTO_REVEAL_HELP_KEY = 'chatAutoRevealHelp';
export const CHAT_SHOW_ROMAJI_KEY = 'chatShowRomaji';
export const CHAT_SHOW_MEANING_KEY = 'chatShowMeaning';
export const CHAT_USE_N5_KANJI_KEY = 'chatUseN5Kanji';

export const VN_BARS = [
  30, 50, 75, 40, 60, 90, 70, 45, 85, 100, 65, 50, 75, 90, 60, 40, 70, 85, 50, 65, 40, 55, 30
];

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/* The Chat tab: a free conversation with the AI tutor (Gemini).
 *
 * The tutor opens with a fixed greeting, so the page shows something at once
 * without spending a request. Each reply streams in: the Japanese appears as
 * soon as it arrives, and the romaji and meaning stay behind the help
 * ("Bantuan") button until the learner asks for them.
 * Romaji input automatically converts to kana in real time, and a helper
 * panel provides quick response phrases and kana typing tips.
 */

const OPENING = {
  jp: 'ヤッホー、せんぱい〜！おなまえは、なんですか〜？',
  romaji: 'yahho-, senpai~! onamae wa, nan desu ka~?',
  meaningKey: 'chatOpeningMeaning',
};

let idCounter = 0;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function createOpening() {
  return { id: nextId('bot'), sender: 'bot', ...OPENING };
}

export default function MateriChat() {
  const { t, language } = useLanguage();
  const aiAvailable = hasGeminiKey();

  const [messages, setMessages] = useState(() => {
    const saved = readJson(CHAT_HISTORY_KEY, null);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return [createOpening()];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(null);
  const [errorNotice, setErrorNotice] = useState(aiAvailable ? null : 'chatAiNoKeyNotice');
  const [revealedMessages, setRevealedMessages] = useState({});
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [autoKana, setAutoKana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(() => {
    const saved = readJson(CHAT_SHOW_ROMAJI_KEY, null);
    if (typeof saved === 'boolean') return saved;
    return readJson(CHAT_AUTO_REVEAL_HELP_KEY, false);
  });
  const [showMeaning, setShowMeaning] = useState(() => {
    const saved = readJson(CHAT_SHOW_MEANING_KEY, null);
    if (typeof saved === 'boolean') return saved;
    return readJson(CHAT_AUTO_REVEAL_HELP_KEY, false);
  });
  const [useN5Kanji, setUseN5Kanji] = useState(() => readJson(CHAT_USE_N5_KANJI_KEY, false));
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  const [isFocused, setIsFocused] = useState(false);

  const messagesEndRef = useRef(null);
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  // The conversation a pending reply belongs to: a restart drops late replies
  const conversationRef = useRef(0);
  const speechSupported = isSpeechSupported() || hasElevenLabsKey();

  // Find the latest bot message to generate dynamic quick reply phrases
  const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot') || messages[0];
  const quickReplies = getQuickRepliesForQuestion(lastBotMessage?.jp || OPENING.jp);

  useEffect(() => {
    return () => {
      stopElevenLabsAudio();
      document.body.classList.remove('chat-keyboard-open');
      document.documentElement.classList.remove('chat-keyboard-open');
    };
  }, []);

  useEffect(() => {
    if (isFocused) {
      document.body.classList.add('chat-keyboard-open');
      document.documentElement.classList.add('chat-keyboard-open');
    } else {
      document.body.classList.remove('chat-keyboard-open');
      document.documentElement.classList.remove('chat-keyboard-open');
    }
  }, [isFocused]);

  const scrollToBottom = (behavior = 'smooth') => {
    if (threadRef.current) {
      if (typeof threadRef.current.scrollTo === 'function') {
        threadRef.current.scrollTo({
          top: threadRef.current.scrollHeight,
          behavior,
        });
      } else {
        threadRef.current.scrollTop = threadRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
    if (messages && messages.length > 0) {
      write(CHAT_HISTORY_KEY, messages);
    }
  }, [messages, loading, streaming]);

  const adjustTextareaHeight = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    const value = autoKana ? toKana(raw, { IMEMode: true }) : raw;
    setInput(value);
    adjustTextareaHeight();
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter creates a newline
        setTimeout(adjustTextareaHeight, 0);
      } else {
        // Enter sends immediately
        e.preventDefault();
        handleSend(input);
      }
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // Prevent the browser from scrolling the outer page when the keyboard opens
    if (typeof window.scrollTo === 'function') {
      try {
        window.scrollTo(0, 0);
      } catch (e) {
        // ignore jsdom / unsupported environments
      }
    }
    setTimeout(() => {
      if (typeof window.scrollTo === 'function') {
        try {
          window.scrollTo(0, 0);
        } catch (e) {
          // ignore
        }
      }
      scrollToBottom('smooth');
    }, 150);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  const handlePickPhrase = (phraseText) => {
    setInput(prev => (prev ? `${prev} ${phraseText}` : phraseText));
    setTimeout(adjustTextareaHeight, 0);
    inputRef.current?.focus();
  };

  const handleSend = async (rawText) => {
    const rawTrimmed = (rawText || '').trim();
    const text = autoKana ? toKana(rawTrimmed) : rawTrimmed;
    if (!text || loading) return;
    if (!aiAvailable) {
      setErrorNotice('chatAiNoKeyNotice');
      return;
    }

    setErrorNotice(null);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setShowHelpPanel(false);

    const localMeaning = lookupUserMeaning(text, language);
    const userMessage = { id: nextId('user'), sender: 'user', text, meaning: localMeaning };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);
    setStreaming(null);

    if (!localMeaning) {
      resolveUserMeaning(text, language).then((resolved) => {
        if (resolved) {
          setMessages(current => current.map(m => (m.id === userMessage.id ? { ...m, meaning: resolved } : m)));
        }
      });
    }

    const conversation = conversationRef.current;
    const streamId = nextId('bot');
    try {
      const parsed = await sendGeminiMessage(nextMessages, language, null, {
        useN5Kanji,
        onUpdate: (raw) => {
          if (conversationRef.current !== conversation) return;
          setStreaming({ id: streamId, ...parseGeminiReply(raw) });
        },
      });
      if (conversationRef.current !== conversation) return;
      setMessages(current => [...current, {
        id: streamId,
        sender: 'bot',
        jp: parsed.jp,
        romaji: parsed.romaji,
        aiMeaning: parsed.meaning,
        isVoiceNote: parsed.isVoiceNote,
      }]);
    } catch (err) {
      if (conversationRef.current !== conversation) return;
      let messageKey = 'chatErrorGeneral';
      if (err.message === 'MISSING_KEY') messageKey = 'chatAiNoKeyNotice';
      else if (err.message === 'BAD_KEY') messageKey = 'chatErrorBadKey';
      else if (err.message === 'NETWORK') messageKey = 'chatErrorNetwork';
      else if (err.message === 'TIMEOUT' || err.message === 'BUSY') messageKey = 'chatErrorSlow';
      setErrorNotice(messageKey);
    } finally {
      if (conversationRef.current === conversation) {
        setStreaming(null);
        setLoading(false);
        inputRef.current?.focus();
      }
    }
  };

  const handleReset = () => {
    stopElevenLabsAudio();
    setPlayingAudioId(null);
    setAudioProgress({});
    conversationRef.current += 1;
    const initial = [createOpening()];
    setMessages(initial);
    write(CHAT_HISTORY_KEY, initial);
    setStreaming(null);
    setLoading(false);
    setInput('');
    setRevealedMessages({});
    setShowHelpPanel(false);
    setErrorNotice(aiAvailable ? null : 'chatAiNoKeyNotice');
  };

  const togglePlayVoiceNote = async (msg) => {
    if (playingAudioId === msg.id) {
      stopElevenLabsAudio();
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(msg.id);
    await playBotSpeech(msg.jp, {
      onTimeUpdate: ({ currentTime, duration, progress }) => {
        setAudioProgress(prev => ({
          ...prev,
          [msg.id]: { currentTime, duration, progress },
        }));
      },
      onEnded: () => {
        setPlayingAudioId(prev => (prev === msg.id ? null : prev));
        setAudioProgress(prev => ({
          ...prev,
          [msg.id]: { ...(prev[msg.id] || {}), currentTime: 0, progress: 0 },
        }));
      },
      onPause: () => {
        setPlayingAudioId(prev => (prev === msg.id ? null : prev));
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleSpeakBot = (text) => {
    if (!speechSupported || !text) return;
    playBotSpeech(text);
  };

  const handleSpeakUser = (text) => {
    if (!speechSupported || !text) return;
    playUserSpeech(text);
  };

  const toggleMessageHelp = (msgId, isVoiceNote = false) => {
    setRevealedMessages((prev) => {
      const current = prev[msgId];
      if (showRomaji && showMeaning) {
        return { ...prev, [msgId]: current === -1 ? 0 : -1 };
      }
      if (isVoiceNote) {
        if (showRomaji) {
          return { ...prev, [msgId]: current === 3 ? -1 : (current === -1 ? 0 : 3) };
        }
        if (showMeaning) {
          return { ...prev, [msgId]: current === 2 ? -1 : (current === -1 ? 0 : 2) };
        }
        const stage = current !== undefined && current > 0 ? current : 0;
        return { ...prev, [msgId]: (stage + 1) % 4 };
      }
      if (showRomaji) {
        return { ...prev, [msgId]: current === 2 ? 0 : 2 };
      }
      if (showMeaning) {
        return { ...prev, [msgId]: current === 1 ? 0 : 1 };
      }
      const stage = current !== undefined && current > 0 ? current : 0;
      return { ...prev, [msgId]: (stage + 1) % 3 };
    });
  };

  const toggleAutoKana = () => setAutoKana(prev => !prev);

  const toggleShowRomaji = () => {
    setShowRomaji(prev => {
      const next = !prev;
      write(CHAT_SHOW_ROMAJI_KEY, next);
      return next;
    });
  };

  const toggleShowMeaning = () => {
    setShowMeaning(prev => {
      const next = !prev;
      write(CHAT_SHOW_MEANING_KEY, next);
      return next;
    });
  };

  const toggleUseN5Kanji = () => {
    setUseN5Kanji(prev => {
      const next = !prev;
      write(CHAT_USE_N5_KANJI_KEY, next);
      return next;
    });
  };

  const cleanMeaning = (text) => {
    if (!text) return '';
    return String(text).replace(/\*[^*]+\*/g, '').replace(/\s{2,}/g, ' ').trim();
  };

  const meaningTextOf = msg => {
    const raw = msg.aiMeaning || (msg.meaningKey ? t(msg.meaningKey) : null);
    return cleanMeaning(raw);
  };

  const renderUserBubble = (msg) => {
    const stage = revealedMessages[msg.id] !== undefined ? revealedMessages[msg.id] : 0;
    const isRomajiVisible = stage === -1 ? false : (showRomaji || stage > 0);
    const isMeaningVisible = stage === -1 ? false : (showMeaning || stage === 2);
    const romaji = toRomaji(msg.text);
    const meaning = msg.meaning;
    const isHelpActive = (isRomajiVisible && Boolean(romaji)) || (isMeaningVisible && Boolean(meaning));

    return (
      <div key={msg.id} className='materi-chat-msg user'>
        <div className='materi-chat-bubble'>
          <div className='materi-chat-user-row'>
            <div className='materi-chat-user-text'>{msg.text}</div>
            <div className='materi-chat-msg-actions'>
              {speechSupported && (
                <button
                  type='button'
                  className='materi-chat-speak-btn'
                  onClick={() => handleSpeakUser(msg.text)}
                  aria-label={t('sentenceExerciseListen')}
                  title={t('sentenceExerciseListen')}
                >
                  <Icon name='volume' />
                </button>
              )}
              {Boolean(romaji) && (
                <button
                  type='button'
                  className={`materi-chat-help-btn user stage-${stage} ${isHelpActive ? 'active' : ''}`}
                  onClick={() => toggleMessageHelp(msg.id)}
                  aria-label={isHelpActive ? t('chatHelpHide') : t('chatHelpShow')}
                  aria-expanded={isHelpActive}
                  title={isHelpActive ? t('chatHelpHide') : t('chatHelpShow')}
                >
                  <Icon name='help-circle' />
                </button>
              )}
            </div>
          </div>
          {((isRomajiVisible && romaji) || (isMeaningVisible && meaning)) && (
            <div className='materi-chat-help-details user'>
              {isRomajiVisible && romaji && <div className='materi-chat-romaji'>{romaji}</div>}
              {isMeaningVisible && meaning && <div className='materi-chat-meaning user'>{meaning}</div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBotBubble = (msg, { live = false } = {}) => {
    const meaning = meaningTextOf(msg);
    const hasHelp = !live && Boolean(msg.romaji || meaning);
    const stage = revealedMessages[msg.id] !== undefined ? revealedMessages[msg.id] : 0;
    const isRomajiVisible = !live && (stage === -1 ? false : (showRomaji || stage > 0));
    const isMeaningVisible = !live && (stage === -1 ? false : (showMeaning || stage === 2));
    const isHelpActive = !live && ((isRomajiVisible && Boolean(msg.romaji)) || (isMeaningVisible && Boolean(meaning)));
    const isVoiceNote = !live && Boolean(msg.isVoiceNote);

    if (isVoiceNote) {
      const isPlaying = playingAudioId === msg.id;
      const prog = audioProgress[msg.id];
      const estimatedDuration = Math.max(3, Math.round(msg.jp.length * 0.16));
      const currentTimeVal = prog?.currentTime || 0;
      const validDuration = (prog?.duration && isFinite(prog.duration) && prog.duration > 0)
        ? prog.duration
        : estimatedDuration;
      const progress = (prog?.progress && isFinite(prog.progress) && prog.progress > 0)
        ? prog.progress
        : (validDuration > 0 ? Math.min(1, Math.max(0, currentTimeVal / validDuration)) : 0);
      const displayTime = isPlaying
        ? formatTime(currentTimeVal)
        : formatTime(validDuration);

      let isTranscriptVisible = false;
      let isRomajiVisible = false;
      let isMeaningVisible = false;

      if (showRomaji && showMeaning) {
        if (stage !== -1) {
          isTranscriptVisible = true;
          isRomajiVisible = Boolean(msg.romaji);
          isMeaningVisible = Boolean(meaning);
        }
      } else if (showRomaji) {
        if (stage !== -1) {
          isTranscriptVisible = true;
          isRomajiVisible = Boolean(msg.romaji);
          isMeaningVisible = stage === 3 && Boolean(meaning);
        }
      } else if (showMeaning) {
        if (stage !== -1) {
          isTranscriptVisible = true;
          isRomajiVisible = stage === 2 && Boolean(msg.romaji);
          isMeaningVisible = Boolean(meaning);
        }
      } else {
        if (stage >= 1) isTranscriptVisible = true;
        if (stage >= 2) isRomajiVisible = Boolean(msg.romaji);
        if (stage >= 3) isMeaningVisible = Boolean(meaning);
      }

      const isHelpActive = isTranscriptVisible;

      return (
        <div key={msg.id} className='materi-chat-msg bot voice-note'>
          <div className='materi-chat-bubble vn-bubble'>
            <div className='materi-chat-vn-player'>
              <div className='materi-chat-vn-avatar-wrapper'>
                <div className='materi-chat-vn-avatar' title='Sora-chan'>
                  <img src={soraAvatar} alt='Sora-chan' className='materi-chat-vn-avatar-img' />
                </div>
                <div className='materi-chat-vn-mic-badge' aria-hidden='true'>
                  <Icon name='mic' />
                </div>
              </div>

              <button
                type='button'
                className={`materi-chat-vn-play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={() => togglePlayVoiceNote(msg)}
                aria-label={isPlaying ? t('chatHelpHide') : t('sentenceExerciseListen')}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                <Icon name={isPlaying ? 'pause' : 'play'} />
              </button>

              <div
                className='materi-chat-vn-waveform-wrap'
                onClick={() => togglePlayVoiceNote(msg)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePlayVoiceNote(msg);
                  }
                }}
              >
                <div className='materi-chat-vn-waveform'>
                  {VN_BARS.map((height, idx) => {
                    const isPlayed = progress > (idx / VN_BARS.length);
                    return (
                      <span
                        key={idx}
                        className={`materi-chat-vn-bar ${isPlayed ? 'played' : ''}`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                  {progress > 0 && (
                    <span
                      className='materi-chat-vn-dot'
                      style={{ left: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                    />
                  )}
                </div>
                <div className='materi-chat-vn-meta'>
                  <span className='materi-chat-vn-time'>{displayTime}</span>
                  <span className='materi-chat-vn-badge'>{t('chatVoiceNoteLabel')}</span>
                </div>
              </div>

              <button
                type='button'
                className={`materi-chat-help-btn stage-${stage} ${isHelpActive ? 'active' : ''}`}
                onClick={() => toggleMessageHelp(msg.id, true)}
                aria-label={isHelpActive ? t('chatHelpHide') : t('chatHelpShow')}
                aria-expanded={isHelpActive}
                title={isHelpActive ? t('chatHelpHide') : t('chatHelpShow')}
              >
                <Icon name='help-circle' />
              </button>
            </div>

            {isTranscriptVisible && (
              <div className='materi-chat-vn-transcript-body'>
                <div className='materi-chat-jp-row'>
                  <span className='materi-chat-jp' lang='ja'>{msg.jp}</span>
                </div>
                {((isRomajiVisible && msg.romaji) || (isMeaningVisible && meaning)) && (
                  <div className='materi-chat-help-details'>
                    {isRomajiVisible && msg.romaji && <div className='materi-chat-romaji'>{msg.romaji}</div>}
                    {isMeaningVisible && meaning && <div className='materi-chat-meaning'>{meaning}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`materi-chat-msg bot ${live ? 'streaming' : ''}`}>
        <div className={`materi-chat-bubble ${live ? 'live' : ''}`}>
          <div className='materi-chat-jp-row'>
            <span className='materi-chat-jp' lang='ja'>{msg.jp}</span>
            {!live && (
              <div className='materi-chat-msg-actions'>
                {speechSupported && (
                  <button
                    type='button'
                    className='materi-chat-speak-btn'
                    onClick={() => handleSpeakBot(msg.jp)}
                    aria-label={t('sentenceExerciseListen')}
                    title={t('sentenceExerciseListen')}
                  >
                    <Icon name='volume' />
                  </button>
                )}
                {hasHelp && (
                  <button
                    type='button'
                    className={`materi-chat-help-btn stage-${stage} ${isHelpActive ? 'active' : ''}`}
                    onClick={() => toggleMessageHelp(msg.id)}
                    aria-label={isHelpActive ? t('chatHelpHide') : t('chatHelpShow')}
                    aria-expanded={isHelpActive}
                    title={isHelpActive ? t('chatHelpHide') : t('chatHelpShow')}
                  >
                    <Icon name='help-circle' />
                  </button>
                )}
              </div>
            )}
          </div>
          {hasHelp && ((isRomajiVisible && msg.romaji) || (isMeaningVisible && meaning)) && (
            <div className='materi-chat-help-details'>
              {isRomajiVisible && msg.romaji && <div className='materi-chat-romaji'>{msg.romaji}</div>}
              {isMeaningVisible && meaning && <div className='materi-chat-meaning'>{meaning}</div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className='materi-chat'>
      <div className='materi-chat-header'>
        <div className='materi-chat-header-avatar' title='Sora-chan'>
          <img src={soraAvatar} alt='Sora-chan' />
        </div>
        <div className='materi-chat-header-info'>
          <span className='materi-chat-header-name'>Sora-chan 🌸</span>
          <span className='materi-chat-header-status'>
            {loading ? t('chatTyping') : 'Online'}
          </span>
        </div>
        <div className='materi-chat-header-actions'>
          <button
            type='button'
            className='materi-chat-header-btn'
            onClick={handleReset}
            title={t('chatClearHistory')}
            aria-label={t('chatClearHistory')}
          >
            <Icon name='trash' />
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className='materi-chat-banner' role='alert'>
          <Icon name='bell' />
          <span>{t(errorNotice)}</span>
          <button
            type='button'
            className='materi-chat-banner-dismiss'
            onClick={() => setErrorNotice(null)}
            aria-label={t('aboutClose')}
          >
            <Icon name='x' />
          </button>
        </div>
      )}

      <div className='materi-chat-thread' ref={threadRef} aria-live='polite'>
        {messages.map(msg => (msg.sender === 'bot'
          ? renderBotBubble(msg)
          : renderUserBubble(msg)))}

        {loading && streaming && streaming.jp
          ? renderBotBubble(streaming, { live: true })
          : loading && (
            <div className='materi-chat-msg bot'>
              <div className='materi-chat-bubble typing' aria-label={t('chatTyping')}>
                <span className='dot' />
                <span className='dot' />
                <span className='dot' />
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {showHelpPanel && (
        <div className='materi-chat-help-panel' role='region' aria-label={t('chatHelpPanelTitle')}>
          <div className='materi-chat-help-panel-header'>
            <div className='materi-chat-help-panel-title'>
              <Icon name='help-circle' />
              <span>{t('chatHelpPanelTitle')}</span>
            </div>
            <button
              type='button'
              className='materi-chat-help-panel-close'
              onClick={() => setShowHelpPanel(false)}
              aria-label={t('aboutClose')}
            >
              <Icon name='x' />
            </button>
          </div>

          <div className='materi-chat-help-section'>
            <div className='materi-chat-help-section-title'>{t('chatHelpQuickPhrases')}</div>
            <div className='materi-chat-phrase-grid'>
              {quickReplies.map(phrase => (
                <button
                  key={phrase.jp}
                  type='button'
                  className='materi-chat-phrase-chip'
                  onClick={() => handlePickPhrase(phrase.jp)}
                  title={phrase[language] || phrase.en}
                >
                  <span className='materi-chat-phrase-jp' lang='ja'>{phrase.jp}</span>
                  <span className='materi-chat-phrase-meaning'>{phrase[language] || phrase.en}</span>
                </button>
              ))}
            </div>
          </div>

          <div className='materi-chat-help-section'>
            <div className='materi-chat-help-section-title'>{t('chatHelpTypingGuide')}</div>
            <p className='materi-chat-help-tips-text'>{t('chatHelpTypingDetail')}</p>
          </div>

          <div className='materi-chat-help-footer'>
            <div className='materi-chat-help-toggles'>
              <button
                type='button'
                className={`materi-chat-help-toggle-btn ${autoKana ? 'active' : ''}`}
                onClick={toggleAutoKana}
                aria-pressed={autoKana}
              >
                <Icon name={autoKana ? 'check' : 'type'} />
                <span>{t('chatToggleAutoKana')}</span>
              </button>
              <button
                type='button'
                className={`materi-chat-help-toggle-btn ${showRomaji ? 'active' : ''}`}
                onClick={toggleShowRomaji}
                aria-pressed={showRomaji}
              >
                <Icon name={showRomaji ? 'check' : 'help-circle'} />
                <span>{t('chatToggleRomaji')}</span>
              </button>
              <button
                type='button'
                className={`materi-chat-help-toggle-btn ${showMeaning ? 'active' : ''}`}
                onClick={toggleShowMeaning}
                aria-pressed={showMeaning}
              >
                <Icon name={showMeaning ? 'check' : 'help-circle'} />
                <span>{t('chatToggleMeaning')}</span>
              </button>
              <button
                type='button'
                className={`materi-chat-help-toggle-btn ${useN5Kanji ? 'active' : ''}`}
                onClick={toggleUseN5Kanji}
                aria-pressed={useN5Kanji}
              >
                <Icon name={useN5Kanji ? 'check' : 'help-circle'} />
                <span>{t('chatToggleN5Kanji')}</span>
              </button>
            </div>
            <div className='materi-chat-help-actions-row'>
              <button
                type='button'
                className='materi-chat-help-clear-btn'
                onClick={handleReset}
                title={t('chatClearHistory')}
              >
                <Icon name='trash' />
                <span>{t('chatClearHistory')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <form className='materi-chat-composer' onSubmit={handleSubmit}>
        <button
          type='button'
          className={`materi-chat-composer-help-btn ${showHelpPanel ? 'active' : ''}`}
          onClick={() => setShowHelpPanel(prev => !prev)}
          title={t('chatHelp')}
          aria-label={t('chatHelp')}
          aria-expanded={showHelpPanel}
        >
          <Icon name='help-circle' />
        </button>
        <textarea
          ref={inputRef}
          rows={1}
          className='materi-chat-input'
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={t('chatInputPlaceholder')}
          disabled={loading || !aiAvailable}
          autoComplete='off'
          lang='ja'
        />
        <button
          type='submit'
          className='materi-chat-send-btn'
          disabled={!input.trim() || loading || !aiAvailable}
          aria-label={t('chatSend')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Icon name='send' />
        </button>
      </form>
    </div>
  );
}
