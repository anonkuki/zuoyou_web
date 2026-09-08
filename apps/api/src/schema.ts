import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const utcText = (name: string) => text(name).notNull();

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), name: text('name').notNull(), title: text('title').notNull(),
  description: text('description').notNull().default(''), leaderId: text('leader_id'), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), uid: text('uid').notNull().unique(), username: text('username').unique(), passwordHash: text('password_hash'), displayName: text('display_name').notNull(),
  email: text('email').notNull().unique(), role: text('role').notNull(), departmentId: text('department_id').references(() => departments.id),
  bio: text('bio').notNull().default(''), signature: text('signature').notNull().default(''), guildTitle: text('guild_title').notNull().default(''), college: text('college').notNull().default(''), grade: text('grade').notNull().default(''),
  skills: text('skills').notNull().default('[]'), interests: text('interests').notNull().default('[]'), attributes: text('attributes').notNull().default('[]'), avatarColor: text('avatar_color').notNull().default('#2f6f64'),
  profileVisibility: text('profile_visibility').notNull().default('MEMBERS'), lastSeenAt: text('last_seen_at'), avatarConfig: text('avatar_config'), avatarStorageKey: text('avatar_storage_key'), profileCoverStorageKey: text('profile_cover_storage_key'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
});

export const profilePhotos = sqliteTable('profile_photos', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storageKey: text('storage_key').notNull().unique(), mimeType: text('mime_type').notNull(), size: integer('size').notNull(),
  sortOrder: integer('sort_order').notNull().default(0), createdAt: utcText('created_at'),
}, (table) => [index('profile_photos_owner_order_idx').on(table.ownerId, table.sortOrder, table.createdAt)]);

export const pageUploads = sqliteTable('page_uploads', {
  id: text('id').primaryKey(), pageKey: text('page_key').notNull(), ownerId: text('owner_id').notNull().references(() => users.id),
  storageKey: text('storage_key').notNull().unique(), mimeType: text('mime_type').notNull(), size: integer('size').notNull(), createdAt: utcText('created_at'),
}, (table) => [index('page_uploads_page_idx').on(table.pageKey, table.createdAt)]);

export const userDepartments = sqliteTable('user_departments', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').notNull().references(() => departments.id),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  joinedAt: utcText('joined_at'),
}, (table) => [primaryKey({ columns: [table.userId, table.departmentId] }), index('user_department_membership_idx').on(table.departmentId, table.userId)]);

export const roleAssignments = sqliteTable('role_assignments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role').notNull(),
  departmentId: text('department_id').references(() => departments.id),
  grantedBy: text('granted_by').references(() => users.id),
  grantedAt: utcText('granted_at'),
  revokedBy: text('revoked_by').references(() => users.id),
  revokedAt: text('revoked_at'),
}, (table) => [index('role_assignment_user_idx').on(table.userId, table.revokedAt), index('role_assignment_department_idx').on(table.departmentId, table.role, table.revokedAt)]);

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(), type: text('type').notNull(), directKey: text('direct_key').unique(), departmentId: text('department_id').references(() => departments.id),
  title: text('title').notNull().default(''), createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
}, (table) => [index('conversation_department_idx').on(table.departmentId, table.type)]);

export const conversationParticipants = sqliteTable('conversation_participants', {
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), lastReadAt: text('last_read_at'), muted: integer('muted', { mode: 'boolean' }).notNull().default(false), joinedAt: utcText('joined_at'),
}, (table) => [primaryKey({ columns: [table.conversationId, table.userId] }), index('conversation_participant_user_idx').on(table.userId, table.conversationId)]);

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(), conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }), senderId: text('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(), replyToId: text('reply_to_id'), editedAt: text('edited_at'), deletedAt: text('deleted_at'), createdAt: utcText('created_at'),
}, (table) => [index('message_conversation_time_idx').on(table.conversationId, table.createdAt, table.id)]);

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

export const registrationRequests = sqliteTable('registration_requests', {
  id: text('id').primaryKey(), username: text('username').notNull(), passwordHash: text('password_hash').notNull(), contact: text('contact').notNull(), note: text('note').notNull().default(''),
  status: text('status').notNull().default('PENDING'), reviewedBy: text('reviewed_by').references(() => users.id), reviewedAt: text('reviewed_at'), userId: text('user_id').references(() => users.id),
  createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
}, (table) => [index('registration_request_status_time_idx').on(table.status, table.createdAt)]);

