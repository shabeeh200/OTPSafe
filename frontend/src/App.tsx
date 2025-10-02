
// src/App.tsx
// Note: avoid importing the default React export here to prevent duplicate "React" identifiers
// (keep the default React import only in your entry file like `index.tsx` if you rely on it).
import AnalyzeForm from './components/AnalyzeForm';

export default function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              {/* simple mark / logo */}
              <div className="w-10 h-10 rounded-lg bg-black/90 flex items-center justify-center text-white font-semibold">
                SSA
              </div>
              <div>
                <h1 className="text-lg font-semibold">SMS Scam Alerter</h1>
                <p className="text-xs text-gray-500">Detect phishing & scam SMS in Pakistan</p>
              </div>
            </div>

            <nav className="text-sm text-gray-600 flex items-center gap-4">
              <span className="text-xs px-2 py-1 border rounded-md border-gray-200 bg-gray-50">Demo</span>
              <span className="text-xs text-gray-400">Secure • Rate-limited</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main (full-width container; AnalyzeForm handles internal max-width) */}
      <main className="w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <AnalyzeForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-gray-700">
          <div className="mb-4">
            <strong>Quick help:</strong> If you receive a suspicious SMS, do NOT share OTPs or personal info.
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <div className="font-medium">PTA (Pakistan Telecom Authority)</div>
              <div className="text-sm">Helpline: 0800-55055</div>
              <div className="text-sm">Email: complaint@pta.gov.pk</div>
            </div>
            <div>
              <div className="font-medium">Security tips</div>
              <div className="text-sm">Never click unknown links. Verify sender via official channels.</div>
            </div>
            <div>
              <div className="font-medium">About</div>
              <div className="text-sm">Beta tool • For educational/demo use only.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/*
IMPORTANT NOTES / WHY THIS FIXES THE ERROR:
- The reported runtime error "Identifier 'React' has already been declared" typically comes from importing the default React export multiple
  times across files in setups where the bundler or transpiler generates conflicting declarations. To avoid that, we removed the default
  React import from components and App.tsx. Instead, components import only the hooks/types they need (`useState`, `FormEvent`) and use
  `import type` for type-only imports so they are erased at runtime.

- Keep the default React import (if any) only in your project entry file (commonly `index.tsx`) if your setup requires it. Example index.tsx:

  // index.tsx (example)
  import React from 'react'; // <-- you may keep it here
  import { createRoot } from 'react-dom/client';
  import App from './App';

  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);

- If your project uses the new automatic JSX runtime (React 17+), you can remove the default import everywhere — that's what we did.

SUGGESTED FOLLOW-UPS:
1. Check `index.tsx` and ensure you don't have two `import React` lines accidentally (or a duplicated bundling of index.tsx).
2. If you still see the error, paste your `index.tsx` here and I'll fix it directly.
*/
// // src/App.tsx
// import React from 'react';
// import AnalyzeForm from './components/AnalyzeForm';

// export default function App(): JSX.Element {
//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-900">
//       <header className="bg-white shadow-sm">
//         <div className="app-container mx-auto px-4 py-4 flex items-center justify-between">
//           <div>
//             <h1 className="text-xl font-semibold">SMS Scam Alerter</h1>
//             <p className="text-sm text-slate-500">Detect phishing / scam SMS in Pakistan — demo</p>
//           </div>
//           <div className="text-right text-sm">
//             <div>Demo</div>
//             <div className="text-xs text-slate-400">Secure | Rate-limited</div>
//           </div>
//         </div>
//       </header>

//       <main className="app-container mx-auto px-4 py-8">
//         <AnalyzeForm />
//       </main>

//       <footer className="bg-white border-t mt-12">
//         <div className="app-container mx-auto px-4 py-6 text-sm text-slate-600">
//           <div className="mb-2">
//             <strong>Quick help</strong>: If you receive a suspicious SMS, do NOT share OTPs or personal info.
//           </div>
//           <div className="grid md:grid-cols-3 gap-4">
//             <div>
//               <div className="font-medium">PTA (Pakistan Telecom Authority)</div>
//               <div>Helpline: 0800-55055</div>
//               <div>Email: complaint@pta.gov.pk</div>
//             </div>
//             <div>
//               <div className="font-medium">Customer Support (Demo)</div>
//               <div>Email: support@example.com</div>
//               <div>Hours: Mon–Fri 09:00–17:00</div>
//             </div>
//             <div>
//               <div className="font-medium">Notes</div>
//               <div>This is a demo. LLM usage is rate-limited.</div>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
