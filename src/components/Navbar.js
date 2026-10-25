import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { ROUTES } from '../routes';
import Icon from './Icon';
import NotificationMenu from './NotificationMenu';
import SettingsDialog from './SettingsDialog';

const NAVBAR_TABS = [
  { to: ROUTES.menu, icon: 'gamepad', label: 'tabGames' },
  { to: ROUTES.dictionary, icon: 'book-open', label: 'tabDictionary' },
  { to: ROUTES.materi, icon: 'graduation-cap', label: 'tabMateri' },
  { to: ROUTES.chat, icon: 'message-square', label: 'tabChat' },
];

export default function Navbar({ theme, toggleTheme }) {
  const { t } = useLanguage();
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
        {/* The app's tabs: the practice menu (Games), the Dictionary, the Materials, Chat and Notifications */}
        <div className='segmented-control navbar-tabs' aria-label={t('navbarTabs')}>
          {NAVBAR_TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) => 'segmented-option navbar-tab' + (isActive ? ' active' : '')}
            >
              <Icon name={tab.icon} />
              <span>{t(tab.label)}</span>
            </NavLink>
          ))}
          {/* Desktop: Notifications in tab bar. Hidden on mobile via CSS */}
          <div className='navbar-tab-notif-desktop'>
            <NotificationMenu />
          </div>
          {/* Mobile only: Settings tab in bottom bar. Hidden on desktop via CSS */}
          <button
            type='button'
            className='segmented-option navbar-tab navbar-tab-settings-mobile'
            aria-label={t('navbarSettings')}
            onClick={() => setSettingsOpen(true)}
          >
            <Icon name='settings' />
            <span>{t('navbarSettings')}</span>
          </button>
        </div>
        <div className='navbar-actions'>
          {/* Desktop: Settings in header. Hidden on mobile via CSS */}
          <button
            type='button'
            className='navbar-settings-toggle navbar-icon-button navbar-settings-desktop'
            aria-label={t('navbarSettings')}
            title={t('navbarSettings')}
            onClick={() => setSettingsOpen(true)}
          >
            <Icon name='settings' />
          </button>
          {/* Mobile only: Notifications in header. Hidden on desktop via CSS */}
          <div className='navbar-notif-mobile'>
            <NotificationMenu />
          </div>
        </div>
      </nav>
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
