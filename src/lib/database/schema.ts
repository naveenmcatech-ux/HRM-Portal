import { pgTable, uuid, varchar, text, timestamp, boolean, integer, date, time, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (extends Supabase auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authId: uuid('auth_id'), // References auth.users(id) in Supabase
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20, enum: ['admin', 'hr', 'employee'] }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  position: varchar('position', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Departments table
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  hrManagerId: uuid('hr_manager_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  departmentId: uuid('department_id').references(() => departments.id),
  startDate: date('start_date'),
  endDate: date('end_date'),
  status: varchar('status', { length: 20, enum: ['planning', 'active', 'completed', 'on_hold'] }).default('planning'),
  progress: integer('progress').default(0), // CHECK constraint handled by application logic
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project assignments
export const projectAssignments = pgTable('project_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  assignedDate: date('assigned_date').defaultNow(),
  role: varchar('role', { length: 100 }),
});

// Attendance table
export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  checkIn: time('check_in'),
  checkOut: time('check_out'),
  totalHours: decimal('total_hours', { precision: 4, scale: 2 }),
  status: varchar('status', { length: 20, enum: ['present', 'absent', 'half_day', 'holiday'] }).default('absent'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Leave types table
export const leaveTypes = pgTable('leave_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  maxDays: integer('max_days').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Leave requests table
export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  leaveTypeId: uuid('leave_type_id').references(() => leaveTypes.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 20, enum: ['pending', 'approved', 'rejected'] }).default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Leave balances table
export const leaveBalances = pgTable('leave_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  leaveTypeId: uuid('leave_type_id').references(() => leaveTypes.id),
  year: integer('year').notNull(),
  allocatedDays: integer('allocated_days').notNull(),
  usedDays: integer('used_days').default(0),
});

// System settings table
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyLogo: varchar('company_logo', { length: 500 }),
  companyAddress: text('address'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  dateFormat: varchar('date_format', { length: 20 }).default('YYYY-MM-DD'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  tableName: varchar('table_name', { length: 100 }),
  recordId: uuid('record_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', {length: 45}), // For INET type
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50, enum: ['info', 'success', 'warning', 'error'] }),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});


// RELATIONS

export const usersRelations = relations(users, ({ one, many }) => ({
    department: one(departments, {
      fields: [users.departmentId],
      references: [departments.id],
    }),
    managedDepartment: one(departments, {
      fields: [users.id],
      references: [departments.hrManagerId],
      relationName: 'managed_department',
    }),
    attendance: many(attendance),
    leaveRequests: many(leaveRequests),
    projectAssignments: many(projectAssignments),
}));
  
export const departmentsRelations = relations(departments, ({ one, many }) => ({
    hrManager: one(users, {
      fields: [departments.hrManagerId],
      references: [users.id],
      relationName: 'managed_department',
    }),
    users: many(users),
    projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    department: one(departments, {
        fields: [projects.departmentId],
        references: [departments.id],
    }),
    assignments: many(projectAssignments),
}));

export const projectAssignmentsRelations = relations(projectAssignments, ({ one }) => ({
    project: one(projects, {
        fields: [projectAssignments.projectId],
        references: [projects.id],
    }),
    user: one(users, {
        fields: [projectAssignments.userId],
        references: [users.id],
    }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
    user: one(users, {
        fields: [attendance.userId],
        references: [users.id],
    }),
}));

export const leaveTypesRelations = relations(leaveTypes, ({ many }) => ({
    leaveRequests: many(leaveRequests),
    leaveBalances: many(leaveBalances),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
    user: one(users, {
        fields: [leaveRequests.userId],
        references: [users.id],
    }),
    leaveType: one(leaveTypes, {
        fields: [leaveRequests.leaveTypeId],
        references: [leaveTypes.id],
    }),
    approver: one(users, {
        fields: [leaveRequests.approvedBy],
        references: [users.id],
    }),
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
    user: one(users, {
        fields: [leaveBalances.userId],
        references: [users.id],
    }),
    leaveType: one(leaveTypes, {
        fields: [leaveBalances.leaveTypeId],
        references: [leaveTypes.id],
    }),
}));
