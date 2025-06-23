import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import '@aws-amplify/ui-react/styles.css';
import ProgramList from './components/ProgramList';
import ProgramDetail from './components/ProgramDetail';
import WorkoutSession from './components/WorkoutSession';
import Navigation from './components/Navigation';

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
              <Routes>
                <Route path="/" element={<ProgramList />} />
                <Route path="/program/:id" element={<ProgramDetail />} />
                <Route path="/workout/:programId/:workoutId/:week" element={<WorkoutSession />} />
              </Routes>
            </main>
          </div>
        );
      }}
    </Authenticator>
  );
}

export default App;