import React, { useState } from 'react'
import CheckMark from './CheckMark';
import { useLanguage } from '../i18n';

// A row of mutually exclusive practice or answer modes.
function SegmentedControl(props) {
  return (
    <div className={`segmented-row${props.className ? ` ${props.className}` : ''}`}>
      <span className='segmented-label'>{props.label}</span>
      <div className='segmented-control' role='radiogroup' aria-label={props.label}>
        {props.options.map((option) => (
          <button
            key={option.value}
            type='button'
            role='radio'
            aria-checked={props.value === option.value}
            className={'segmented-option' + (props.value === option.value ? ' active' : '')}
            disabled={option.disabled}
            title={option.disabled ? option.disabledReason : undefined}
            onClick={() => props.onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GameModeSelector(props) {
  const { t } = useLanguage();
  // Checks if the current device has a touchscreen
  const touchDefault = ('ontouchstart' in window | navigator.msMaxTouchPoints) === 1;
  if (localStorage.getItem('game-mode-kanji-readings') === null) {
    const showReadings =
      localStorage.getItem('game-mode-kanji-onyomi') === 'true' ||
      localStorage.getItem('game-mode-kanji-kunyomi') === 'true';
    localStorage.setItem('game-mode-kanji-readings', String(showReadings));
  }

  const [practice, setPractice] = useState(() => {
    const stored = localStorage.getItem('game-mode-practice') ||
      (localStorage.getItem("game-mode-word") === "true" ? "words" : "characters");
    // "kanji" and "srs" used to be practice types: kanji now come with "characters"
    // and SRS reviews are started from the menu (review banner / Kanji tab)
    return ['words', 'mixed', 'long'].includes(stored) ? stored : 'characters';
  });
  const [answerBy, setAnswerBy] = useState(() => {
    const storedTouch = localStorage.getItem("game-mode-touch");
    const useTouch = storedTouch === null ? touchDefault : storedTouch === "true";
    return useTouch && !['words', 'mixed', 'long'].includes(practice) ? "touch" : "typing";
  });

  React.useEffect(() => {
    localStorage.setItem("game-mode-practice", practice);
    localStorage.setItem("game-mode-srs", "false");
    localStorage.setItem("game-mode-word", practice === "words");
    if (['words', 'mixed', 'long'].includes(practice) && answerBy === 'touch') {
      setAnswerBy('typing');
    }
    localStorage.setItem("game-mode-touch", answerBy === "touch");
    if (props.onChange) {
      props.onChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practice, answerBy]);

  const handlePracticeChange = (value) => {
    setPractice(value);
    if (['words', 'mixed', 'long'].includes(value)) {
      setAnswerBy("typing");
    }
  };

  // Session length: a number of kanas, a number of minutes or unlimited.
  // Stored as gameMode = { type: "kana-selector" | "time-selector", value }, value -1 means unlimited
  const [limit, setLimit] = useState(() => {
    let gameMode = null;
    try {
      gameMode = JSON.parse(localStorage.getItem("gameMode"));
    } catch (e) { }
    const isTime = gameMode?.type === "time-selector";
    const isUnlimited = !gameMode || (!isTime && gameMode.value === -1);
    const storedValue = Number(gameMode?.value) > 0 ? Number(gameMode.value) : 5;
    return {
      type: isUnlimited ? "unlimited" : isTime ? "time" : "count",
      count: !isUnlimited && !isTime ? storedValue : 5,
      minutes: isTime ? storedValue : 5,
    };
  });

  React.useEffect(() => {
    localStorage.setItem("gameMode", JSON.stringify(
      limit.type === "time"
        ? { type: "time-selector", value: limit.minutes }
        : { type: "kana-selector", value: limit.type === "count" ? limit.count : -1 }
    ));
  }, [limit]);

  // Kanas go up in steps of 5 until 50 and in steps of 10 after that, minutes in steps of 1
  const changeLimit = (direction) => {
    setLimit(current => {
      if (current.type === "time") {
        return { ...current, minutes: Math.max(1, current.minutes + direction) };
      }
      const step = current.count > 50 || (current.count === 50 && direction > 0) ? 10 : 5;
      return { ...current, count: Math.max(5, current.count + direction * step) };
    });
  };

  return (
    <div className='game-mode-selector-group'>
      <h2>{t('modeTitle')}</h2>
      <div className='game-mode-selector-segments'>
        <div className='limit-setting'>
          <SegmentedControl
            label={t('limitLabel')}
            value={limit.type}
            onChange={(type) => setLimit(current => ({ ...current, type }))}
            options={[
              { value: "count", label: t('limitCount') },
              { value: "time", label: t('limitTime') },
              { value: "unlimited", label: t('modeUnlimited') },
            ]}
          />
          {limit.type !== "unlimited" && (
            <div className='limit-stepper'>
              <button type='button' aria-label={t('limitDecrease')} onClick={() => changeLimit(-1)}>−</button>
              <span aria-live='polite'>
                {limit.type === "time"
                  ? t('modeMinutes', { count: limit.minutes })
                  : t('modeKanaCount', { count: limit.count })}
              </span>
              <button type='button' aria-label={t('limitIncrease')} onClick={() => changeLimit(1)}>+</button>
            </div>
          )}
        </div>
        <SegmentedControl
          className='practice-mode-row'
          label={t('practiceLabel')}
          value={practice}
          onChange={handlePracticeChange}
          options={[
            { value: "characters", label: t('practiceCharacters') },
            { value: "words", label: t('practiceWords') },
            { value: "mixed", label: t('practiceMixed') },
            { value: "long", label: t('practiceLong') },
          ]}
        />
        <SegmentedControl
          className='answer-mode-row'
          label={t('answerByLabel')}
          value={answerBy}
          onChange={setAnswerBy}
          options={[
            { value: "typing", label: t('answerTyping') },
            { value: "touch", label: t('answerMultipleChoice'), disabled: ['words', 'mixed', 'long'].includes(practice), disabledReason: t('answerMultipleChoiceDisabled') },
          ]}
        />
      </div>
      <div className='game-mode-selector-button-group'>
        <CheckMark characterText={t('optionHints')} class="game-mode-selector-button-group-row-2" id="game-mode-hints" default="true"/>
        <CheckMark characterText={t('optionHandwrittenFonts')} class="game-mode-selector-button-group-row-2" id="game-mode-random-fonts"/>
        <CheckMark characterText={t('optionAutoNext')} class="game-mode-selector-button-group-row-2" id="game-mode-auto-next" default="true"/>
        <CheckMark characterText={t('kanjiReadingsOption')} class="game-mode-selector-button-group-row-2" id="game-mode-kanji-readings"/>
      </div>
    </div>
  )
}
