// src/components/AnalyzeForm.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useApi } from '../hooks/useApi';

const MIN_MESSAGE_LENGTH = 12;

function isEmojiOrWhitespaceOnly(s: string) {
  // allow letters, numbers, common punctuation and Arabic range
  const hasVisibleChar = /[A-Za-z0-9\u0600-\u06FF\p{L}\p{N}\p{P}]/u.test(s);
  return !hasVisibleChar;
}

export default function AnalyzeForm(): JSX.Element {
  const { analyze, loading, error } = useApi();
  const [message, setMessage] = useState('');
  const [sender, setSender] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  async function onSubmit(e?: FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    setClientError(null);
    setResult(null);

    const trimmed = message.trim();
    if (!trimmed || trimmed.length < MIN_MESSAGE_LENGTH) {
      setClientError(`Message must be at least ${MIN_MESSAGE_LENGTH} characters.`);
      return;
    }
    if (isEmojiOrWhitespaceOnly(trimmed)) {
      setClientError('Message appears to be emoji-only or empty — please paste the SMS text.');
      return;
    }
    try {
      const body = { message: trimmed, sender: sender.trim(), country: 'PK' };
      const res = await analyze(body);
      setResult(res);
    } catch {
      // hook handles error state
    }
  }

  const quickExamples = [
    { label: 'OTP scam', text: 'Please send your OTP 123456 to secure your account.' },
    { label: 'Urgent bank', text: 'Your bank account will be suspended. Verify immediately.' },
    { label: 'Lottery link', text: 'You won PKR 50,000! Claim: http://bit.ly/abc123' }
  ];
  const SENDER_LIMIT = 256;
  const MESSAGE_LIMIT = 1024;

  return (
    <div className="w-full">
   
      {/* Main grid: form | result */}
      <main className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* LEFT: Form card (glass) */}
          <section className="rounded-2xl p-6 bg-white/30 backdrop-blur-md border border-white/20 shadow-lg">
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Sender */}
              <label className="block text-xs font-medium text-slate-800">Sender (optional)</label>
              <div className="relative">
                <input
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  maxLength={SENDER_LIMIT}
                  aria-label="sender"
                  placeholder="e.g. +92300xxxxxxx or BankName"
                  className="block w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-0 focus:border-slate-800 transition"
                />
                <div className="absolute right-3 bottom-2 text-xs text-slate-700/70">
                  {String(sender || '').length}/{SENDER_LIMIT}
                </div>
              </div>

              {/* Message */}
              <label className="block text-xs font-medium text-slate-800">Message</label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  maxLength={MESSAGE_LIMIT}
                  aria-label="message"
                  placeholder="Paste the message here"
                  className="block w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-0 focus:border-slate-800 transition resize-y"
                />
                <div className="absolute right-3 bottom-2 text-xs text-slate-700/70">
                  {String(message || '').length}/{MESSAGE_LIMIT}
                </div>
              </div>

              {/* client error */}
              {clientError && <div className="text-sm text-red-600">{clientError}</div>}

              {/* quick examples + submit */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {quickExamples.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => setMessage(q.text)}
                      className="text-xs bg-white/20 px-3 py-1 rounded-full text-slate-900 hover:bg-white/30 transition"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-700">Min {MIN_MESSAGE_LENGTH} chars</div>

                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"></path>
                      </svg>
                    ) : null}
                    {loading ? 'Analyzing…' : 'Check'}
                  </button>
                </div>
              </div>

              {/* subtle small help toggle */}
              <details className="text-xs text-slate-700 mt-1">
                <summary className="cursor-pointer select-none">Why sender?</summary>
                <div className="mt-2">Sender helps detect spoofing or known scam sources — optional but useful.</div>
              </details>
            </form>
          </section>

          {/* RIGHT: Result card (glass) */}
          <aside className="rounded-2xl p-6 bg-white/28 backdrop-blur-md border border-white/20 shadow-lg min-h-[220px]">
            {/* errors */}
            {(error || clientError) && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                {clientError || error}
              </div>
            )}

            {/* empty state */}
            {!result && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center text-sm text-slate-700">
                <div className="text-lg font-medium text-slate-800">Result</div>
                <div className="mt-2">Paste a message and press <span className="font-semibold">Check</span> to analyze it.</div>
              </div>
            )}

            {/* result */}
            {result && (
              <div aria-live="polite" className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
                        result.isScam ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {result.isScam ? 'Likely Scam' : 'Looks Safe'}
                    </span>
                    <span className="text-xs text-slate-600">{result.source || 'rules'}</span>
                  </div>

                  <div className="text-xs text-slate-500">{/* small meta */}</div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-28 text-xs text-slate-600">Confidence</div>
                    <div className="flex-1">
                      <div className="w-full h-2 rounded-full bg-white/30 overflow-hidden">
                        <div
                          style={{ width: `${Math.round((result.confidence || 0) * 100)}%` }}
                          className={`h-2 ${result.isScam ? 'bg-red-600' : 'bg-green-600'} transition-all`}
                        />
                      </div>
                      <div className="text-xs text-slate-600 mt-1">{Math.round((result.confidence || 0) * 100)}%</div>
                    </div>
                  </div>
                </div>

                {Array.isArray(result.reasons) && result.reasons.length > 0 && (
                  <div>
                    <div className="font-medium text-sm text-slate-800">Reasons</div>
                    <ul className="list-disc list-inside text-sm text-slate-800 mt-2 space-y-1">
                      {result.reasons.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.llmExplanation && (
                  <div>
                    <div className="font-medium text-sm text-slate-800">AI Explanation</div>
                    <div className="text-sm text-slate-800 whitespace-pre-wrap mt-2">{result.llmExplanation}</div>
                  </div>
                )}

                {result.redacted && <div className="text-xs text-slate-700">Redacted: {result.redacted}</div>}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
