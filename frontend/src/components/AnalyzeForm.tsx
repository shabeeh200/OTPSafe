// src/components/AnalyzeForm.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useApi } from '../hooks/useApi';

const MIN_MESSAGE_LENGTH = 6;

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
   // prevents unhandled rejection; error already managed in hook
    try {
      const body = { message: trimmed, sender: sender.trim(), country: 'PK' };
      const res = await analyze(body);
      setResult(res);
    } catch {
      // error state handled in hook
    }
  }

  const quickExamples = [
    { label: 'OTP scam', text: 'Please send your OTP 123456 to secure your account.' },
    { label: 'Urgent bank', text: 'Your bank account will be suspended. Verify immediately.' },
    { label: 'Lottery link', text: 'You won PKR 50,000! Claim: http://bit.ly/abc123' }
  ];

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 transition-shadow hover:shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex-none">
          {/* subtle icon */}
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 2.21-1.79 4-4 4m8 0c0-2.21 1.79-4 4-4M8 7h.01M16 7h.01" />
            </svg>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Analyze SMS</h2>
              <p className="text-sm text-slate-500">Paste the SMS text below — we’ll flag likely scams.</p>
            </div>
            <div className="text-xs text-slate-400">Demo • PK</div>
          </div>

          <form onSubmit={onSubmit} className="mt-4">
            <label className="block text-xs font-medium text-slate-600">Sender (optional)</label>
            <input
              value={sender}
              onChange={e => setSender(e.target.value)}
              className="mt-1 mb-3 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 transition"
              placeholder="8588 or Sender name"
              aria-label="sender"
            />

            <label className="block text-xs font-medium text-slate-600">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 transition resize-y"
              placeholder="Paste the SMS text here..."
              aria-label="message"
            />

            {clientError && <div className="mt-2 text-xs text-rose-600">{clientError}</div>}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <div className="flex flex-wrap gap-2">
                {quickExamples.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setMessage(q.text)}
                    className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-700 hover:bg-slate-200 transition-shadow"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500">Min {MIN_MESSAGE_LENGTH} chars</div>
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg>
                  ) : null}
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6">
            {(error || clientError) && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
                {clientError || error}
              </div>
            )}

            {result && (
              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1 rounded-full text-sm font-semibold ${result.isScam ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {result.isScam ? 'Likely Scam' : 'Looks Safe'}
                      </div>

                      <div className="text-xs text-slate-400">{result.source || 'rules'}</div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="w-28 text-xs text-slate-500">Confidence</div>
                      <div className="flex-1">
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div style={{ width: `${Math.round((result.confidence || 0) * 100)}%` }} className={`h-2 ${result.isScam ? 'bg-rose-500' : 'bg-emerald-500'} transition-all`}></div>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{Math.round((result.confidence || 0) * 100)}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 text-right">&nbsp;</div>
                </div>

                {Array.isArray(result.reasons) && result.reasons.length > 0 && (
                  <div className="mt-4">
                    <div className="font-medium text-sm">Reasons</div>
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 mt-2">
                      {result.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}

                {result.llmExplanation && (
                  <div className="mt-4">
                    <div className="font-medium text-sm">AI Explanation</div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap mt-2">{result.llmExplanation}</div>
                  </div>
                )}

                {result.redacted && (
                  <div className="mt-4 text-xs text-slate-500">Redacted: {result.redacted}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// src/App.tsx
// Note: avoid importing the default React export here to prevent duplicate "React" identifiers
// (keep the default React import only in your entry file like `index.tsx` if you rely on it).


/*
// // src/components/AnalyzeForm.tsx
// import React, { useState } from 'react';
// import { useApi } from '../hooks/useApi';

// const MIN_MESSAGE_LENGTH = 6;

// function isEmojiOrWhitespaceOnly(s: string) {
//   // if it has any letter/digit/punct we allow; emoji-only returns true
//   const hasVisibleChar = /[A-Za-z0-9\u0600-\u06FF\p{L}\p{N}\p{P}]/u.test(s);
//   return !hasVisibleChar;
// }

// export default function AnalyzeForm(): JSX.Element {
//   const { analyze, loading, error } = useApi();
//   const [message, setMessage] = useState('');
//   const [sender, setSender] = useState('');
//   const [result, setResult] = useState<any | null>(null);
//   const [clientError, setClientError] = useState<string | null>(null);

//   async function onSubmit(e?: React.FormEvent) {
//     if (e) e.preventDefault();
//     setClientError(null);
//     setResult(null);

//     const trimmed = message.trim();
//     if (!trimmed || trimmed.length < MIN_MESSAGE_LENGTH) {
//       setClientError(`Message must be at least ${MIN_MESSAGE_LENGTH} characters.`);
//       return;
//     }
//     if (isEmojiOrWhitespaceOnly(trimmed)) {
//       setClientError('Message appears to be emoji-only or empty — please paste the SMS text.');
//       return;
//     }

//     try {
//       const body = { message: trimmed, sender: sender.trim(), country: 'PK' };
//       const res = await analyze(body);
//       setResult(res);
//     } catch {
//       // error state handled in hook
//     }
//   }

//   const quickExamples = [
//     { label: 'OTP scam', text: 'Please send your OTP 123456 to secure your account.' },
//     { label: 'Urgent bank', text: 'Your bank account will be suspended. Verify immediately.' },
//     { label: 'Lottery link', text: 'You won PKR 50,000! Claim: http://bit.ly/abc123' }
//   ];

//   return (
//     <div className="bg-white shadow-md rounded-lg p-6">
//       <form onSubmit={onSubmit}>
//         <label className="block text-sm font-medium text-slate-700">Sender (optional)</label>
//         <input
//           value={sender}
//           onChange={e => setSender(e.target.value)}
//           className="mt-1 mb-3 block w-full rounded border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300"
//           placeholder="8588 or Sender name"
//           aria-label="sender"
//         />

//         <label className="block text-sm font-medium text-slate-700">Message</label>
//         <textarea
//           value={message}
//           onChange={e => setMessage(e.target.value)}
//           rows={6}
//           className="mt-1 block w-full rounded border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300"
//           placeholder="Paste the SMS text here..."
//           aria-label="message"
//         />

//         {clientError && <div className="mt-2 text-xs text-rose-600">{clientError}</div>}

//         <div className="flex items-center justify-between mt-4">
//           <div className="flex flex-wrap gap-2">
//             {quickExamples.map((q) => (
//               <button
//                 key={q.label}
//                 type="button"
//                 onClick={() => setMessage(q.text)}
//                 className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 hover:bg-slate-200"
//               >
//                 {q.label}
//               </button>
//             ))}
//           </div>

//           <button
//             type="submit"
//             disabled={loading || !message.trim()}
//             className="ml-2 inline-flex items-center rounded bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-white disabled:opacity-60"
//           >
//             {loading ? (<svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg>) : null}
//             {loading ? 'Analyzing...' : 'Analyze'}
//           </button>
//         </div>
//       </form>

//       <div className="mt-6">
//         {(error || clientError) && (
//           <div className="rounded border border-rose-200 bg-rose-50 p-3 text-rose-700">
//             {clientError || error}
//           </div>
//         )}

//         {result && (
//           <div className="mt-3 rounded border border-slate-100 bg-slate-50 p-4">
//             <div className="flex items-baseline justify-between">
//               <div>
//                 <div className={`text-lg font-semibold ${result.isScam ? 'text-rose-600' : 'text-emerald-600'}`}>
//                   {result.isScam ? 'Likely Scam' : 'Looks Safe'}
//                 </div>
//                 <div className="text-sm text-slate-500">Confidence: {Math.round((result.confidence || 0) * 100)}%</div>
//               </div>
//               <div className="text-xs text-slate-400">{result.source || 'rules'}</div>
//             </div>

//             {Array.isArray(result.reasons) && result.reasons.length > 0 && (
//               <div className="mt-3">
//                 <div className="font-medium text-sm">Reasons</div>
//                 <ul className="list-disc list-inside text-sm text-slate-700">
//                   {result.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
//                 </ul>
//               </div>
//             )}

//             {result.llmExplanation && (
//               <div className="mt-3">
//                 <div className="font-medium text-sm">AI Explanation</div>
//                 <div className="text-sm text-slate-700 whitespace-pre-wrap">{result.llmExplanation}</div>
//               </div>
//             )}

//             {result.redacted && (
//               <div className="mt-3 text-xs text-slate-500">Redacted: {result.redacted}</div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }*/
