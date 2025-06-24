import { useState, useEffect } from 'react';

export interface ExerciseData {
  name: string;
  youtubeUrl: string;
}

export const useExerciseDatabase = () => {
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExerciseDatabase();
  }, []);

  const loadExerciseDatabase = async () => {
    try {
      const response = await fetch('/exercise-database.txt');
      if (!response.ok) {
        throw new Error('Failed to load exercise database');
      }
      
      const text = await response.text();
      const exerciseList = parseExerciseDatabase(text);
      setExercises(exerciseList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading exercise database:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseExerciseDatabase = (text: string): ExerciseData[] => {
    return text
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const [name, youtubeUrl] = line.split(': ');
        return {
          name: name?.trim() || '',
          youtubeUrl: youtubeUrl?.trim() || ''
        };
      })
      .filter(exercise => exercise.name && exercise.youtubeUrl);
  };

  const searchExercises = (query: string): ExerciseData[] => {
    if (!query) return exercises;
    
    const lowercaseQuery = query.toLowerCase();
    return exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(lowercaseQuery)
    );
  };

  const addExerciseToDatabase = async (newExercise: ExerciseData) => {
    // For now, just add to local state
    // In the future, you could implement saving back to the file
    setExercises(prev => [...prev, newExercise]);
  };

  return {
    exercises,
    loading,
    error,
    searchExercises,
    addExerciseToDatabase,
    reloadDatabase: loadExerciseDatabase
  };
};