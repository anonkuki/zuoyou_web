import type Database from 'better-sqlite3';
import { isExecutiveRole, resolveAvatarConfig, worldAreas, worldMapHeight, worldMapWidth, type AvatarConfig, type WorldDirection } from '@guild/contracts';
import { SocialError, type SocialPrincipal } from './social.js';

const PRESENCE_TIMEOUT_MS = 15_000;
const SPRITES = ['guild-steward', 'silver-ranger', 'green-mage', 'rose-adventurer'] as const;

interface WorldMemberState {
  userId: string;
  displayName: string;
  avatarColor: string;
  avatarConfig: AvatarConfig;
  sprite: string;
  x: number;
  y: number;
  dir: WorldDirection;
  updatedAt: number;
}

const spriteFor = (userId: string): string => {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  return SPRITES[hash % SPRITES.length];
};

export class GuildWorldService {
  private positions = new Map<string, Map<string, WorldMemberState>>();

  constructor(
    private sqlite: Database.Database,
    private makeId: (prefix: string) => string,
    private timestamp: () => string,
    private clock: () => number = () => Date.now(),
  ) {}

  private area(areaId: string) {
    const found = worldAreas.find((entry) => entry.id === areaId);
    if (!found) throw new SocialError(404, 'AREA_NOT_FOUND', '区域不存在');
    return found;
  }

  private prune(areaId: string): WorldMemberState[] {
    const members = this.positions.get(areaId);
    if (!members) return [];
    const cutoff = this.clock() - PRESENCE_TIMEOUT_MS;
    for (const [userId, state] of members) if (state.updatedAt < cutoff) members.delete(userId);
    return [...members.values()];
  }

  listAreas() {
    return worldAreas.map((area) => ({
      id: area.id, name: area.name, color: area.color, departmentSlug: area.departmentSlug, online: this.prune(area.id).length,
    }));
  }

  move(principal: SocialPrincipal, input: { areaId: string; x: number; y: number; dir: WorldDirection; leaving: boolean }) {
    const area = this.area(input.areaId);
    if (input.leaving) {
      this.positions.get(area.id)?.delete(principal.id);
      return { left: true };
    }
    if (input.x < 0 || input.x > worldMapWidth || input.y < 0 || input.y > worldMapHeight) {
      throw new SocialError(400, 'OUT_OF_BOUNDS', '坐标超出区域边界');
    }
    for (const [areaId, members] of this.positions) if (areaId !== area.id) members.delete(principal.id);
    let members = this.positions.get(area.id);
    if (!members) {
      members = new Map();
      this.positions.set(area.id, members);
    }
    const profile = this.sqlite.prepare('SELECT display_name,avatar_color,avatar_config FROM users WHERE id=?').get(principal.id) as { display_name: string; avatar_color: string; avatar_config: string | null };
    members.set(principal.id, {
      userId: principal.id, displayName: profile.display_name, avatarColor: profile.avatar_color,
      avatarConfig: resolveAvatarConfig(principal.id, profile.avatar_config),
      sprite: spriteFor(principal.id), x: input.x, y: input.y, dir: input.dir, updatedAt: this.clock(),
    });
    return { x: input.x, y: input.y, dir: input.dir };
  }

  state(principal: SocialPrincipal, areaId: string, after?: string) {
    const area = this.area(areaId);
    const members = this.prune(area.id)
      .sort((a, b) => a.userId.localeCompare(b.userId))
      .map(({ userId, displayName, avatarColor, avatarConfig, sprite, x, y, dir }) => ({ userId, displayName, avatarColor, avatarConfig, sprite, x, y, dir, self: userId === principal.id }));
    let boundary: string | null = null;
    if (after) {
      const anchor = this.sqlite.prepare('SELECT created_at FROM area_messages WHERE id=?').get(after) as { created_at: string } | undefined;
      boundary = anchor?.created_at ?? null;
    }
    const rows = boundary
      ? this.sqlite.prepare(`SELECT m.id,m.area_id,m.content,m.created_at,u.id sender_id,u.display_name,u.avatar_color
          FROM area_messages m JOIN users u ON u.id=m.sender_id
          WHERE m.area_id=? AND m.deleted_at IS NULL AND m.created_at>? ORDER BY m.created_at,m.id LIMIT 50`).all(area.id, boundary)
      : this.sqlite.prepare(`SELECT * FROM (SELECT m.id,m.area_id,m.content,m.created_at,u.id sender_id,u.display_name,u.avatar_color
          FROM area_messages m JOIN users u ON u.id=m.sender_id
          WHERE m.area_id=? AND m.deleted_at IS NULL ORDER BY m.created_at DESC,m.id DESC LIMIT 50) ORDER BY created_at,id`).all(area.id);
    const messages = (rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id, areaId: row.area_id, content: row.content, createdAt: row.created_at,
      sender: { id: row.sender_id, displayName: row.display_name, avatarColor: row.avatar_color },
    }));
    return { area, members, messages, serverTime: this.timestamp() };
  }

  postMessage(principal: SocialPrincipal, areaId: string, content: string) {
    this.area(areaId);
    const id = this.makeId('area-message');
    const createdAt = this.timestamp();
    this.sqlite.prepare('INSERT INTO area_messages(id,area_id,sender_id,content,created_at) VALUES (?,?,?,?,?)').run(id, areaId, principal.id, content, createdAt);
    const row = this.sqlite.prepare(`SELECT m.id,m.area_id,m.content,m.created_at,u.id sender_id,u.display_name,u.avatar_color
      FROM area_messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?`).get(id) as Record<string, unknown>;
    return { id: row.id, areaId: row.area_id, content: row.content, createdAt: row.created_at, sender: { id: row.sender_id, displayName: row.display_name, avatarColor: row.avatar_color } };
  }

  deleteMessage(principal: SocialPrincipal, messageId: string): { ownerId: string; moderated: boolean } {
    const message = this.sqlite.prepare('SELECT sender_id,deleted_at FROM area_messages WHERE id=?').get(messageId) as { sender_id: string; deleted_at: string | null } | undefined;
    if (!message || message.deleted_at) throw new SocialError(404, 'NOT_FOUND', '消息不存在或已被删除');
    const manager = isExecutiveRole(principal.role);
    if (message.sender_id !== principal.id && !manager) throw new SocialError(403, 'FORBIDDEN', '只能删除自己的消息');
    this.sqlite.prepare('UPDATE area_messages SET deleted_at=? WHERE id=?').run(this.timestamp(), messageId);
    return { ownerId: message.sender_id, moderated: message.sender_id !== principal.id };
  }
}
