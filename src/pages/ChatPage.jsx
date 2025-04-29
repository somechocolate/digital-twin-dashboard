// src/pages/ChatPage.jsx
import React from 'react';
import { useTwin } from '../context/TwinContext';
import Chat from '../components/domain/Chat';
import { askGPT } from '../api/gpt';

export default function ChatPage() {
  const { state, dispatch } = useTwin();

  const send = async (text) => {
    dispatch({ type: 'PUSH_CHAT', payload: { role: 'user', content: text } });

    try {
      const { summary } = await askGPT(text, state.chat);
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: summary } });
    } catch (error) {
      console.error('Fehler beim Senden:', error);

    }
  };

  const upload = async (file) => {
    dispatch({ type: 'SET_UPLOAD', payload: file.name });
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const { summary } = await res.json();
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: summary } });
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
    }

    dispatch({ type: 'SET_UPLOAD', payload: null });

    return (
      <Chat
        chatHistory={state.chat}
        onSendMessage={send}
        onUpload={upload}
        uploadingFile={state.uploading}
      />
    );
  }
}
