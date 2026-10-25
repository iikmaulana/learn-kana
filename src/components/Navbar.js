import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LANGUAGES, useLanguage } from '../i18n';
import { ROUTES } from '../routes';
import Icon from './Icon';
import NotificationMenu from './NotificationMenu';
import SettingsDialog from './SettingsDialog';
import AboutDialog, { GitHubMark } from './AboutDialog';

const NAVBAR_TABS = [
  { to: ROUTES.menu, icon: 'gamepad', label: 'tabGames', mobileText: 'Game', key: 'games' },
  { to: ROUTES.dictionary, icon: 'book-open', label: 'tabDictionary', key: 'dictionary' },
  { to: ROUTES.materi, icon: 'graduation-cap', label: 'tabMateri', key: 'materi' },
  { to: ROUTES.chat, icon: 'message-square', label: 'tabChat', key: 'chat' },
];

export default function Navbar({ theme, toggleTheme }) {
  const { language, setLanguage, t } = useLanguage();
  const darkMode = theme === 'dark';
  const [aboutOpen, setAboutOpen] = useState(false);
  const closeAbout = useCallback(() => setAboutOpen(false), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // The navbar stays on screen (sticky, see App.css): pages start their own
  // sticky blocks below its measured height, through --navbar-height
  const navRef = useRef(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const measure = () =>
      document.documentElement.style.setProperty('--navbar-height', `${nav.offsetHeight}px`);
    measure();
    // jsdom has no ResizeObserver; browsers get the remount on font loading,
    // text wrapping and rotations through it
    if (typeof ResizeObserver === 'undefined') return () => { };
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  // Code snippet for the PWA install button
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      <nav className='navbar' ref={navRef}>
        <div className='navbar-brand'>
          <span className='navbar-title'>日本語</span>
        </div>
        {/* The app's tabs: the practice menu (Games), the Dictionary, Materials, Chat */}
        <div className='segmented-control navbar-tabs' aria-label={t('navbarTabs')}>
          {NAVBAR_TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                'segmented-option navbar-tab navbar-tab-' + tab.key + (isActive ? ' active' : '')
              }
            >
              <Icon name={tab.icon} />
              {tab.mobileText ? (
                <>
                  <span className='navbar-tab-label-desktop'>{t(tab.label)}</span>
                  <span className='navbar-tab-label-mobile'>{tab.mobileText}</span>
                </>
              ) : (
                <span>{t(tab.label)}</span>
              )}
            </NavLink>
          ))}
          {/* Mobile only: Settings tab in bottom bar. Hidden on desktop via CSS */}
          <button
            type='button'
            className='segmented-option navbar-tab navbar-tab-settings-mobile'
            aria-label={t('navbarSettings')}
            onClick={() => setSettingsOpen(true)}
          >
            <Icon name='settings' />
            <span>Setting</span>
          </button>
        </div>
        <div className='navbar-actions'>
          {/* Mobile only: Notifications in header. Hidden on desktop via CSS */}
          <div className='navbar-notif-mobile'>
            <NotificationMenu />
          </div>

          {/* Desktop only: separate controls as originally arranged. Hidden on mobile via CSS */}
          <div className='navbar-desktop-actions'>
            <NotificationMenu />
            <button
              type='button'
              className='navbar-theme-toggle'
              aria-label={darkMode ? t('navbarLightMode') : t('navbarDarkMode')}
              aria-pressed={darkMode}
              title={darkMode ? t('navbarLightMode') : t('navbarDarkMode')}
              onClick={toggleTheme}
            >
              <Icon name={darkMode ? 'sun' : 'moon'} />
            </button>
            <div className='segmented-control navbar-language' role='radiogroup' aria-label={t('navbarLanguage')}>
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
            {deferredPrompt && (
              <button className='navbar-install' onClick={handleInstallClick} aria-label={t('navbarInstall')} title={t('navbarInstall')}>
                <Icon name='download' />
                <span className='navbar-install-label'>{t('navbarInstall')}</span>
              </button>
            )}
            {/* About the app: open source, its repository and the project it was forked from */}
            <button
              type='button'
              className='github-icon'
              onClick={() => setAboutOpen(true)}
              aria-haspopup='dialog'
              aria-label={t('navbarAbout')}
              title={t('navbarAbout')}
            >
              <GitHubMark />
            </button>
          </div>
        </div>
      </nav>
      {aboutOpen && <AboutDialog onClose={closeAbout} />}
      {settingsOpen && (
        <SettingsDialog
          onClose={closeSettings}
          theme={theme}
          toggleTheme={toggleTheme}
          deferredPrompt={deferredPrompt}
          onInstall={handleInstallClick}
        />
      )}
    </>
  );
}
