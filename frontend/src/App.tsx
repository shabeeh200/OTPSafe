// src/App.tsx
// NOTE: UI layout and decorative CSS (background blobs, gradients) were scaffolded
// with assistance from ChatGPT (AI-assisted). Core app logic, hooks, and integration
// were implemented/verified by me.
// Note: avoid importing default React export in this file.
import AnalyzeForm from './components/AnalyzeForm';
import { useState, useEffect } from 'react';

export default function App(): JSX.Element {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelpOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen antialiased text-slate-900 bg-slate-50">
      {/* subtle motion (respects reduced-motion) */}
      <style>{`
        @keyframes floatY {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes slowSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .float { animation: floatY 8s ease-in-out infinite; }
        .slow-spin { animation: slowSpin 30s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .float, .slow-spin { animation: none !important; }
        }
      `}</style>

      {/* Background: muted gradient + soft blobs */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-50 to-white">
        {/* left cool blob (muted indigo) */}
        <div
          aria-hidden
          className="absolute left-[-6rem] top-[-6rem] w-72 h-72 rounded-full blur-3xl opacity-18"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.18), rgba(79, 70, 229, 0.10) 40%, transparent 70%)',
          }}
        />
        {/* right soft cyan blob */}
        <div
          aria-hidden
          className="absolute right-[-5rem] top-12 w-64 h-64 rounded-full blur-3xl opacity-14 float"
          style={{
            background:
              'linear-gradient(135deg, rgba(94, 234, 212, 0.12), rgba(96, 165, 250, 0.10) 60%, transparent 90%)',
            transformOrigin: 'center',
          }}
        />
        {/* bottom subtle spin (very soft green/teal) */}
        <div
          aria-hidden
          className="absolute left-1/2 bottom-[-6rem] -translate-x-1/2 w-80 h-80 rounded-full blur-2xl opacity-10 slow-spin"
          style={{
            background:
              'linear-gradient(90deg, rgba(99, 102, 241, 0.06), rgba(34,197,94,0.06) 60%, transparent 95%)',
          }}
        />
      </div>

      <main className="min-h-screen flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-6xl">
          {/* Title (muted gradient) */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-700 to-slate-500">
              SMS Scam Alerter
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Paste an SMS to check for likely scams — quick, private, and clear.
            </p>
          </div>

          {/* wrapper for AnalyzeForm (keeps AnalyzeForm's glass styling) */}
          <div className="mx-auto p-6 transition-transform hover:scale-[1.01]">
            <AnalyzeForm />
          </div>
        </div>
      </main>

      {/* Help button: toned-down indigo */}
      <button
        aria-label="Open help"
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full px-4 py-2 text-white text-sm shadow-md transform transition duration-150 hover:scale-105 active:scale-95"
        style={{
          background:
            'linear-gradient(90deg, rgba(59,130,246,1), rgba(79,70,229,0.94) 60%)',
        }}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" />
          <path d="M9.5 9a2.5 2.5 0 115 0c0 1.5-2 1.8-2 3" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17h.01" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Help
      </button>

      {/* Help modal */}
      {helpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setHelpOpen(false)}
            aria-hidden
          />

          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-medium">Quick Help</h2>
              <button
                aria-label="Close help"
                onClick={() => setHelpOpen(false)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700 space-y-3">
              <p>• Don’t share OTPs or personal data.</p>
              <p>• If a link looks odd, verify with the official organization.</p>
              <p>• Adding the sender helps detect spoofing — optional.</p>

              <div className="pt-2 border-t mt-2 text-xs text-gray-500">
                PTA helpline: <span className="font-medium text-gray-700">0800-55055</span>
                <div>Email: <span className="font-medium text-gray-700">complaint@pta.gov.pk</span></div>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setHelpOpen(false)}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
