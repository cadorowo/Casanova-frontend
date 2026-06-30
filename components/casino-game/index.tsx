import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import Preloader from "./Preloader";
import responsiveModule from "./responsiveModule";
import Watermark from './Watermark';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Watermark />
      <Preloader />
      <App />
    </React.StrictMode>
  );
}

responsiveModule();
