// File: src/pages/ChatPage.jsx
import React, { useState } from 'react';
import { useTwin } from '../context/TwinContext';
import Chat from '../components/domain/Chat';
import { askGPT } from '../api/gptClient';
import { supabase } from '../lib/supabaseClient';

// Pflichtfelder pro Event-Typ
const requiredFields = {
  feature: ['title', 'status', 'prio'],
  system: ['name', 'status', 'description']
};

export default function ChatPage() {
  const { state, dispatch } = useTwin();
  const [pendingEvent, setPendingEvent] = useState(null);

  const send = async (text) => {
    dispatch({ type: 'PUSH_CHAT', payload: { role: 'user', content: text } });

    // Wenn wir auf Feldabfrage warten
    if (pendingEvent && pendingEvent.awaitField) {
      // Speichere Feld-Wert
      const { awaitField, data, eventType } = pendingEvent;
      data[awaitField] = text.trim();
      // Finde nächstes fehlendes Feld
      const fields = requiredFields[eventType] || [];
      const missing = fields.find(f => !data[f]);
      if (missing) {
        // Frage nächstes fehlendes Feld
        dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: `Bitte gib den Wert für \`${missing}\` an:` } });
        setPendingEvent({ ...pendingEvent, data, awaitField: missing });
      } else {
        // Alle Felder beisammen: Speichern
        await saveEvent(pendingEvent.eventType, data);
        setPendingEvent(null);
      }
      return;
    }

    // Wenn GPT-Flow: Erkennung und erste Daten
    try {
      const { eventDetected, eventType, data, chatResponse } = await askGPT(text, state.chat);
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: chatResponse } });
      if (eventDetected) {
        const fields = requiredFields[eventType] || [];
        // Direkt vorhandene Werte ins data übernehmen, andere abfragen
        const present = Object.keys(data);
        const missing = fields.find(f => !present.includes(f));
        if (missing) {
          dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: `Bitte gib den Wert für \`${missing}\` an:` } });
          setPendingEvent({ eventType, data, awaitField: missing });
        } else {
          // Alles da
          await saveEvent(eventType, data);
        }
      }
    } catch (err) {
      console.error('Send-Error', err);
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: 'Entschuldigung, da ist ein Fehler aufgetreten.' } });
    }
  };

  const saveEvent = async (eventType, data) => {
    const table = eventType === 'feature' ? 'features' : 'systemComponents';
    const { data: insertResult, error } = await supabase.from(table).insert([data]).single();
    if (error) {
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: `Fehler beim Speichern: ${error.message}` } });
    } else {
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: '👍 Dein Eintrag wurde gespeichert!' } });
      await supabase.from('changes').insert([{ source: 'ui', type: 'create', message: `Angelegt via Chat: ${eventType}`, relatedComponentId: insertResult.id }]);
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
