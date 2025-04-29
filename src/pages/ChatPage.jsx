// src/pages/ChatPage.jsx
import React, { useState, useContext } from 'react';
import { useTwin } from '../context/TwinContext';
import { askGPT } from '../api/gpt';
import { supabase } from '../lib/supabaseClient';

export default function ChatPage() {
  const { state, dispatch } = useTwin();
  const [pendingEvent, setPendingEvent] = useState(null);

  const send = async (text) => {
    dispatch({ type: 'PUSH_CHAT', payload: { role: 'user', content: text } });

    // Wenn wir auf eine vorher erkannte Event-Bestätigung warten:
    if (pendingEvent) {
      const answer = text.trim().toLowerCase();
      if (answer === 'ja') {
        // Speichern in Supabase je nach eventType
        let table = '';
        switch (pendingEvent.eventType) {
          case 'system':
            table = 'systemComponents';
            break;
          case 'feature':
            table = 'features';
            break;
          case 'component': // falls Du component separat behandelst
            table = 'systemComponents';
            break;
          default:
            console.error('Unknown eventType', pendingEvent.eventType);
        }
        const { data: insertResult, error } = await supabase
          .from(table)
          .insert([pendingEvent.data]);
        if (error) {
          dispatch({
            type: 'PUSH_CHAT',
            payload: {
              role: 'assistant',
              content: `Fehler beim Speichern: ${error.message}`
            }
          });
        } else {
          dispatch({
            type: 'PUSH_CHAT',
            payload: {
              role: 'assistant',
              content: '👍 Dein Eintrag wurde gespeichert!'
            }
          });
          // Optional: auch einen Changelog-Entry in „changes“ anlegen
          await supabase.from('changes').insert([{
            source: 'ui',
            type: 'create',
            message: `Automatisch erstellt via Chat: ${pendingEvent.eventType}`,
            relatedComponentId: insertResult[0].id
          }]);
        }
      } else {
        dispatch({
          type: 'PUSH_CHAT',
          payload: {
            role: 'assistant',
            content: 'Alles klar, ich verwerfe den Vorschlag.'
          }
        });
      }
      setPendingEvent(null);
      return;
    }

    // Standard-Flow: Anfrage an GPT
    try {
      const { eventDetected, eventType, data, chatResponse } =
        await askGPT(text, state.chat);

      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: chatResponse }
      });

      if (eventDetected) {
        dispatch({
          type: 'PUSH_CHAT',
          payload: {
            role: 'assistant',
            content:
              `Ich habe erkannt, dass du ein neues ${eventType} anlegen könntest:\n` +
              '```json\n' +
              JSON.stringify(data, null, 2) +
              '\n```' +
              '\nSoll ich das für dich speichern? (ja/nein)'
          }
        });
        // Merke das erkannte Event für die nächste User-Antwort
        setPendingEvent({ eventType, data });
      }
    } catch (err) {
      console.error('Send-Error', err);
      dispatch({
        type: 'PUSH_CHAT',
        payload: {
          role: 'assistant',
          content: 'Entschuldigung, da ist ein Fehler aufgetreten.'
        }
      });
    }
  };

  return (
    <div className="chat-container">
      {/* … dein bestehendes UI … */}
      <ChatInput onSend={send} />
    </div>
  );
}
