import React, { useEffect, useRef } from 'react';
import { LANGUAGES, useLanguage } from '../i18n';
import Icon from './Icon';
import { GitHubMark, REPOSITORY, UPSTREAM_REPOSITORY } from './AboutDialog';

const repositoryUrl = ({ owner, name }) => `https://github.com/${owner}/${name}`;

export default function SettingsDialog({ onClose, theme, toggleTheme, deferredPrompt, onInstall }) {
  const { language, setLanguage, t } = useLanguage();
  const closeButtonRef = useRef(null);
  const darkMode = theme === 'dark';

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className='settings-dialog-background' onClick={onClose}>
      <div
        className='settings-dialog'
        role='dialog'
        aria-modal='true'
        aria-labelledby='settings-dialog-title'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='settings-dialog-header'>
          <h2 id='settings-dialog-title'>{t('settingsTitle')}</h2>
          <button
            type='button'
            ref={closeButtonRef}
            className='settings-dialog-close'
            onClick={onClose}
            aria-label={t('aboutClose')}
          >
            <Icon name='x' strokeWidth={2.5} />
          </button>
        </div>

        <div className='settings-section'>
          <label className='settings-section-label'>
            <Icon name={darkMode ? 'moon' : 'sun'} />
            <span>{t('settingsTheme')}</span>
          </label>
          <div className='segmented-control settings-segmented' role='radiogroup' aria-label={t('settingsTheme')}>
            <button
              type='button'
              role='radio'
              aria-checked={!darkMode}
              className={'segmented-option' + (!darkMode ? ' active' : '')}
              onClick={() => darkMode && toggleTheme()}
            >
              <Icon name='sun' />
              <span>{t('settingsThemeLight')}</span>
            </button>
            <button
              type='button'
              role='radio'
              aria-checked={darkMode}
              className={'segmented-option' + (darkMode ? ' active' : '')}
              onClick={() => !darkMode && toggleTheme()}
            >
              <Icon name='moon' />
              <span>{t('settingsThemeDark')}</span>
            </button>
          </div>
        </div>

        <div className='settings-section'>
          <label className='settings-section-label'>
            <Icon name='languages' />
            <span>{t('settingsLanguage')}</span>
          </label>
          <div className='segmented-control settings-segmented' role='radiogroup' aria-label={t('settingsLanguage')}>
            {LANGUAGES.map((option) => (
              <button
                key={option.code}
                type='button'
                role='radio'
                aria-checked={language === option.code}
                className={'segmented-option' + (language === option.code ? ' active' : '')}
                onClick={() => setLanguage(option.code)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {deferredPrompt && (
          <div className='settings-section'>
            <button
              type='button'
              className='settings-install-button glowButton'
              onClick={onInstall}
            >
              <Icon name='download' />
              <span>{t('navbarInstall')}</span>
            </button>
          </div>
        )}

        <div className='settings-section settings-about-section'>
          <label className='settings-section-label'>
            <Icon name='help-circle' />
            <span>{t('settingsAbout')}</span>
          </label>
          <div className='settings-about-header'>
            <span className='about-dialog-badge'>{t('aboutOpenSource')}</span>
          </div>
          <p className='settings-about-description'>{t('aboutDescription')}</p>

          <a className='about-dialog-repository' href={repositoryUrl(REPOSITORY)} target='_blank' rel='noreferrer'>
            <GitHubMark />
            <span className='about-dialog-repository-text'>
              <strong>{REPOSITORY.owner}/{REPOSITORY.name}</strong>
              <span>{t('aboutRepository')}</span>
            </span>
          </a>

          <p className='about-dialog-fork'>
            {t('aboutForkedFrom')}{' '}
            <a href={repositoryUrl(UPSTREAM_REPOSITORY)} target='_blank' rel='noreferrer'>
              {UPSTREAM_REPOSITORY.owner}/{UPSTREAM_REPOSITORY.name}
            </a>
            {t('aboutForkedFromAfter')}
          </p>

          <p className='about-dialog-links'>
            <a href={`${repositoryUrl(REPOSITORY)}/issues`} target='_blank' rel='noreferrer'>{t('aboutIssues')}</a>
            <span aria-hidden='true'> · </span>
            <a href={`${repositoryUrl(REPOSITORY)}/blob/main/LICENSE`} target='_blank' rel='noreferrer'>{t('aboutLicense')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
