// src/pages/ChatPage.jsx
import React, { useState } from 'react'
import { useTwin } from '../context/TwinContext'
import Chat from '../components/domain/Chat'
import { askGPT } from '../api/gptClient'
import { supabase } from '../lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

// Pflichtfelder pro Event-Typ (Feature liefert nur "featureName")
const requiredFields = {
  feature: ['featureName'],
  system:  ['name', 'status', 'description']
}

export default function ChatPage() {
  const { state, dispatch } = useTwin()
  const [pendingEvent, setPendingEvent] = useState(null)

  const send = async (text) => {
    // 1) User‐Nachricht in Chat pushen
    dispatch({ type: 'PUSH_CHAT', payload: { role: 'user', content: text } })

    // 2) Wenn wir auf eine Feld‐Antwort warten (future Erweiterung)
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
        // alle Felder da → speichern
        await saveEvent(eventType, data)
        setPendingEvent(null)
      }
      return
    }

    // 3) Standard‐GPT‐Call
    try {
      const { eventDetected, eventType, data, chatResponse } =
        await askGPT(text, state.chat)

      // 3a) Chat‐Antwort pushen
      dispatch({
        type: 'PUSH_CHAT',
        payload: { role: 'assistant', content: chatResponse }
      })

      // 3b) Wenn neues Feature erkannt wurde
      if (eventDetected && eventType === 'feature') {
        // → sofort in UI‐Context
        const tempId = uuidv4()
        dispatch({
          type: 'ADD_SUGGESTION',
          payload: {
            id: tempId,
            entityType: 'feature',
            data,
            status: 'open'
          }
        })
        // → und in Supabase‐Tabelle persistieren
        await saveEvent(eventType, data)
      }

      // 3c) Falls andere Event‐Typen oder später weitere Felder …
      if (eventDetected && eventType !== 'feature') {
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

  /** Persistiert einen Vorschlag in der suggestions-Tabelle */
  async function saveEvent(eventType, data) {
    const { error } = await supabase
      .from('suggestions')
      .insert([{
        entityType: eventType,
        entityId:   null,
        creatorId:  supabase.auth.user()?.id || null,
        comment:    null,
        sessionId:  null,
        data,
        status:     'open'
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

  /** Datei‐Upload (bleibt unverändert) */
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
