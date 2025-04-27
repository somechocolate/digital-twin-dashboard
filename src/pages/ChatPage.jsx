import React from 'react'
import { useTwin } from '../context/TwinContext'
import Chat from '../components/domain/Chat'

export default function ChatPage() {
  const { state, dispatch } = useTwin()

  const send = async (text) => {
    dispatch({ type:'PUSH_CHAT', payload:{ role:'user', content:text } })
    const res = await fetch('/api/gpt', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ prompt:text, mode: state.mode })
    })
    const { summary } = await res.json()
    dispatch({ type:'PUSH_CHAT', payload:{ role:'assistant', content:summary } })
  }

  const upload = async (file) => {
    dispatch({ type:'SET_UPLOAD', payload:file.name })
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method:'POST', body:fd })
    const { summary } = await res.json()
    dispatch({ type:'PUSH_CHAT', payload:{ role:'assistant', content:summary } })
    dispatch({ type:'SET_UPLOAD', payload:null })
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
