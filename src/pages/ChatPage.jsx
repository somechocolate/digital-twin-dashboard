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
  system: ['name', 'status', 'description']
}

export default function ChatPage() {
  const { state, dispatch } = useTwin()
  const [pendingEvent, setPendingEvent] = useState(null)

  // 1) Senden einer Chat-Nachricht
  const send = async (text) => {
    dispatch({ type: 'PUSH_CHAT', payload: { role: 'user', content: text } })

    // 2) Falls wir gerade auf einen Feldwert warten
    if (pendingEvent && pendingEvent.awaitField) {
      const { eventType, data, awaitField } = pendingEvent
      data[awaitField] = text.trim()

      const missing = requiredFields[eventType].find(f => !data[f])
      if (missing) {
        dispatch({
          type: 'PUSH_CHAT',
          payload: { role: 'assistant', content: `Bitte gib den Wert für \`${missing}\` an:` }
        })
        setPendingEvent({ eventType, data, awaitField: missing })
      } else {
        await saveEvent(eventType, data)
        setPendingEvent(null)
      }
      return
    }

    // 3) Standard-GPT-Call
    try {
      const result = await askGPT(text, state.chat)
      const { eventDetected, eventType, data, chatResponse } = result

      // WENN GPT "featureName" liefert, mappen wir es auf "title"
      if (eventType === 'feature' && data.featureName) {
        data.title = data.featureName
        delete data.featureName
      }

      // 3a) Chat-Antwort pushen
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: chatResponse } })

      // 3b) Sofort in den Context pushen (Frontend-Vorschlag)
      if (eventDetected && eventType === 'feature') {
        dispatch({
          type: 'ADD_SUGGESTION',
          payload: {
            id: uuidv4(),
            entityType: 'feature',
            data,
            status: 'open'
          }
        })
      }

      // 3c) Wenn noch Felder fehlen, Fragen-Dialog starten, sonst speichern
      if (eventDetected) {
        const missing = requiredFields[eventType]?.find(f => !data[f])
        if (missing) {
          dispatch({
            type: 'PUSH_CHAT',
            payload: { role: 'assistant', content: `Bitte gib den Wert für \`${missing}\` an:` }
          })
          setPendingEvent({ eventType, data, awaitField: missing })
        } else {
          await saveEvent(eventType, data)
        }
      }
    } catch (err) {
      console.error('ChatPage/send error:', err)
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: 'Entschuldigung, da ist ein Fehler aufgetreten.' }
      })
    }
  }

  // Speichert den Vorschlag in der suggestions-Tabelle
  async function saveEvent(eventType, data) {
    const { data: inserted, error } = await supabase
      .from('suggestions')
      .insert([{
        entityType: eventType,
        entityId: null,
        creatorId: supabase.auth.user()?.id || null,
        comment: null,
        sessionId: null,
        data,
        status: 'open'
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

  // **Datei-Upload** (wiederhergestellt)
  const upload = async (file) => {
    dispatch({ type: 'SET_UPLOAD', payload: file.name })
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const { summary } = await res.json()
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: summary } })
    } catch (error) {
      console.error('Upload error:', error)
      dispatch({ type: 'PUSH_CHAT', payload: { role: 'assistant', content: 'Upload fehlgeschlagen.' } })
    } finally {
      dispatch({ type: 'SET_UPLOAD', payload: null })
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
