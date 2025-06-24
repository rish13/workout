import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Import the outputs file
import amplifyOutputs from '../amplify_outputs.json';

console.log('Amplify outputs loaded:', amplifyOutputs);

Amplify.configure(amplifyOutputs);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);