// src/main.tsx or src/index.tsx
import './index.css';         // <- ensures Tailwind directives are processed
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
