// File: src/pages/ChatPage.jsx
import React, { useState } from 'react';
import { useTwin } from '../context/TwinContext';
import Chat from '../components/domain/Chat';
import { askGPT } from '../api/gptClient';
import { supabase } from '../lib/supabaseClient';

export default function ChatPage() {
  const { state, dispatch } = useTwin();
  const [pendingEvent, setPendingEvent] = useState(null);

  const send = async (text) => {
    dispatch({ type: 'PUSH_CHAT', payload: { role: 'user', content: text } });

    // Handle confirmation for detected events
    if (pendingEvent) {
      const answer = text.trim().toLowerCase();
      if (answer === 'ja') {
        const table = pendingEvent.eventType === 'feature'
          ? 'features'
          : 'systemComponents';
        const { data: insertResult, error } = await supabase
          .from(table)
          .insert([pendingEvent.data])
          .single();
        if (error) {
          dispatch({
            type: 'PUSH_CHAT',
            payload: { role: 'assistant', content: `Fehler beim Speichern: ${error.message}` }
          });
        } else {
          dispatch({
            type: 'PUSH_CHAT',
            payload: { role: 'assistant', content: '👍 Dein Eintrag wurde gespeichert!' }
          });
          await supabase.from('changes').insert([{
            source: 'ui',
            type: 'create',
            message: `Angelegt via Chat: ${pendingEvent.eventType}`,
            relatedComponentId: insertResult.id
          }]);
        }
      } else {
        dispatch({
          type: 'PUSH_CHAT',
          payload: { role: 'assistant', content: 'Alles klar, ich verwerfe den Vorschlag.' }
        });
      }
      setPendingEvent(null);
      return;
    }

    try {
      const { eventDetected, eventType, data, chatResponse } = await askGPT(text, state.chat);

      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: chatResponse } });

      if (eventDetected) {
        dispatch({
          type: 'PUSH_CHAT',
          payload: {
            role: 'assistant',
            content:
              `Ich habe erkannt, dass du ein neues ${eventType} anlegen könntest:\n` +
              '```json\n' + JSON.stringify(data, null, 2) + '\n```' +
              '\nSoll ich das speichern? (ja/nein)'
          }
        });
        setPendingEvent({ eventType, data });
      }
    } catch (err) {
      console.error('Send-Error', err);
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: 'Entschuldigung, da ist ein Fehler aufgetreten.' }
      });
    }
  };

  const upload = async (file) => {
    dispatch({ type: 'SET_UPLOAD', payload: file.name });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const { summary } = await res.json();
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: summary } });
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: 'Upload fehlgeschlagen.' } });
    } finally {
      dispatch({ type: 'SET_UPLOAD', payload: null });
    }
  };

  return (
    <Chat
      chatHistory={state.chat}
      onSendMessage={send}
      onUpload={upload}
      uploadingFile={state.uploading}
    />
  );
}