import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

export default function Chat({ chatHistory, onSendMessage, onUpload, uploadingFile }) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    onSendMessage(input)
    setInput('')
  }

  return (
    <div className="space-y-4">
      <div className="h-96 overflow-y-auto bg-white rounded p-4 shadow text-sm">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.role==='user'?'text-right':'text-left'}`}>
            <div className="inline-block bg-gray-100 p-2 rounded max-w-xl whitespace-pre-wrap">
              <strong>{msg.role==='user'?'Du':'GPT'}:</strong>{' '}
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {uploadingFile && (
        <p className="text-xs text-gray-500">📤 {uploadingFile} wird hochgeladen …</p>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && handleSend()}
          className="flex-1 border px-3 py-2 rounded"
          placeholder="Frage stellen oder Code besprechen…"
        />
        <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded">
          Senden
        </button>
        <label className="cursor-pointer bg-gray-200 px-3 py-2 rounded">
          📎
          <input type="file" hidden onChange={e => onUpload(e.target.files[0])}/>
        </label>
      </div>
    </div>
  )
}
