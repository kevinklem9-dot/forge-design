import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './hooks/AppContext';
import App from './App';
import './styles/global.css';

// Add bounce animation for typing indicator
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);
