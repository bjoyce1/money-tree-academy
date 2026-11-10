import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { Chapter } from '@/data/content';
import { getGuide } from '@/data/characters';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** True when the app is built with a Supabase backend that has the chat function. */
export const askAvailable = !!(SUPABASE_URL && SUPABASE_KEY);

const STARTERS = ['What is the main lesson of this chapter?', 'Give me a real-life money problem to solve.', 'Quiz me on this chapter.'];

/** The reader shows plain text; drop markdown emphasis and heading marks if a reply uses them. */
export const plain = (t: string) =>
  t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/(^|[\s(])\*(\S[^*]*?)\*(?=[\s.,!?)]|$)/g, '$1$2').replace(/^#{1,6}\s+/gm, '');

/** Read a chat-completions event stream, calling onText with the text so far. */
async function readStream(body: ReadableStream<Uint8Array>, onText: (t: string) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).replace(/\r$/, '');
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return text;
      try {
        const piece = JSON.parse(data).choices?.[0]?.delta?.content;
        if (piece) {
          text += piece;
          onText(text);
        }
      } catch {
        /* partial line: wait for more */
      }
    }
  }
  return text;
}

/** Ask the chosen guide about the chapter. Answers stream in from the book's chat function. */
export function AskGuide({ chapter }: { chapter: Chapter }) {
  const guide = getGuide();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const history: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);
    const say = (content: string) =>
      setMessages((m) => [...m.slice(0, -1), { role: 'assistant', content }]);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          messages: history,
          characterId: guide.id,
          chapterContext: { id: chapter.id, title: chapter.title, order: chapter.order, summary: chapter.summary },
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        say(err.error || 'Something went wrong. Please try again in a moment.');
      } else {
        const text = await readStream(res.body, say);
        if (!text) say('I did not catch that. Could you ask another way?');
      }
    } catch {
      say('I could not connect just now. Check your internet and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col">
      <p className="text-reader-soft">
        Ask {guide.name} about “{chapter.title}”. Answers come from an AI helper, so check big decisions with a grown-up.
      </p>

      <div className="mt-4 flex-1 space-y-3" aria-live="polite">
        {messages.length === 0 && (
          <div className="grid gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="min-h-[2.75rem] rounded-choice border border-reader-rule px-4 py-2 text-left text-reader-ink hover:border-reader-accent hover:text-reader-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex gap-3'}>
            {m.role === 'assistant' && (
              <img src={guide.image} alt="" width={32} height={32} className="mt-1 h-8 w-8 shrink-0 rounded-full object-cover object-top" />
            )}
            <p
              className={
                m.role === 'user'
                  ? 'max-w-[85%] whitespace-pre-wrap rounded-choice bg-reader-wash px-3.5 py-2.5 text-reader-ink'
                  : 'max-w-[85%] whitespace-pre-wrap leading-[1.6] text-reader-ink'
              }
            >
              <span className="sr-only">{m.role === 'user' ? 'You: ' : `${guide.name}: `}</span>
              {plain(m.content) || (busy && i === messages.length - 1 ? '…' : '')}
            </p>
          </div>
        ))}
        <div ref={end} />
      </div>

      <form
        className="sticky bottom-0 mt-4 flex gap-2 bg-reader-surface pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Your question
        </label>
        <input
          id="ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${guide.name} a question`}
          maxLength={500}
          autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-pill border border-reader-rule bg-reader-bg px-4 text-reader-ink placeholder:text-reader-quiet focus:border-reader-accent focus:outline-none"
          data-testid="input-ask"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send question"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-gold text-night hover:bg-gold-hover disabled:opacity-45"
        >
          <Send size={18} aria-hidden />
        </button>
      </form>
    </div>
  );
}
