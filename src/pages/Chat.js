import React, { useEffect } from 'react';
import MateriChat from '../components/MateriChat';

// The Chat tab: a free conversation with the AI tutor, next to the Materials
// in the navbar
export default function Chat() {
  useEffect(() => {
    document.documentElement.classList.add('chat-page-active');
    document.body.classList.add('chat-page-active');
    return () => {
      document.documentElement.classList.remove('chat-page-active');
      document.body.classList.remove('chat-page-active');
    };
  }, []);

  return (
    <main className='materi-page chat-page'>
      <MateriChat />
    </main>
  );
}
