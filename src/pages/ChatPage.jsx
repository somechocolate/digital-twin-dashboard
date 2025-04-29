import React, { useState } from 'react';
import { useTwin } from '../context/TwinContext';
import Chat from '../components/domain/Chat';
import { askGPT } from '../api/gptClient';
import { supabase } from '../lib/supabaseClient';

// Pflichtfelder pro Event-Typ (Beispiel)
const requiredFields = {
  feature: ['title', 'status', 'prio'],
  system:  ['name', 'status', 'description']
};

export default function ChatPage() {
  const { state, dispatch } = useTwin();
  const [pendingEvent, setPendingEvent] = useState(null);

  const send = async (text) => {
    dispatch({ type: 'PUSH_CHAT', payload: { role:'user', content:text } });

    // Wenn wir auf Feld-Abfrage warten:
    if (pendingEvent && pendingEvent.awaitField) {
      const { eventType, data, awaitField } = pendingEvent;
      data[awaitField] = text.trim();
      // Nächstes fehlendes Feld ermitteln
      const missing = requiredFields[eventType].find(f => !data[f]);
      if (missing) {
        dispatch({
          type:'PUSH_CHAT',
          payload:{ role:'assistant', content:`Bitte gib den Wert für \`${missing}\` an:` }
        });
        setPendingEvent({ eventType, data, awaitField: missing });
      } else {
        // Alle Felder da: Vorschlag speichern
        await saveEvent(eventType, data);
        setPendingEvent(null);
      }
      return;
    }

    // Standard GPT-Erkennung:
    try {
      const { eventDetected, eventType, data, chatResponse } =
        await askGPT(text, state.chat);
      dispatch({ type:'PUSH_CHAT', payload:{ role:'assistant', content:chatResponse } });

      if (eventDetected) {
        // erstes fehlendes Feld ermitteln
        const missing = requiredFields[eventType].find(f => !data[f]);
        if (missing) {
          dispatch({
            type:'PUSH_CHAT',
            payload:{ role:'assistant', content:`Bitte gib den Wert für \`${missing}\` an:` }
          });
          setPendingEvent({ eventType, data, awaitField: missing });
        } else {
          // gleich speichern
          await saveEvent(eventType, data);
        }
      }
    } catch (err) {
      console.error(err);
      dispatch({
        type:'PUSH_CHAT',
        payload:{ role:'assistant', content:'Entschuldigung, da ist ein Fehler aufgetreten.' }
      });
    }
  };

  // Vorschlag in "suggestions" anlegen (nicht direkt in features)
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
        type:'PUSH_CHAT',
        payload:{ role:'assistant', content:`Fehler beim Speichern: ${error.message}` }
      });
    } else {
      dispatch({
        type:'PUSH_CHAT',
        payload:{ role:'assistant', content:'👍 Dein Vorschlag wurde angelegt!' }
      });
    }
  }

  const upload = async (file) => {
    dispatch({ type:'SET_UPLOAD', payload:file.name });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload',{ method:'POST', body:fd });
      const { summary } = await res.json();
      dispatch({ type:'PUSH_CHAT', payload:{ role:'assistant', content:summary } });
    } catch (error) {
      console.error(error);
      dispatch({ type:'PUSH_CHAT', payload:{ role:'assistant', content:'Upload fehlgeschlagen.' } });
    } finally {
      dispatch({ type:'SET_UPLOAD', payload:null });
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
