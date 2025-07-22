import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import the fix script to ensure PDF processing works correctly
import './utils/fixVectorVault.js';

// Configure PDF.js worker
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

createRoot(document.getElementById("root")!).render(<App />);
