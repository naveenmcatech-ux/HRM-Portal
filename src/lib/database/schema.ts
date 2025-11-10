import { pgTable, uuid, varchar, text, timestamp, boolean, integer, date, time, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (extends Supabase auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authId: uuid('auth_id'), // References auth.users(id) in Supabase
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 20, enum: ['admin', 'hr', 'employee'] }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  address: text('address'),
  position: varchar('position', { length: 100 }),
  hireDate: date('hire_date'),
  salary: integer('salary').default(0),
  employeeId: varchar('employee_id', { length: 50 }).unique(),
});

// Departments table
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  departmentId: uuid('department_id').references(() => departments.id),
  employeeId: varchar('employee_id', { length: 50 }).unique(),
  position: varchar('position', { length: 100 }),
  hireDate: date('hire_date'),
  salary: integer('salary').default(0),
  status: varchar('status', { length: 20 }).default('active'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const hrManagers = pgTable('hr_managers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  departmentId: uuid('department_id').references(() => departments.id),
  employeeId: varchar('employee_id', { length: 50 }).unique(),
  position: varchar('position', { length: 100 }),
  hireDate: date('hire_date'),
  salary: integer('salary').default(0),
  permissions: jsonb('permissions'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Attendance Table
export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').references(() => employees.id),
  date: date('date').notNull(),
  checkIn: time('check_in'),
  checkOut: time('check_out'),
  status: varchar('status', { length: 20 }).default('present'), // present, absent, late, half_day
  workHours: decimal('work_hours', { precision: 4, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Leave Requests
export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').references(() => employees.id),
  leaveType: varchar('leave_type', { length: 50 }).notNull(), // sick, casual, annual, emergency
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  days: integer('days').notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Projects
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  departmentId: uuid('department_id').references(() => departments.id),
  managerId: uuid('manager_id').references(() => users.id),
  startDate: date('start_date'),
  endDate: date('end_date'),
  status: varchar('status', { length: 50 }).default('active'), // active, on_hold, completed, cancelled
  priority: varchar('priority', { length: 20 }).default('medium'), // high, medium, low
  budget: integer('budget'),
  progress: integer('progress').default(0), // 0-100 percentage
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project Team Members
export const projectTeam = pgTable('project_team', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id),
  employeeId: uuid('employee_id').references(() => employees.id),
  role: varchar('role', { length: 100 }),
  joinedAt: timestamp('joined_at').defaultNow(),
});

// Payroll
export const payroll = pgTable('payroll', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').references(() => employees.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  basicSalary: integer('basic_salary').notNull(),
  allowances: integer('allowances').default(0),
  deductions: integer('deductions').default(0),
  bonus: integer('bonus').default(0),
  netSalary: integer('net_salary').notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // pending, processed, paid
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Announcements
export const announcements = pgTable('announcements', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 20 }).default('general'), // general, urgent, event
  target: varchar('target', { length: 20 }).default('all'), // all, department, role
  targetValue: varchar('target_value', { length: 100 }),
  scheduledFor: timestamp('scheduled_for'),
  status: varchar('status', { length: 20 }).default('draft'), // draft, scheduled, sent
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Roles and Permissions
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions').notNull(),
  isDefault: boolean('is_default').default(false),
  usersCount: integer('users_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Security Logs
export const securityLogs = pgTable('security_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  status: varchar('status', { length: 20 }).notNull(), // success, failed
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// System Settings
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: varchar('category', { length: 50 }).notNull(), // company, attendance, leave, payroll
  settings: jsonb('settings').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Reports
export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // attendance, payroll, leave, department
  parameters: jsonb('parameters'),
  generatedBy: uuid('generated_by').references(() => users.id),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const holidays = pgTable('holidays', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    date: date('date').notNull(),
    description: text('description'),
    isRecurring: boolean('is_recurring').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
  hrManager: one(hrManagers, {
    fields: [users.id],
    references: [hrManagers.userId],
  }),
  leaveRequests: many(leaveRequests),
  projects: many(projects),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  attendance: many(attendance),
  leaveRequests: many(leaveRequests),
  payroll: many(payroll),
  projectTeam: many(projectTeam),
}));



// Add to relations section
export const hrManagersRelations = relations(hrManagers, ({ one }) => ({
  user: one(users, {
    fields: [hrManagers.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [hrManagers.departmentId],
    references: [departments.id],
  }),
}));
