import React, { useState, useEffect, useRef } from 'react';
import { toKana, toRomaji } from 'wanakana';
import { useLanguage } from '../i18n.js';
import Icon from './Icon.js';
import { speak, isSpeechSupported } from '../speech.js';
import { hasGeminiKey, sendGeminiMessage, parseGeminiReply } from '../services/geminiChat.js';
import { hasElevenLabsKey, playBotSpeech, playUserSpeech, stopElevenLabsAudio } from '../services/elevenlabs.js';
import { lookupUserMeaning, resolveUserMeaning } from '../services/userMeaning.js';

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
  jp: 'こんにちは！おなまえはなんですか。',
  romaji: 'konnichiwa! onamae wa nan desu ka.',
  meaningKey: 'chatOpeningMeaning',
};

const QUICK_PHRASES = [
  { jp: 'はい、そうです', id: 'Ya, benar', en: "Yes, that's right" },
  { jp: 'いいえ、ちがいます', id: 'Bukan, salah', en: "No, that's wrong" },
  { jp: 'わかりません', id: 'Saya tidak mengerti', en: "I don't understand" },
  { jp: 'もういちど おねがいします', id: 'Tolong sekali lagi', en: 'Once more, please' },
  { jp: 'ありがとうございます', id: 'Terima kasih banyak', en: 'Thank you very much' },
  { jp: 'だいじょうぶです', id: 'Tidak apa-apa', en: "It's fine" },
  { jp: 'おなまえは？', id: 'Siapa namamu?', en: 'What is your name?' },
  { jp: 'にほんごを べんきょうしています', id: 'Sedang belajar bhs Jepang', en: 'I am studying Japanese' },
];

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

  const [messages, setMessages] = useState(() => [createOpening()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(null);
  const [errorNotice, setErrorNotice] = useState(aiAvailable ? null : 'chatAiNoKeyNotice');
  const [revealedMessages, setRevealedMessages] = useState({});
  const [showHelpPanel, setShowHelpPanel] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  // The conversation a pending reply belongs to: a restart drops late replies
  const conversationRef = useRef(0);
  const speechSupported = isSpeechSupported() || hasElevenLabsKey();

  useEffect(() => {
    return () => {
      stopElevenLabsAudio();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, streaming]);

  const handleInputChange = (e) => {
    const converted = toKana(e.target.value, { IMEMode: true });
    setInput(converted);
  };

  const handlePickPhrase = (phraseText) => {
    setInput(prev => (prev ? `${prev} ${phraseText}` : phraseText));
    inputRef.current?.focus();
  };

  const handleSend = async (rawText) => {
    const text = toKana((rawText || '').trim());
    if (!text || loading) return;
    if (!aiAvailable) {
      setErrorNotice('chatAiNoKeyNotice');
      return;
    }

    setErrorNotice(null);
    setInput('');
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
    conversationRef.current += 1;
    setMessages([createOpening()]);
    setStreaming(null);
    setLoading(false);
    setInput('');
    setRevealedMessages({});
    setShowHelpPanel(false);
    setErrorNotice(aiAvailable ? null : 'chatAiNoKeyNotice');
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

  const toggleMessageHelp = (msgId) => {
    setRevealedMessages((prev) => {
      const current = prev[msgId] || 0;
      const nextStage = (current + 1) % 3;
      if (nextStage === 0) {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      }
      return { ...prev, [msgId]: nextStage };
    });
  };

  const allHelpVisible = messages.length > 0 && messages.every(msg => (revealedMessages[msg.id] || 0) === 2);

  const toggleAllHelp = () => {
    if (messages.some(msg => (revealedMessages[msg.id] || 0) > 0)) {
      setRevealedMessages({});
      return;
    }
    const next = {};
    messages.forEach((msg) => { next[msg.id] = 2; });
    setRevealedMessages(next);
  };

  const meaningTextOf = msg => msg.aiMeaning || (msg.meaningKey ? t(msg.meaningKey) : null);

  const renderUserBubble = (msg) => {
    const stage = revealedMessages[msg.id] || 0;
    const romaji = toRomaji(msg.text);
    const meaning = msg.meaning;

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
                  className={`materi-chat-help-btn user stage-${stage} ${stage > 0 ? 'active' : ''}`}
                  onClick={() => toggleMessageHelp(msg.id)}
                  aria-label={stage > 0 ? t('chatHelpHide') : t('chatHelpShow')}
                  aria-expanded={stage > 0}
                  title={stage === 1 ? (meaning ? 'Tampilkan arti' : t('chatHelpHide')) : stage === 2 ? t('chatHelpHide') : t('chatHelpShow')}
                >
                  <Icon name='help-circle' />
                  <span>{t('chatHelp')}</span>
                </button>
              )}
            </div>
          </div>
          {stage > 0 && romaji && (
            <div className='materi-chat-help-details user'>
              <div className='materi-chat-romaji'>{romaji}</div>
              {stage === 2 && meaning && <div className='materi-chat-meaning user'>{meaning}</div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBotBubble = (msg, { live = false } = {}) => {
    const meaning = meaningTextOf(msg);
    const hasHelp = !live && Boolean(msg.romaji || meaning);
    const stage = revealedMessages[msg.id] || 0;
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
                    className={`materi-chat-help-btn stage-${stage} ${stage > 0 ? 'active' : ''}`}
                    onClick={() => toggleMessageHelp(msg.id)}
                    aria-label={stage > 0 ? t('chatHelpHide') : t('chatHelpShow')}
                    aria-expanded={stage > 0}
                    title={stage === 1 ? (meaning ? 'Tampilkan arti' : t('chatHelpHide')) : stage === 2 ? t('chatHelpHide') : t('chatHelpShow')}
                  >
                    <Icon name='help-circle' />
                    <span>{t('chatHelp')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
          {stage > 0 && hasHelp && (
            <div className='materi-chat-help-details'>
              {msg.romaji && <div className='materi-chat-romaji'>{msg.romaji}</div>}
              {stage === 2 && meaning && <div className='materi-chat-meaning'>{meaning}</div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className='materi-chat'>
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

      <div className='materi-chat-thread' aria-live='polite'>
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
              {QUICK_PHRASES.map(phrase => (
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
            <button
              type='button'
              className={`materi-chat-help-toggle-all-btn ${allHelpVisible ? 'active' : ''}`}
              onClick={toggleAllHelp}
            >
              <Icon name='help-circle' />
              <span>{allHelpVisible ? t('chatHelpHideAll') : t('chatHelpShowAll')}</span>
            </button>
          </div>
        </div>
      )}

      <form className='materi-chat-composer' onSubmit={handleSubmit}>
        <button
          type='button'
          className='materi-chat-reset-btn'
          onClick={handleReset}
          title={t('chatReset')}
          aria-label={t('chatReset')}
        >
          <Icon name='shuffle' />
        </button>
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
        <input
          ref={inputRef}
          type='text'
          className='materi-chat-input'
          value={input}
          onChange={handleInputChange}
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
        >
          <Icon name='send' />
        </button>
      </form>
    </div>
  );
}
