import { pgTable, varchar, timestamp, boolean, integer, json, uuid, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - Base authentication
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'admin', 'hr', 'employee'
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User Profiles
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  dateOfBirth: timestamp('date_of_birth'),
  address: text('address'),
});

// Departments
export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Designations
export const designations = pgTable('designations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  isActive: boolean('is_active').default(true),
});

// Employees
export const employees = pgTable('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  employeeId: varchar('employee_id', { length: 50 }).unique().notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  designationId: uuid('designation_id').references(() => designations.id),
  managerId: uuid('manager_id').references(() => employees.id),
  dateOfJoining: timestamp('date_of_joining'),
  salary: integer('salary'),
  workLocation: varchar('work_location', { length: 100 }),
  employmentType: varchar('employment_type', { length: 50}), // 'full_time', 'part_time', 'contract'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// HR Managers
export const hrManagers = pgTable('hr_managers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  departmentId: uuid('department_id').references(() => departments.id),
  permissions: json('permissions'), // Specific HR permissions
  isActive: boolean('is_active').default(true),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
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
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  designation: one(designations, {
    fields: [employees.designationId],
    references: [designations.id],
  }),
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
    relationName: 'manager'
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
    employees: many(employees),
    designations: many(designations),
}));
