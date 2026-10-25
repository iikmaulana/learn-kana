import React from 'react';
import { useLanguage } from '../i18n';
import MateriChat from '../components/MateriChat';

// The Chat tab: a free conversation with the AI tutor, next to the Materials
// in the navbar
export default function Chat() {
  const { t } = useLanguage();
  return (
    <main className='materi-page'>
      <h1 id='chat-title'>{t('tabChat')}</h1>
      <MateriChat />
    </main>
  );
}
