import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'

function ScrollableCard({ children }: PropsWithChildren) {
  return (
    <div className="text-contrast font-sans w-2/3 scrollbar-none my-12 h-90% overflow-auto bg-neutral_contrast border-b-8 border-r-8 border-l-4 border-t-4 border-black p-6">
      {children}
    </div>
  )
}

export default function PrivacyPolicy() {
  const [content, setContent] = useState('')

  const mdComponents: Record<string, any> = {
    p: (props: any) => (
      <p className="text-sm leading-relaxed mb-4 text-contrast" {...props} />
    ),
    h1: (props: any) => (
      <h1 className="text-2xl font-bold mb-4" {...props} />
    ),
    h2: (props: any) => (
      <h2 className="text-xl font-semibold mb-3" {...props} />
    ),
    h3: (props: any) => (
      <h3 className="text-lg font-semibold mb-2" {...props} />
    ),
    a: (props: any) => (
      <a className="text-blue-500 underline" {...props} />
    ),
    li: (props: any) => (
      <li className="ml-6 list-disc mb-2" {...props} />
    ),
    code: ({ inline, children, ...props }: any) =>
      inline ? (
        <code className="bg-neutral/20 px-1 rounded text-sm" {...props}>
          {children}
        </code>
      ) : (
        <pre className="bg-neutral p-4 rounded overflow-auto">
          <code {...props}>{children}</code>
        </pre>
      ),
    blockquote: (props: any) => (
      <blockquote className="border-l-4 pl-4 italic text-neutral-600" {...props} />
    ),
  }

  useEffect(() => {
    fetch('/privacy_policy.md')
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => console.error('Error fetching privacy policy:', err))
  }, [])

  return (
    <div className="flex flex-col items-center h-screen">

      {/* BOTÃO VOLTAR */}
      <div className="w-2/3 mt-6">
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition"
        >
          ← Back to Login
        </Link>
      </div>

      <ScrollableCard>
        <ReactMarkdown components={mdComponents}>
          {content}
        </ReactMarkdown>
      </ScrollableCard>

    </div>
  )
}