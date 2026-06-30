import { useEffect, useRef, useState } from 'react'

interface Message {
  id: number
  author: string
  text: string
  time: string
}

const MOCK_MESSAGES: Message[] = [
  { id: 1, author: 'system',  text: 'Welcome to the global channel',            time: '13:58' },
  { id: 2, author: 'jsilva',  text: 'anyone working on minishell?',             time: '14:01' },
  { id: 3, author: 'mmatos',  text: 'yeah, stuck on builtins',                  time: '14:02' },
  { id: 4, author: 'jsilva',  text: 'same lol. check the resources panel',      time: '14:03' },
  { id: 5, author: 'rcoelho', text: 'just finished libft, finally!!',           time: '14:07' },
]

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    const text = input.trim()
    if (!text) return
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setMessages(prev => [...prev, { id: Date.now(), author: 'you', text, time }])
    setInput('')
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b-4 border-black shrink-0">
        <span className="font-pressStart text-xs text-contrast">Global</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className={`font-pressStart text-[10px] ${msg.author === 'system' ? 'text-secundary' : msg.author === 'you' ? 'text-contrast' : 'text-white'}`}>
                {msg.author}
              </span>
              <span className="font-pressStart text-[8px] text-white/40">{msg.time}</span>
            </div>
            <p className="font-pressStart text-[10px] text-white/80 leading-relaxed">{msg.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2 border-t-4 border-black shrink-0 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
          maxLength={300}
          className="flex-1 px-2 py-1.5 bg-black/40 text-white font-pressStart text-[10px] focus:outline-none border-b-2 border-r-2 border-l border-t border-black placeholder:text-white/30"
        />
        <button
          onClick={send}
          className="px-3 py-1.5 bg-contrast text-black font-pressStart text-[10px] border-b-2 border-r-2 border-l border-t border-black"
        >
          →
        </button>
      </div>
    </div>
  )
}
