// src/pages/ChatPage.jsx
import React, { useState } from 'react'
import { useTwin } from '../context/TwinContext'
import Chat from '../components/domain/Chat'
import { askGPT } from '../api/gptClient'
import { supabase } from '../lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

// Pflichtfelder pro Event-Typ
const requiredFields = {
  feature: ['title', 'status', 'prio'],
  system: ['name', 'status', 'description'],
  component: ['name', 'status', 'description'],
}

export default function ChatPage() {
  const { state, dispatch } = useTwin()
  const [pendingEvent, setPendingEvent] = useState(null)

  const send = async (text) => {
    // 1) User-Message direkt in den ChatContext pushen
    dispatch({ type: 'PUSH_CHAT', payload: { role: 'user', content: text } })

    // 2) Falls wir gerade auf ein Pflichtfeld warten:
    if (pendingEvent) {
      const { eventType, data, awaitField } = pendingEvent
      data[awaitField] = text.trim()

      // nächstes fehlendes Feld ermitteln
      const missing = requiredFields[eventType].find(f => !data[f])
      if (missing) {
        // Assistant fragt erneut nach
        dispatch({
          type: 'PUSH_CHAT',
          payload: {
            role: 'assistant',
            content: `Bitte gib den Wert für \`${missing}\` an:`
          }
        })
        setPendingEvent({ eventType, data, awaitField: missing })
      } else {
        // Alle Felder da: Vorschlag speichern
        await saveEvent(eventType, data)
        setPendingEvent(null)
      }
      return
    }

    // 3) Standard-GPT-Aufruf
    try {
      const { eventDetected, eventType, data, chatResponse } =
        await askGPT(text, state.chat)

      // 3a) Nur den Chat-Text ausgeben
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: chatResponse }
      })

      if (eventDetected) {
        // 3b) Sofort ins Frontend-State (für Anzeige in der Suggestions-Matrix)
        dispatch({
          type: 'ADD_SUGGESTION',
          payload: {
            id: uuidv4(),
            entityType: eventType,
            data,
            status: 'open'
          }
        })

        // 3c) prüfen, ob noch Felder fehlen
        const missing = requiredFields[eventType]?.find(f => !data[f])
        if (missing) {
          dispatch({
            type: 'PUSH_CHAT',
            payload: {
              role: 'assistant',
              content: `Bitte gib den Wert für \`${missing}\` an:`
            }
          })
          setPendingEvent({ eventType, data, awaitField: missing })
        } else {
          // alle Infos komplett → endgültig in Supabase persistieren
          await saveEvent(eventType, data)
        }
      }
    } catch (err) {
      console.error('ChatPage/send error:', err)
      dispatch({
        type: 'PUSH_CHAT',
        payload: {
          role: 'assistant',
          content: 'Entschuldigung, da ist ein Fehler aufgetreten.'
        }
      })
    }
  }

  // legt den Vorschlag in der suggestions-Tabelle an
  async function saveEvent(eventType, data) {
    const { data: inserted, error } = await supabase
      .from('suggestions')
      .insert([{
        entityType: eventType,
        entityId:    null,
        creatorId:   supabase.auth.user()?.id || null,
        comment:     null,
        sessionId:   null,
        data,
        status:      'open'
      }])
  
    if (error) {
      console.error('💥 saveEvent full error:', error)
      dispatch({
        type: 'PUSH_CHAT',
        payload: {
          role: 'assistant',
          content: `🚨 Fehler beim Speichern: ${error.message}`
        }
      })
    } else {
      console.log('✅ saveEvent inserted row:', inserted)
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: '👍 Dein Vorschlag wurde angelegt!' }
      })
    }
  }
  

  return (
    <Chat
      chatHistory={state.chat}
      onSendMessage={send}
      onUpload={upload}
      uploadingFile={state.uploading}
    />
  )
}
