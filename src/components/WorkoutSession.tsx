import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Clock, Target, TrendingUp, Check, Trash2, Plus } from 'lucide-react';
import { client } from '../App';
import type { Schema } from '../../amplify/data/resource';

type Program = Schema['Program']['type'];
type Workout = Schema['Workout']['type'];
type Exercise = Schema['Exercise']['type'];
type ExerciseWeekConfig = Schema['ExerciseWeekConfig']['type'];
type SetLog = Schema['SetLog']['type'];

// UI-only interface for sets during workout session
interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  isWarmup: boolean;
}

interface ExerciseWithConfig extends Exercise {
  weekConfig?: ExerciseWeekConfig;
  previousWeekLogs?: SetLog[];
}

const WorkoutSession: React.FC = () => {
  const { programId, workoutId, week } = useParams<{
    programId: string;
    workoutId: string;
    week: string;
  }>();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<ExerciseWithConfig[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<{ [exerciseId: string]: WorkoutSet[] }>({});
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentWeek = parseInt(week!);
  const previousWeek = currentWeek - 1;

  useEffect(() => {
    fetchWorkoutData();
  }, [programId, workoutId, week]);

  const fetchWorkoutData = async () => {
    try {
      const programResult = await client.models.Program.get({ id: programId! });
      setProgram(programResult.data);

      const workoutResult = await client.models.Workout.get({ id: workoutId! });
      setWorkout(workoutResult.data);

      const exercisesResult = await client.models.Exercise.list({
        filter: { workoutId: { eq: workoutId } }
      });
      
      const exercisesWithConfig = await Promise.all(
        exercisesResult.data
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(async (exercise) => {
            const configResult = await client.models.ExerciseWeekConfig.list({
              filter: {
                exerciseId: { eq: exercise.id },
                weekNumber: { eq: currentWeek }
              }
            });

            let previousWeekLogs: SetLog[] = [];
            if (previousWeek > 0) {
              try {
                const previousWorkoutLogsResult = await client.models.WorkoutLog.list({
                  filter: {
                    programId: { eq: programId },
                    workoutId: { eq: workoutId },
                    weekNumber: { eq: previousWeek }
                  }
                });

                if (previousWorkoutLogsResult.data.length > 0) {
                  const previousWorkoutLog = previousWorkoutLogsResult.data[0];

                  const previousExerciseLogsResult = await client.models.ExerciseLog.list({
                    filter: {
                      workoutLogId: { eq: previousWorkoutLog.id },
                      exerciseId: { eq: exercise.id }
                    }
                  });

                  if (previousExerciseLogsResult.data.length > 0) {
                    const previousExerciseLog = previousExerciseLogsResult.data[0];

                    const previousSetLogsResult = await client.models.SetLog.list({
                      filter: {
                        exerciseLogId: { eq: previousExerciseLog.id }
                      }
                    });

                    previousWeekLogs = previousSetLogsResult.data.sort((a, b) => a.setNumber - b.setNumber);
                  }
                }
              } catch (error) {
                console.error('Error fetching previous week logs:', error);
              }
            }

            return {
              ...exercise,
              weekConfig: configResult.data[0],
              previousWeekLogs
            };
          })
      );

      setExercises(exercisesWithConfig);

      // Initialize sets for each exercise using WorkoutSet interface
      const initialSets: { [exerciseId: string]: WorkoutSet[] } = {};
      exercisesWithConfig.forEach(exercise => {
        if (exercise.weekConfig) {
          const workingSets = exercise.weekConfig.workingSets || 3;
          const warmupSets = exercise.weekConfig.warmupSets || 0;
          
          initialSets[exercise.id] = [
            // Warmup sets
            ...Array.from({ length: warmupSets }, (_, i) => ({
              setNumber: i + 1,
              weight: 0,
              reps: 0,
              rpe: undefined,
              isWarmup: true,
            } as WorkoutSet)),
            // Working sets
            ...Array.from({ length: workingSets }, (_, i) => ({
              setNumber: warmupSets + i + 1,
              weight: 0,
              reps: 0,
              rpe: undefined,
              isWarmup: false,
            } as WorkoutSet))
          ];
        }
      });
      setSets(initialSets);

    } catch (error) {
      console.error('Error fetching workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSet = (exerciseId: string, setIndex: number, field: keyof WorkoutSet, value: any) => {
    setSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, index) => 
        index === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const deleteSet = (exerciseId: string, setIndex: number) => {
    setSets(prev => {
      const updatedSets = prev[exerciseId].filter((_, index) => index !== setIndex);
      // Renumber sets
      return {
        ...prev,
        [exerciseId]: updatedSets.map((set, index) => ({ 
          ...set, 
          setNumber: index + 1 
        }))
      };
    });
  };

  const addSet = (exerciseId: string, isWarmup: boolean = false) => {
    setSets(prev => {
      const currentSets = prev[exerciseId] || [];
      const newSetNumber = currentSets.length + 1;
      
      const newSet: WorkoutSet = {
        setNumber: newSetNumber,
        weight: 0,
        reps: 0,
        rpe: undefined,
        isWarmup,
      };

      return {
        ...prev,
        [exerciseId]: [...currentSets, newSet]
      };
    });
  };

  const completeWorkout = async () => {
    try {
      const workoutLog = await client.models.WorkoutLog.create({
        programId: programId!,
        workoutId: workoutId!,
        weekNumber: currentWeek,
        completedAt: new Date().toISOString(),
      });

      for (const exercise of exercises) {
        const exerciseLog = await client.models.ExerciseLog.create({
          workoutLogId: workoutLog.data!.id,
          exerciseId: exercise.id,
        });

        const exerciseSets = sets[exercise.id] || [];
        for (const set of exerciseSets) {
          const weight = set.weight ?? 0;
          const reps = set.reps ?? 0;
          
          if (weight > 0 || reps > 0) {
            await client.models.SetLog.create({
              exerciseLogId: exerciseLog.data!.id,
              setNumber: set.setNumber,
              weight: weight,
              reps: reps,
              rpe: set.rpe ?? undefined,
              isWarmup: set.isWarmup ?? false,
            });
          }
        }
      }

      setIsCompleted(true);
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Workout Complete!</h2>
        <p className="text-gray-600 mb-6">Great job finishing {workout?.name}</p>
        <Link
          to={`/program/${programId}`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Back to Program
        </Link>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const currentSets = sets[currentExercise?.id] || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/program/${programId}`}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Program
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workout?.name}</h1>
            <p className="text-gray-600">Week {currentWeek} • {program?.name}</p>
          </div>
          <div className="text-sm text-gray-500">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </div>
        </div>
      </div>

      {currentExercise && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Exercise Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              {currentExercise.youtubeUrl ? (
                <a
                  href={currentExercise.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl font-bold text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {currentExercise.name}
                  <ExternalLink className="h-5 w-5 ml-2" />
                </a>
              ) : (
                <h2 className="text-2xl font-bold text-gray-900">{currentExercise.name}</h2>
              )}
              
              {currentExercise.weekConfig && (
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {currentExercise.weekConfig.reps} reps
                  </div>
                  {currentExercise.weekConfig.restSeconds && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {Math.floor(currentExercise.weekConfig.restSeconds / 60)}:{String(currentExercise.weekConfig.restSeconds % 60).padStart(2, '0')} rest
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Previous Week Comparison */}
          {currentExercise.previousWeekLogs && currentExercise.previousWeekLogs.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">Previous Week (Week {previousWeek})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {currentExercise.previousWeekLogs
                  .filter(log => !log.isWarmup)
                  .map((log, index) => {
                    const weight = log.weight ?? 0;
                    const reps = log.reps ?? 0;
                    const rpe = log.rpe;
                    
                    return (
                      <div key={index} className="bg-white rounded px-2 py-1">
                        {weight}lbs × {reps} {rpe && `@ ${rpe}`}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Enhanced Sets Table with Delete Functionality */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">Set</th>
                  <th className="text-left py-2 px-3">Weight (lbs)</th>
                  <th className="text-left py-2 px-3">Reps</th>
                  <th className="text-left py-2 px-3">RPE</th>
                  <th className="text-left py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSets.map((set, index) => {
                  const weight = set.weight ?? 0;
                  const reps = set.reps ?? 0;
                  const rpe = set.rpe;
                  const isWarmup = set.isWarmup ?? false;
                  
                  return (
                    <tr key={index} className={`border-b border-gray-100 ${isWarmup ? 'bg-gray-50' : ''}`}>
                      <td className="py-3 px-3">
                        {isWarmup ? `W${set.setNumber}` : set.setNumber - (currentExercise.weekConfig?.warmupSets || 0)}
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.5"
                          value={weight === 0 ? '' : weight.toString()}
                          onChange={(e) => updateSet(currentExercise.id, index, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          value={reps === 0 ? '' : reps.toString()}
                          onChange={(e) => updateSet(currentExercise.id, index, 'reps', parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={rpe === null || rpe === undefined ? '' : rpe.toString()}
                          onChange={(e) => updateSet(currentExercise.id, index, 'rpe', parseInt(e.target.value) || undefined)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="-"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => deleteSet(currentExercise.id, index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                          title="Delete Set"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Set Buttons */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => addSet(currentExercise.id, false)}
              className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-md transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Working Set</span>
            </button>
            <button
              onClick={() => addSet(currentExercise.id, true)}
              className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Warmup Set</span>
            </button>
          </div>

          {/* Notes */}
          {currentExercise.weekConfig?.notes && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Notes</h4>
              <p className="text-yellow-700">{currentExercise.weekConfig.notes}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
              disabled={currentExerciseIndex === 0}
              className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-4 py-2 rounded-md transition-colors"
            >
              Previous Exercise
            </button>
            
            {currentExerciseIndex === exercises.length - 1 ? (
              <button
                onClick={completeWorkout}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Complete Workout
              </button>
            ) : (
              <button
                onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Next Exercise
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutSession;