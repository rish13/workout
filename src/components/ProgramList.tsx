import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Activity, Trash2, MoreVertical } from 'lucide-react';
import { client } from '../App';
import type { Schema } from '../../amplify/data/resource';
import ConfirmDialog from './ConfirmDialog';

type Program = Schema['Program']['type'];

const ProgramList: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    program: Program | null;
  }>({ isOpen: false, program: null });
  const [newProgram, setNewProgram] = useState({
    name: '',
    durationWeeks: 12,
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const result = await client.models.Program.list();
      setPrograms(result.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.models.Program.create({
        name: newProgram.name,
        durationWeeks: newProgram.durationWeeks,
      });
      setNewProgram({ name: '', durationWeeks: 12 });
      setShowCreateForm(false);
      fetchPrograms();
    } catch (error) {
      console.error('Error creating program:', error);
    }
  };

  const deleteProgram = async (program: Program) => {
    try {
      // Delete all related data
      // 1. Get all workouts for this program
      const workoutsResult = await client.models.Workout.list({
        filter: { programId: { eq: program.id } }
      });

      // 2. For each workout, delete exercises and their configurations
      for (const workout of workoutsResult.data) {
        const exercisesResult = await client.models.Exercise.list({
          filter: { workoutId: { eq: workout.id } }
        });

        for (const exercise of exercisesResult.data) {
          // Delete exercise week configurations
          const configsResult = await client.models.ExerciseWeekConfig.list({
            filter: { exerciseId: { eq: exercise.id } }
          });
          
          for (const config of configsResult.data) {
            await client.models.ExerciseWeekConfig.delete({ id: config.id });
          }

          // Delete exercise logs
          const exerciseLogsResult = await client.models.ExerciseLog.list({
            filter: { exerciseId: { eq: exercise.id } }
          });

          for (const exerciseLog of exerciseLogsResult.data) {
            // Delete set logs
            const setLogsResult = await client.models.SetLog.list({
              filter: { exerciseLogId: { eq: exerciseLog.id } }
            });

            for (const setLog of setLogsResult.data) {
              await client.models.SetLog.delete({ id: setLog.id });
            }

            await client.models.ExerciseLog.delete({ id: exerciseLog.id });
          }

          // Delete the exercise
          await client.models.Exercise.delete({ id: exercise.id });
        }

        // Delete the workout
        await client.models.Workout.delete({ id: workout.id });
      }

      // 3. Delete workout logs
      const workoutLogsResult = await client.models.WorkoutLog.list({
        filter: { programId: { eq: program.id } }
      });

      for (const workoutLog of workoutLogsResult.data) {
        await client.models.WorkoutLog.delete({ id: workoutLog.id });
      }

      // 4. Finally delete the program
      await client.models.Program.delete({ id: program.id });

      // Update UI
      setPrograms(programs.filter(p => p.id !== program.id));
      setDeleteDialog({ isOpen: false, program: null });
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Failed to delete program. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workout Programs</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Program</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Program</h2>
          <form onSubmit={createProgram} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Name
              </label>
              <input
                type="text"
                required
                value={newProgram.name}
                onChange={(e) => setNewProgram(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter program name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (weeks)
              </label>
              <input
                type="number"
                min="1"
                max="52"
                required
                value={newProgram.durationWeeks}
                onChange={(e) => setNewProgram(prev => ({ ...prev, durationWeeks: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Create Program
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <div
            key={program.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-600 relative group"
          >
            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteDialog({ isOpen: true, program });
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full text-red-500 hover:text-red-700"
              title="Delete Program"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <Link to={`/program/${program.id}`} className="block">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {program.name}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{program.durationWeeks} weeks</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Activity className="h-4 w-4 mr-2" />
                    <span>Week {program.currentWeek || 1}</span>
                  </div>
                </div>
                {program.isActive && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>

      {programs.length === 0 && (
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No programs yet</h3>
          <p className="text-gray-600 mb-4">Create your first workout program to get started.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create Program
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Program"
        message={`Are you sure you want to delete "${deleteDialog.program?.name}"? This will permanently delete all workouts, exercises, and logged data. This action cannot be undone.`}
        confirmText="Delete Program"
        onConfirm={() => deleteDialog.program && deleteProgram(deleteDialog.program)}
        onCancel={() => setDeleteDialog({ isOpen: false, program: null })}
        dangerous={true}
      />
    </div>
  );
};

export default ProgramList;