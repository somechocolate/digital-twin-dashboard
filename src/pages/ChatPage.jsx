// File: src/pages/ChatPage.jsx
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

  const send = async (text) => {
    // 1) User-Nachricht in den Chat pushen
    dispatch({ type: 'PUSH_CHAT', payload: { role: 'user', content: text } })

    // 2) Falls wir gerade auf eine Feld-Antwort warten
    if (pendingEvent && pendingEvent.awaitField) {
      const { eventType, data, awaitField } = pendingEvent
      data[awaitField] = text.trim()

      const missing = requiredFields[eventType]?.find(f => !data[f])
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
      const { eventDetected, eventType, data, chatResponse } =
        await askGPT(text, state.chat)

      // 3a) Chat-Antwort pushen
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: chatResponse }
      })

      // 3b) GPT-Vorschlag sofort in Context (und später in DB)
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

      // 3c) Falls noch Felder fehlen, Feld-Dialog starten
      if (eventDetected) {
        const missing = requiredFields[eventType]?.find(f => !data[f])
        if (missing) {
          dispatch({
            type: 'PUSH_CHAT',
            payload: { role: 'assistant', content: `Bitte gib den Wert für \`${missing}\` an:` }
          })
          setPendingEvent({ eventType, data, awaitField: missing })
        } else {
          // alle Infos beisammen → in suggestions-Tabelle speichern
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

  // legt den Vorschlag in der suggestions-Tabelle an
  async function saveEvent(eventType, data) {
    const { error } = await supabase
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
      console.error('saveEvent error:', error)
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: `Fehler beim Speichern: ${error.message}` }
      })
    } else {
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: '👍 Dein Vorschlag wurde angelegt!' }
      })
    }
  }

  // Datei-Upload (wie gehabt)
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
