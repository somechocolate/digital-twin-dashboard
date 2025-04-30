import React, { useState } from 'react';
import { useTwin } from '../context/TwinContext';
import Chat from '../components/domain/Chat';
import { askGPT } from '../api/gptClient';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Pflichtfelder pro Event-Typ
const requiredFields = {
  feature: ['title', 'status', 'prio'],
  system: ['name', 'status', 'description']
};

export default function ChatPage() {
  const { state, dispatch } = useTwin();
  const [pendingEvent, setPendingEvent] = useState(null);

  const send = async (text) => {
    // 1) User-Message pushen
    dispatch({ type: 'PUSH_CHAT', payload: { role: 'user', content: text } });

    // 2) Falls wir gerade im Feld-Dialog sind
    if (pendingEvent && pendingEvent.awaitField) {
      const { eventType, data, awaitField } = pendingEvent;
      data[awaitField] = text.trim();

      const missing = requiredFields[eventType].find(f => !data[f]);
      if (missing) {
        // nächstes Feld abfragen
        dispatch({
          type: 'PUSH_CHAT',
          payload: { role: 'assistant', content: `Bitte gib den Wert für \`${missing}\` an:` }
        });
        setPendingEvent({ eventType, data, awaitField: missing });
      } else {
        // alles komplett → speichern
        await saveEvent(eventType, data);
        setPendingEvent(null);
      }
      return;
    }

    // 3) Standard GPT-Call
    try {
      const { eventDetected, eventType, data, chatResponse } =
        await askGPT(text, state.chat);

      // 3a) Chat-Antwort pushen
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: chatResponse } });

      // 3b) Wenn GPT ein Feature-Vorschlag erkannt hat, sofort in Context & DB
      if (eventDetected && eventType === 'feature') {
        // Frontend-State
        dispatch({
          type: 'ADD_SUGGESTION',
          payload: {
            id: uuidv4(),
            entityType: 'feature',
            data,
            status: 'open'
          }
        });
      }

      // 3c) Falls GPT Felder abgefragt hat
      if (eventDetected) {
        const missing = requiredFields[eventType].find(f => !data[f]);
        if (missing) {
          dispatch({
            type: 'PUSH_CHAT',
            payload: { role: 'assistant', content: `Bitte gib den Wert für \`${missing}\` an:` }
          });
          setPendingEvent({ eventType, data, awaitField: missing });
        } else {
          // sind alle Infos da? dann speichern
          await saveEvent(eventType, data);
        }
      }

    } catch (err) {
      console.error(err);
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: 'Entschuldigung, da ist ein Fehler aufgetreten.' }
      });
    }
  };

  // legt den Vorschlag in der suggestions-Tabelle an
  async function saveEvent(eventType, data) {
    const { error } = await supabase
      .from('suggestions')
      .insert([{
        entityType: eventType,
        entityId: null,
        creatorId: supabase.auth.user().id,
        comment: null,
        sessionId: null,
        data,
        status: 'open'
      }]);
    if (error) {
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: `Fehler beim Speichern: ${error.message}` }
      });
    } else {
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: '👍 Dein Vorschlag wurde angelegt!' }
      });
    }
  }

  // File-Upload (bleibt unverändert)
  const upload = async (file) => {
    dispatch({ type: 'SET_UPLOAD', payload: file.name });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const { summary } = await res.json();
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: summary } });
    } catch (error) {
      console.error(error);
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
