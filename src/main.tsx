import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { parseUrlOptions } from './app/urlParams';
import { I18nProvider } from './i18n/I18nProvider';
import './essay/essay.css';

const options = parseUrlOptions(window.location.search);
document.documentElement.lang = options.lang;

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <I18nProvider initialLang={options.lang}>
      <App />
    </I18nProvider>
  </StrictMode>,
);
