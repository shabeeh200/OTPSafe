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
const SENDER_LIMIT = 256;
const MESSAGE_LIMIT = 1024;

return (
  <div className="w-full">
    {/* Grid: left = intro, right = form/results */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      {/* LEFT: Intro / headline (moved from top of right side) */}
      <div className="px-6 md:pl-12 md:pr-6 flex flex-col justify-center min-h-[360px]">

        <h2 className=" text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
          Check for scam text messages with our free{' '}
          <span className="inline-block bg-black text-white px-1 rounded-sm">AI-powered</span> tool
        </h2>

        <p className="mt-3 text-sm text-black max-w-lg">
          This tool helps flag likely scams and gives a confidence score and brief reasons.
        </p>

        {/* Helpful quick list (visual balance) */}
        <ul className="mt-6 space-y-2 text-xs text-black max-w-md">
          <li>• Do not share OTPs or personal information.</li>
          <li>• If a link looks suspicious, do not open it — verify via official channels.</li>
          <li>• This is a beta tool — use results as guidance, not legal advice.</li>
        </ul>

        {/* subtle note / CTA area for visual balance */}
        <div className="mt-6 text-xs text-black">Demo • PK · Free • No links opened by this tool</div>
      </div>

      {/* RIGHT: Form + result (no shadow; same page feel) */}
      <div className="mt-5 px-6 md:pr-9 md:pl-2">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-black">Sender (optional)</label>
            <div className="relative mt-1">
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                maxLength={SENDER_LIMIT}
                aria-label="sender"
                placeholder="Paste the sender"
                className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:border-black transition"
              />
              <div className="absolute right-3 bottom-2 text-xs text-gray-400">
                {String(sender || '').length}/{SENDER_LIMIT}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Message</label>
            <div className="relative mt-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={MESSAGE_LIMIT}
                aria-label="message"
                placeholder="Paste the message"
                className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:border-black transition resize-y"
              />
              <div className="absolute right-3 bottom-2 text-xs text-gray-400">
                {String(message || '').length}/{MESSAGE_LIMIT}
              </div>
            </div>
          </div>

          {clientError && <div className="text-sm text-red-600">{clientError}</div>}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {quickExamples.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setMessage(q.text)}
                  className="text-xs bg-gray-100 px-3 py-1 rounded-full text-black hover:bg-gray-500 transition"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">Min {MIN_MESSAGE_LENGTH} chars</div>

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"></path>
                  </svg>
                ) : null}
                {loading ? 'Analyzing...' : 'Check if it’s safe'}
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 mt-2">
            

            {/* <div className="text-xs bg-transparent px-3 py-2 rounded-md text-gray-700">
              This tool is in beta phase.
            </div> */}
          </div>
        </form>

        {/* Result area */}
        <div className="mt-6">
          {(error || clientError) && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              {clientError || error}
            </div>
          )}

          {result && (
            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-2.5 py-1 rounded-full text-sm font-semibold ${result.isScam ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {result.isScam ? 'Likely Scam' : 'Looks Safe'}
                    </div>
                    <div className="text-xs text-gray-400">{result.source || 'rules'}</div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-28 text-xs text-gray-500">Confidence</div>
                    <div className="flex-1">
                      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          style={{ width: `${Math.round((result.confidence || 0) * 100)}%` }}
                          className={`h-2 ${result.isScam ? 'bg-red-600' : 'bg-green-600'} transition-all`}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{Math.round((result.confidence || 0) * 100)}%</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 text-right">&nbsp;</div>
              </div>

              {Array.isArray(result.reasons) && result.reasons.length > 0 && (
                <div className="mt-4">
                  <div className="font-medium text-sm">Reasons</div>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-2">
                    {result.reasons.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.llmExplanation && (
                <div className="mt-4">
                  <div className="font-medium text-sm">AI Explanation</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{result.llmExplanation}</div>
                </div>
              )}

              {result.redacted && <div className="mt-4 text-xs text-gray-500">Redacted: {result.redacted}</div>}
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
