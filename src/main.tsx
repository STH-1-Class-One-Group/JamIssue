import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('앱 루트 노드를 찾지 못했어요.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);