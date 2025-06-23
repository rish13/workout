import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Play, Calendar, Settings, X, ExternalLink } from 'lucide-react';
import { client } from '../App';
import type { Schema } from '../../amplify/data/resource';

type Program = Schema['Program']['type'];
type Workout = Schema['Workout']['type'];
type Exercise = Schema['Exercise']['type'];
type ExerciseWeekConfig = Schema['ExerciseWeekConfig']['type'];

interface ExerciseWithConfig extends Exercise {
  weekConfig?: ExerciseWeekConfig;
}

interface SubstitutionOption {
  name: string;
  youtubeUrl?: string;
}

const ProgramDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    dayOfWeek: 1,
  });

  useEffect(() => {
    if (id) {
      fetchProgramDetails();
    }
  }, [id]);

  const fetchProgramDetails = async () => {
    try {
      const programResult = await client.models.Program.get({ id: id! });
      setProgram(programResult.data);

      const workoutsResult = await client.models.Workout.list({
        filter: { programId: { eq: id } }
      });
      setWorkouts(workoutsResult.data.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    } catch (error) {
      console.error('Error fetching program details:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.models.Workout.create({
        programId: id!,
        name: newWorkout.name,
        dayOfWeek: newWorkout.dayOfWeek,
      });
      setNewWorkout({ name: '', dayOfWeek: 1 });
      setShowWorkoutForm(false);
      fetchProgramDetails();
    } catch (error) {
      console.error('Error creating workout:', error);
    }
  };

  const updateCurrentWeek = async (newWeek: number) => {
    if (!program) return;
    try {
      await client.models.Program.update({
        id: program.id,
        currentWeek: newWeek,
      });
      setProgram({ ...program, currentWeek: newWeek });
    } catch (error) {
      console.error('Error updating current week:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Program not found</h2>
        <Link to="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Programs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Programs
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
            <p className="text-gray-600 mt-2">
              {program.durationWeeks} weeks • Currently on week {program.currentWeek || 1}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <select
                value={program.currentWeek || 1}
                onChange={(e) => updateCurrentWeek(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: program.durationWeeks }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Week {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Workouts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            program={program}
            onEdit={() => setSelectedWorkout(workout)}
          />
        ))}
        
        <div
          onClick={() => setShowWorkoutForm(true)}
          className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors p-6 flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-blue-600"
        >
          <Plus className="h-12 w-12 mb-2" />
          <span className="text-lg font-medium">Add Workout</span>
        </div>
      </div>

      {/* Create Workout Modal */}
      {showWorkoutForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Workout</h2>
            <form onSubmit={createWorkout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workout Name
                </label>
                <input
                  type="text"
                  required
                  value={newWorkout.name}
                  onChange={(e) => setNewWorkout(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Upper Body, Push Day"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <select
                  value={newWorkout.dayOfWeek}
                  onChange={(e) => setNewWorkout(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5].map(day => (
                    <option key={day} value={day}>Day {day}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Create Workout
                </button>
                <button
                  type="button"
                  onClick={() => setShowWorkoutForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workout Modal */}
      {selectedWorkout && (
        <WorkoutDetailModal
          workout={selectedWorkout}
          program={program}
          onClose={() => setSelectedWorkout(null)}
        />
      )}
    </div>
  );
};

// Workout Card Component (unchanged)
interface WorkoutCardProps {
  workout: Workout;
  program: Program;
  onEdit: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, program, onEdit }) => {
  const [exerciseCount, setExerciseCount] = useState(0);

  useEffect(() => {
    fetchExerciseCount();
  }, [workout.id]);

  const fetchExerciseCount = async () => {
    try {
      const result = await client.models.Exercise.list({
        filter: { workoutId: { eq: workout.id } }
      });
      setExerciseCount(result.data.length);
    } catch (error) {
      console.error('Error fetching exercise count:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{workout.name}</h3>
          <p className="text-gray-600">Day {workout.dayOfWeek}</p>
          <p className="text-sm text-gray-500">{exerciseCount} exercises</p>
        </div>
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex space-x-2">
        <Link
          to={`/workout/${program.id}/${workout.id}/${program.currentWeek || 1}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors flex items-center justify-center"
        >
          <Play className="h-4 w-4 mr-2" />
          Start Workout
        </Link>
        <button
          onClick={onEdit}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition-colors"
        >
          <Edit2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Enhanced Workout Detail Modal Component with YouTube-enabled substitutions
interface WorkoutDetailModalProps {
  workout: Workout;
  program: Program;
  onClose: () => void;
}

const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({ workout, program, onClose }) => {
  const [exercises, setExercises] = useState<ExerciseWithConfig[]>([]);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [substitutions, setSubstitutions] = useState<SubstitutionOption[]>([{ name: '', youtubeUrl: '' }]);
  const [newExercise, setNewExercise] = useState({
    name: '',
    youtubeUrl: '',
    workingSets: 3,
    warmupSets: 0,
    repRange: '8-12',
    earlySetRPE: 7,
    lastSetRPE: 9,
    restSeconds: 120,
    notes: '',
    lastSetIntensityTechnique: '',
  });

  useEffect(() => {
    fetchExercises();
  }, [workout.id]);

  const fetchExercises = async () => {
    try {
      const exercisesResult = await client.models.Exercise.list({
        filter: { workoutId: { eq: workout.id } }
      });
      
      const exercisesWithConfig = await Promise.all(
        exercisesResult.data
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(async (exercise) => {
            const configResult = await client.models.ExerciseWeekConfig.list({
              filter: {
                exerciseId: { eq: exercise.id },
                weekNumber: { eq: program.currentWeek || 1 }
              }
            });
            
            return {
              ...exercise,
              weekConfig: configResult.data[0]
            };
          })
      );
      
      setExercises(exercisesWithConfig);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const addSubstitution = () => {
    setSubstitutions([...substitutions, { name: '', youtubeUrl: '' }]);
  };

  const removeSubstitution = (index: number) => {
    if (substitutions.length > 1) {
      setSubstitutions(substitutions.filter((_, i) => i !== index));
    }
  };

  const updateSubstitution = (index: number, field: keyof SubstitutionOption, value: string) => {
    const updated = substitutions.map((sub, i) => 
      i === index ? { ...sub, [field]: value } : sub
    );
    setSubstitutions(updated);
  };

  const createExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const exercise = await client.models.Exercise.create({
        workoutId: workout.id,
        name: newExercise.name,
        youtubeUrl: newExercise.youtubeUrl || undefined,
        orderIndex: exercises.length,
      });

      // Filter out empty substitutions and convert to JSON string
      const validSubstitutions = substitutions.filter(sub => sub.name.trim() !== '');
      const substitutionsJson = validSubstitutions.length > 0 ? JSON.stringify(validSubstitutions) : undefined;

      // Create configuration for all weeks
      for (let week = 1; week <= program.durationWeeks; week++) {
        await client.models.ExerciseWeekConfig.create({
          exerciseId: exercise.data!.id,
          weekNumber: week,
          workingSets: newExercise.workingSets,
          warmupSets: newExercise.warmupSets,
          reps: newExercise.repRange,
          earlySetRPE: newExercise.earlySetRPE,
          lastSetRPE: newExercise.lastSetRPE,
          restSeconds: newExercise.restSeconds,
          notes: newExercise.notes || undefined,
          lastSetIntensityTechnique: newExercise.lastSetIntensityTechnique || undefined,
          substitutionOptions: substitutionsJson,
        });
      }

      // Reset form
      setNewExercise({
        name: '',
        youtubeUrl: '',
        workingSets: 3,
        warmupSets: 0,
        repRange: '8-12',
        earlySetRPE: 7,
        lastSetRPE: 9,
        restSeconds: 120,
        notes: '',
        lastSetIntensityTechnique: '',
      });
      setSubstitutions([{ name: '', youtubeUrl: '' }]);
      setShowExerciseForm(false);
      fetchExercises();
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  };

  const formatRestTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${minutes}:00`;
  };

  const parseSubstitutions = (substitutionString?: string): SubstitutionOption[] => {
    if (!substitutionString) return [];
    try {
      return JSON.parse(substitutionString);
    } catch {
      // Fallback for old format (plain string)
      return substitutionString.split(',').map(name => ({ name: name.trim(), youtubeUrl: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">{workout.name} - Exercises</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Exercise List */}
        <div className="space-y-4 mb-6">
          {exercises.map((exercise, index) => (
            <div key={exercise.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full font-medium">
                      {index + 1}
                    </span>
                    {exercise.youtubeUrl ? (
                      <a
                        href={exercise.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {exercise.name}
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    ) : (
                      <span className="text-lg font-semibold text-gray-900">
                        {exercise.name}
                      </span>
                    )}
                  </div>
                  
                  {exercise.weekConfig && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Sets:</span> {exercise.weekConfig.warmupSets ? `${exercise.weekConfig.warmupSets}W + ` : ''}{exercise.weekConfig.workingSets}
                      </div>
                      <div>
                        <span className="font-medium">Reps:</span> {exercise.weekConfig.reps}
                      </div>
                      <div>
                        <span className="font-medium">RPE:</span> {exercise.weekConfig.earlySetRPE}-{exercise.weekConfig.lastSetRPE}
                      </div>
                      <div>
                        <span className="font-medium">Rest:</span> {exercise.weekConfig.restSeconds ? formatRestTime(exercise.weekConfig.restSeconds) : 'N/A'}
                      </div>
                      
                      {exercise.weekConfig.lastSetIntensityTechnique && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Technique:</span> {exercise.weekConfig.lastSetIntensityTechnique}
                        </div>
                      )}
                      
                      {exercise.weekConfig.notes && (
                        <div className="md:col-span-4">
                          <span className="font-medium">Notes:</span> {exercise.weekConfig.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced Substitutions Display */}
                  {exercise.weekConfig?.substitutionOptions && (
                    <div className="mt-3">
                      <span className="font-medium text-sm text-gray-700">Substitutions:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {parseSubstitutions(exercise.weekConfig.substitutionOptions).map((sub, subIndex) => (
                          <div key={subIndex} className="bg-white rounded-lg px-3 py-1 border border-gray-200">
                            {sub.youtubeUrl ? (
                              <a
                                href={sub.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                              >
                                {sub.name}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            ) : (
                              <span className="text-sm text-gray-700">{sub.name}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Add Exercise Form */}
        {showExerciseForm ? (
          <form onSubmit={createExercise} className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Add New Exercise</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Exercise Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  required
                  value={newExercise.name}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Bench Press, Squats"
                />
              </div>

              {/* YouTube URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL (Optional)
                </label>
                <input
                  type="url"
                  value={newExercise.youtubeUrl}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              {/* Working Sets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Sets *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={newExercise.workingSets}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, workingSets: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Warmup Sets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warmup Sets
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={newExercise.warmupSets}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, warmupSets: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Rep Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rep Range *
                </label>
                <input
                  type="text"
                  required
                  value={newExercise.repRange}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, repRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 8-12, 15, 5-8"
                />
              </div>

              {/* RPE Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RPE Range
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newExercise.earlySetRPE}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, earlySetRPE: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Early"
                    />
                  </div>
                  <span className="self-center text-gray-500">to</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newExercise.lastSetRPE}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, lastSetRPE: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Last"
                    />
                  </div>
                </div>
              </div>

              {/* Rest Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rest Time (seconds)
                </label>
                <select
                  value={newExercise.restSeconds}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, restSeconds: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={60}>1:00</option>
                  <option value={90}>1:30</option>
                  <option value={120}>2:00</option>
                  <option value={150}>2:30</option>
                  <option value={180}>3:00</option>
                  <option value={240}>4:00</option>
                  <option value={300}>5:00</option>
                </select>
              </div>

              {/* Last Set Intensity Technique */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Set Technique
                </label>
                <select
                  value={newExercise.lastSetIntensityTechnique}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, lastSetIntensityTechnique: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  <option value="Drop Set">Drop Set</option>
                  <option value="Rest-Pause">Rest-Pause</option>
                  <option value="To Failure">To Failure</option>
                  <option value="Cluster Set">Cluster Set</option>
                  <option value="Mechanical Drop Set">Mechanical Drop Set</option>
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newExercise.notes}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Any specific notes or instructions for this exercise..."
                />
              </div>

              {/* Enhanced Substitution Options */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Substitution Options
                  </label>
                  <button
                    type="button"
                    onClick={addSubstitution}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Substitution
                  </button>
                </div>
                
                <div className="space-y-3">
                  {substitutions.map((substitution, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={substitution.name}
                          onChange={(e) => updateSubstitution(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Exercise name"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="url"
                          value={substitution.youtubeUrl || ''}
                          onChange={(e) => updateSubstitution(index, 'youtubeUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="YouTube URL (optional)"
                        />
                      </div>
                      {substitutions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubstitution(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Add Exercise
              </button>
              <button
                type="button"
                onClick={() => setShowExerciseForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowExerciseForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md transition-colors flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Exercise
          </button>
        )}
      </div>
    </div>
  );
};

export default ProgramDetail;