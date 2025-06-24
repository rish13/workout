import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Try to import the outputs file, but provide a fallback if it doesn't exist
let amplifyConfig = {};
try {
  // This will be replaced with the actual outputs during build
  const outputs = require('../amplify_outputs.json');
  amplifyConfig = outputs;
  console.log('Amplify outputs loaded successfully');
} catch (e) {
  console.warn('No amplify_outputs.json found. Running in dev mode without backend connection.');
}

Amplify.configure(amplifyConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);