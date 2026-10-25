import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../i18n';
import { getBunpouLessons, getParticleLessons } from '../materi';

// The section open (particles or grammar), kept while the user is on the
// Games tab or in a game, like the search of the Dictionary
const SECTION_KEY = 'materi-section';

const SECTIONS = [
  { value: 'particles', label: 'materiParticles' },
  { value: 'bunpou', label: 'materiBunpou' },
];

const INTROS = {
  particles: 'materiParticlesIntro',
  bunpou: 'materiBunpouIntro',
};

function readSection() {
  try {
    const saved = sessionStorage.getItem(SECTION_KEY);
    return SECTIONS.some(option => option.value === saved) ? saved : 'particles';
  } catch (error) {
    return 'particles';
  }
}

// One lesson of the list: the particle or the form big, its note, and the
// sentences of the corpus that show it
function Lesson({ lesson, isForm }) {
  const { t, meaningOf } = useLanguage();
  return (
    <li className={'materi-entry' + (isForm ? ' materi-entry-form' : '')}>
      <div className='materi-entry-character' lang='ja'>{lesson.jp}</div>
      <div className='materi-entry-body'>
        <div className='materi-entry-romaji'>{lesson.romaji}</div>
        <p className='materi-entry-note'>{t(lesson.note)}</p>
        {lesson.examples.length > 0 && (
          <ul className='materi-entry-sentences' aria-label={t('materiExamples')}>
            {lesson.examples.map(sentence => (
              <li key={sentence.jp_character}>
                <span lang='ja'>{sentence.jp_character}</span>
                <span className='materi-entry-sentence-romaji'>{sentence.romanji[0]}</span>
                <span className='materi-entry-sentence-meaning'>{meaningOf(sentence.jp_character, sentence.meaning)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

// The Materials tab: the particles and the grammar (bunpou) of the practice,
// as lessons with example sentences
export default function Materi() {
  const { t } = useLanguage();
  const [section, setSection] = useState(readSection);
  const lessons = useMemo(() => section === 'bunpou' ? getBunpouLessons() : getParticleLessons(), [section]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SECTION_KEY, section);
    } catch (error) { }
  }, [section]);

  return (
    <>
      <main className='materi-page'>
        <h1 id='materi-title'>{t('materiTitle')}</h1>
        {/* The section filter stays at the top while the lessons scroll */}
        <div className='materi-controls'>
          <div className='segmented-control materi-filter' role='radiogroup' aria-label={t('materiFilter')}>
            {SECTIONS.map(option => (
              <button
                key={option.value}
                type='button'
                role='radio'
                aria-checked={section === option.value}
                className={'segmented-option' + (section === option.value ? ' active' : '')}
                onClick={() => setSection(option.value)}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        </div>
        <p className='materi-intro'>{t(INTROS[section] || 'materiParticlesIntro')}</p>
        <ul className='materi-list'>
          {lessons.map(lesson => (
            <Lesson key={lesson.jp} lesson={lesson} isForm={section === 'bunpou'} />
          ))}
        </ul>
      </main>
    </>
  );
}
