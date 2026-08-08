import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const utcText = (name: string) => text(name).notNull();

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), name: text('name').notNull(), title: text('title').notNull(),
  description: text('description').notNull().default(''), leaderId: text('leader_id'), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), username: text('username').unique(), passwordHash: text('password_hash'), displayName: text('display_name').notNull(),
  email: text('email').notNull().unique(), role: text('role').notNull(), departmentId: text('department_id').references(() => departments.id),
  bio: text('bio').notNull().default(''), isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const chronicles = sqliteTable('chronicles', {
  id: text('id').primaryKey(), title: text('title').notNull(), content: text('content').notNull(), occurredAt: utcText('occurred_at'), published: integer('published', { mode: 'boolean' }).notNull().default(true), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(), departmentId: text('department_id').references(() => departments.id), title: text('title').notNull(), description: text('description').notNull().default(''),
  location: text('location').notNull().default('待定'), status: text('status').notNull(), capacity: integer('capacity').notNull(), checkInCode: text('check_in_code'), resultSummary: text('result_summary'), startsAt: utcText('starts_at'), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const activityRegistrations = sqliteTable('activity_registrations', {
  id: text('id').primaryKey(), activityId: text('activity_id').notNull().references(() => activities.id), userId: text('user_id').notNull().references(() => users.id),
  registeredAt: utcText('registered_at'), checkedInAt: text('checked_in_at'),
}, (table) => [uniqueIndex('activity_registration_unique').on(table.activityId, table.userId)]);

export const activityResults = sqliteTable('activity_results', {
  id: text('id').primaryKey(), activityId: text('activity_id').notNull().references(() => activities.id), fileId: text('file_id'), summary: text('summary').notNull(), createdAt: utcText('created_at'),
});

export const applications = sqliteTable('applications', {
  id: text('id').primaryKey(), statusTokenHash: text('status_token_hash').notNull().unique(), displayName: text('display_name').notNull(), email: text('email').notNull(), departmentId: text('department_id').notNull().references(() => departments.id),
  college: text('college').notNull().default('未填写'), reason: text('reason').notNull(), status: text('status').notNull(), userId: text('user_id').references(() => users.id), activationCodeEncrypted: text('activation_code_encrypted'), rejectionReason: text('rejection_reason'), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const activationTokens = sqliteTable('activation_tokens', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id), tokenHash: text('token_hash').notNull().unique(), expiresAt: utcText('expires_at'), usedAt: text('used_at'), createdAt: utcText('created_at'),
});

export const works = sqliteTable('works', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id), departmentId: text('department_id').notNull().references(() => departments.id),
  fileId: text('file_id'), title: text('title').notNull(), description: text('description').notNull().default(''), status: text('status').notNull(), reviewNote: text('review_note'), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const files = sqliteTable('files', {
  id: text('id').primaryKey(), ownerId: text('owner_id').references(() => users.id), departmentId: text('department_id').references(() => departments.id), name: text('name').notNull(), storageKey: text('storage_key').notNull().unique(), mimeType: text('mime_type').notNull(), size: integer('size').notNull(), visibility: text('visibility').notNull(), category: text('category').notNull().default('OTHER'), deletedAt: text('deleted_at'), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const departmentTasks = sqliteTable('department_tasks', {
  id: text('id').primaryKey(), departmentId: text('department_id').notNull().references(() => departments.id), assigneeId: text('assignee_id').notNull().references(() => users.id), title: text('title').notNull(), description: text('description').notNull().default(''), dueAt: text('due_at'), completedAt: text('completed_at'), confirmedAt: text('confirmed_at'), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id), expiresAt: utcText('expires_at'), createdAt: utcText('created_at'),
});

export const siteSettings = sqliteTable('site_settings', {
  key: text('key').primaryKey(), value: text('value').notNull(), updatedAt: utcText('updated_at'),
});

export const announcements = sqliteTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  category: text('category').notNull(),
  href: text('href').notNull(),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  publishedAt: utcText('published_at'),
  createdAt: utcText('created_at'),
  updatedAt: utcText('updated_at'),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(), actorId: text('actor_id').references(() => users.id), targetUserId: text('target_user_id').references(() => users.id), action: text('action').notNull(), entityType: text('entity_type').notNull(), entityId: text('entity_id').notNull(), details: text('details'), createdAt: utcText('created_at'),
}, (table) => [uniqueIndex('contribution_event_unique').on(table.action, table.entityType, table.entityId, table.targetUserId)]);

export const schema = { departments, users, chronicles, activities, activityRegistrations, activityResults, applications, activationTokens, works, files, departmentTasks, sessions, siteSettings, announcements, auditLogs };
