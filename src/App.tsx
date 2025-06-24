import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import '@aws-amplify/ui-react/styles.css';
import Navigation from './components/Navigation';

// Lazy load components for code splitting
const ProgramList = React.lazy(() => import('./components/ProgramList'));
const ProgramDetail = React.lazy(() => import('./components/ProgramDetail'));
const WorkoutSession = React.lazy(() => import('./components/WorkoutSession'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export const client = generateClient<Schema>();

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        const handleSignOut = () => {
          if (signOut) {
            signOut();
          }
        };

        return (
          <div className="min-h-screen bg-gray-50">
            <Navigation user={user} signOut={handleSignOut} />
            <main className="container mx-auto px-4 py-8">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<ProgramList />} />
                  <Route path="/program/:id" element={<ProgramDetail />} />
                  <Route path="/workout/:programId/:workoutId/:week" element={<WorkoutSession />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        );
      }}
    </Authenticator>
  );
}

export default App;