export const applicationDepartments = sqliteTable('application_departments', {
  applicationId: text('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').notNull().references(() => departments.id),
  preferenceOrder: integer('preference_order').notNull().default(0),
}, (table) => [primaryKey({ columns: [table.applicationId, table.departmentId] }), index('application_department_order_idx').on(table.applicationId, table.preferenceOrder)]);

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
  content: text('content').notNull().default(''),
  category: text('category').notNull(),
  href: text('href').notNull(),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  publishedAt: utcText('published_at'),
  createdAt: utcText('created_at'),
  updatedAt: utcText('updated_at'),
});

export const postSubboards = sqliteTable('post_subboards', {
  id: text('id').primaryKey(), departmentId: text('department_id').notNull().references(() => departments.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), description: text('description').notNull().default(''), createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
}, (table) => [uniqueIndex('post_subboard_department_name_unique').on(table.departmentId, table.name), index('post_subboard_department_idx').on(table.departmentId, table.createdAt)]);

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(), subtitle: text('subtitle'), content: text('content').notNull(), bodyJson: text('body_json').notNull().default('[]'), departmentId: text('department_id').references(() => departments.id), subboardId: text('subboard_id').references(() => postSubboards.id, { onDelete: 'set null' }),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false), deletedAt: text('deleted_at'),
  createdAt: utcText('created_at'), updatedAt: utcText('updated_at'),
}, (table) => [index('post_list_idx').on(table.deletedAt, table.pinned, table.createdAt)]);

export const postPlacements = sqliteTable('post_placements', {
  id: text('id').primaryKey(), postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }), scopeType: text('scope_type').notNull(), departmentId: text('department_id').references(() => departments.id),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false), featured: integer('featured', { mode: 'boolean' }).notNull().default(false), placedBy: text('placed_by').notNull().references(() => users.id), placedAt: utcText('placed_at'), updatedAt: utcText('updated_at'),
}, (table) => [index('post_placement_board_idx').on(table.scopeType, table.departmentId, table.pinned, table.featured, table.placedAt)]);

export const postVotes = sqliteTable('post_votes', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }), userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), value: integer('value').notNull().default(1), createdAt: utcText('created_at'),
}, (table) => [primaryKey({ columns: [table.postId, table.userId] })]);

export const postAssets = sqliteTable('post_assets', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull().references(() => users.id), postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }), storageKey: text('storage_key').notNull().unique(), fileName: text('file_name').notNull().default(''), assetKind: text('asset_kind').notNull().default('IMAGE'), mimeType: text('mime_type').notNull(), size: integer('size').notNull(), createdAt: utcText('created_at'),
}, (table) => [index('post_asset_post_idx').on(table.postId)]);

export const postComments = sqliteTable('post_comments', {
  id: text('id').primaryKey(), postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(), deletedAt: text('deleted_at'), createdAt: utcText('created_at'),
}, (table) => [index('post_comment_post_idx').on(table.postId, table.createdAt)]);

export const postRevisions = sqliteTable('post_revisions', {
  id: text('id').primaryKey(), postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }), revisionNo: integer('revision_no').notNull(),
  snapshotJson: text('snapshot_json').notNull(), changeType: text('change_type').notNull(), restoredFromId: text('restored_from_id'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }), createdAt: utcText('created_at'),
}, (table) => [uniqueIndex('post_revision_number_unique').on(table.postId, table.revisionNo), index('post_revisions_post_idx').on(table.postId, table.revisionNo)]);

export const areaMessages = sqliteTable('area_messages', {
  id: text('id').primaryKey(), areaId: text('area_id').notNull(),
  senderId: text('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(), deletedAt: text('deleted_at'), createdAt: utcText('created_at'),
}, (table) => [index('area_message_area_idx').on(table.areaId, table.createdAt)]);

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(), actorId: text('actor_id').references(() => users.id), targetUserId: text('target_user_id').references(() => users.id), action: text('action').notNull(), entityType: text('entity_type').notNull(), entityId: text('entity_id').notNull(), details: text('details'), createdAt: utcText('created_at'),
}, (table) => [uniqueIndex('contribution_event_unique').on(table.action, table.entityType, table.entityId, table.targetUserId)]);

export const schema = { departments, users, profilePhotos, pageUploads, userDepartments, roleAssignments, conversations, conversationParticipants, messages, chronicles, activities, activityRegistrations, activityResults, applications, registrationRequests, applicationDepartments, activationTokens, works, files, departmentTasks, sessions, siteSettings, announcements, posts, postPlacements, postVotes, postAssets, postComments, postRevisions, areaMessages, auditLogs };
