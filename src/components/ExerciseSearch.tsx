import React, { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink } from 'lucide-react';
import { useExerciseDatabase, ExerciseData } from '../hooks/useExerciseDatabase';

interface ExerciseSearchProps {
  onSelectExercise: (exercise: ExerciseData) => void;
  onCreateCustom: () => void;
}

const ExerciseSearch: React.FC<ExerciseSearchProps> = ({ onSelectExercise, onCreateCustom }) => {
  const { exercises, loading, error, searchExercises } = useExerciseDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<ExerciseData[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setFilteredExercises(searchExercises(searchQuery));
  }, [searchQuery, exercises]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading exercise database...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">Could not load exercise database: {error}</p>
        <button
          onClick={onCreateCustom}
          className="mt-2 text-blue-600 hover:text-blue-800 underline"
        >
          Add exercise manually instead
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search for an exercise..."
        />
      </div>

      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredExercises.length > 0 ? (
            <>
              {filteredExercises.map((exercise, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelectExercise(exercise);
                    setSearchQuery('');
                    setShowResults(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{exercise.name}</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  onCreateCustom();
                  setShowResults(false);
                }}
                className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 border-t-2 border-blue-100 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create custom exercise
              </button>
            </>
          ) : searchQuery ? (
            <div className="px-4 py-3">
              <p className="text-gray-500 mb-2">No exercises found for "{searchQuery}"</p>
              <button
                onClick={() => {
                  onCreateCustom();
                  setShowResults(false);
                }}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create "{searchQuery}" as custom exercise
              </button>
            </div>
          ) : (
            <div className="px-4 py-3">
              <p className="text-gray-500 mb-2">Start typing to search exercises...</p>
              <p className="text-sm text-gray-400">{exercises.length} exercises available</p>
            </div>
          )}
        </div>
      )}

      {showResults && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

export default ExerciseSearch;