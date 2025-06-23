import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Program model - represents the entire workout program
  Program: a
    .model({
      name: a.string().required(),
      durationWeeks: a.integer().required(),
      currentWeek: a.integer().default(1),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      workouts: a.hasMany('Workout', 'programId'),
      workoutLogs: a.hasMany('WorkoutLog', 'programId'),
    })
    .authorization((allow) => [allow.owner()]),

  // Workout model - represents a single workout (e.g., Day 1, Day 2, etc.)
  Workout: a
    .model({
      programId: a.id().required(),
      name: a.string().required(),
      dayOfWeek: a.integer().required(), // 1-5 for 5 workouts per week
      exercises: a.hasMany('Exercise', 'workoutId'),
      program: a.belongsTo('Program', 'programId'),
    })
    .authorization((allow) => [allow.owner()]),

  // Exercise model - represents an exercise within a workout
  Exercise: a
    .model({
      workoutId: a.id().required(),
      name: a.string().required(),
      youtubeUrl: a.url(),
      orderIndex: a.integer().required(),
      workout: a.belongsTo('Workout', 'workoutId'),
      exerciseWeekConfigs: a.hasMany('ExerciseWeekConfig', 'exerciseId'),
      exerciseLogs: a.hasMany('ExerciseLog', 'exerciseId'),
    })
    .authorization((allow) => [allow.owner()]),

  // ExerciseWeekConfig - stores week-specific configuration for exercises
  ExerciseWeekConfig: a
    .model({
      exerciseId: a.id().required(),
      weekNumber: a.integer().required(),
      lastSetIntensityTechnique: a.string(),
      warmupSets: a.integer(),
      workingSets: a.integer().required(),
      reps: a.string(), // Can be range like "8-12" or specific like "10"
      earlySetRPE: a.integer(),
      lastSetRPE: a.integer(),
      restSeconds: a.integer(),
      substitutionOptions: a.string(),
      notes: a.string(),
      exercise: a.belongsTo('Exercise', 'exerciseId'),
    })
    .authorization((allow) => [allow.owner()]),

  // WorkoutLog - tracks when workouts are completed
  WorkoutLog: a
    .model({
      programId: a.id().required(),
      workoutId: a.id().required(),
      weekNumber: a.integer().required(),
      completedAt: a.datetime().required(),
      notes: a.string(),
      program: a.belongsTo('Program', 'programId'),
      exerciseLogs: a.hasMany('ExerciseLog', 'workoutLogId'),
    })
    .authorization((allow) => [allow.owner()]),

  // ExerciseLog - tracks actual performance for each exercise
  ExerciseLog: a
    .model({
      workoutLogId: a.id().required(),
      exerciseId: a.id().required(),
      setLogs: a.hasMany('SetLog', 'exerciseLogId'),
      workoutLog: a.belongsTo('WorkoutLog', 'workoutLogId'),
      exercise: a.belongsTo('Exercise', 'exerciseId'),
    })
    .authorization((allow) => [allow.owner()]),

  // SetLog - tracks individual set performance
  SetLog: a
    .model({
      exerciseLogId: a.id().required(),
      setNumber: a.integer().required(),
      weight: a.float(),
      reps: a.integer().required(),
      rpe: a.integer(),
      isWarmup: a.boolean().default(false),
      exerciseLog: a.belongsTo('ExerciseLog', 'exerciseLogId'),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});