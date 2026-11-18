// Announcements service layer for campus notices, circulars, and institutional bulletins
const { pool, query, inMemoryStore, getIsPostgresConnected } = require('../../config/db.config');
const crypto = require('crypto');

class AnnouncementsService {
  async findAll({ targetRole, category, priority, search } = {}) {
    if (getIsPostgresConnected()) {
      let sql = 'SELECT * FROM announcements WHERE 1=1';
      const params = [];

      if (targetRole && targetRole !== 'ALL') {
        params.push(targetRole.toUpperCase());
        sql += ` AND (target_role = $${params.length} OR target_role = 'ALL')`;
      }

      if (category && category !== 'ALL') {
        params.push(category.toUpperCase());
        sql += ` AND category = $${params.length}`;
      }

      if (priority && priority !== 'ALL') {
        params.push(priority.toUpperCase());
        sql += ` AND priority = $${params.length}`;
      }

      if (search && search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        sql += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(content) LIKE $${params.length})`;
      }

      sql += ' ORDER BY is_pinned DESC, created_at DESC';

      const { rows } = await query(sql, params);
      return rows.map(r => this._formatAnnouncement(r));
    }

    // In-memory fallback
    let list = [...(inMemoryStore.announcements || [])];

    if (targetRole && targetRole !== 'ALL') {
      list = list.filter(a => a.target_role === targetRole.toUpperCase() || a.target_role === 'ALL');
    }

    if (category && category !== 'ALL') {
      list = list.filter(a => (a.category || '').toUpperCase() === category.toUpperCase());
    }

    if (priority && priority !== 'ALL') {
      list = list.filter(a => (a.priority || '').toUpperCase() === priority.toUpperCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.content || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at));
    return list.map(r => this._formatAnnouncement(r));
  }

  async findById(id) {
    if (getIsPostgresConnected()) {
      const { rows } = await query('SELECT * FROM announcements WHERE id = $1', [id]);
      if (rows.length === 0) return null;
      return this._formatAnnouncement(rows[0]);
    }

    const item = (inMemoryStore.announcements || []).find(a => a.id === id);
    return item ? this._formatAnnouncement(item) : null;
  }

  async create({ title, content, targetRole = 'ALL', category = 'GENERAL', priority = 'NORMAL', authorId = null, authorName = 'CampusIQ Administration', isPinned = false }) {
    if (!title || !content) {
      const err = new Error('Title and Content are required to post an announcement.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedRole = (targetRole || 'ALL').toUpperCase();
    const normalizedCategory = (category || 'GENERAL').toUpperCase();
    const normalizedPriority = (priority || 'NORMAL').toUpperCase();
    const pinnedBool = Boolean(isPinned);

    if (getIsPostgresConnected()) {
      const { rows } = await query(`
        INSERT INTO announcements (title, content, target_role, category, priority, author_id, author_name, is_pinned)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [title.trim(), content.trim(), normalizedRole, normalizedCategory, normalizedPriority, authorId, authorName, pinnedBool]);

      return this._formatAnnouncement(rows[0]);
    }

    // In-memory creation
    const newAnnouncement = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      content: content.trim(),
      target_role: normalizedRole,
      category: normalizedCategory,
      priority: normalizedPriority,
      author_id: authorId,
      author_name: authorName,
      is_pinned: pinnedBool,
      created_at: new Date(),
      updated_at: new Date()
    };

    if (!inMemoryStore.announcements) inMemoryStore.announcements = [];
    inMemoryStore.announcements.unshift(newAnnouncement);

    return this._formatAnnouncement(newAnnouncement);
  }

  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Announcement not found.');
      err.statusCode = 404;
      throw err;
    }

    const title = updates.title !== undefined ? updates.title.trim() : existing.title;
    const content = updates.content !== undefined ? updates.content.trim() : existing.content;
    const targetRole = updates.targetRole !== undefined ? updates.targetRole.toUpperCase() : existing.targetRole;
    const category = updates.category !== undefined ? updates.category.toUpperCase() : existing.category;
    const priority = updates.priority !== undefined ? updates.priority.toUpperCase() : existing.priority;
    const isPinned = updates.isPinned !== undefined ? Boolean(updates.isPinned) : existing.isPinned;

    if (getIsPostgresConnected()) {
      const { rows } = await query(`
        UPDATE announcements
        SET title = $1, content = $2, target_role = $3, category = $4, priority = $5, is_pinned = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `, [title, content, targetRole, category, priority, isPinned, id]);

      return this._formatAnnouncement(rows[0]);
    }

    // In-memory update
    const idx = (inMemoryStore.announcements || []).findIndex(a => a.id === id);
    if (idx !== -1) {
      inMemoryStore.announcements[idx] = {
        ...inMemoryStore.announcements[idx],
        title,
        content,
        target_role: targetRole,
        category,
        priority,
        is_pinned: isPinned,
        updated_at: new Date()
      };
      return this._formatAnnouncement(inMemoryStore.announcements[idx]);
    }

    return null;
  }

  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Announcement not found.');
      err.statusCode = 404;
      throw err;
    }

    if (getIsPostgresConnected()) {
      await query('DELETE FROM announcements WHERE id = $1', [id]);
      return { success: true, message: 'Announcement deleted successfully.' };
    }

    inMemoryStore.announcements = (inMemoryStore.announcements || []).filter(a => a.id !== id);
    return { success: true, message: 'Announcement deleted successfully.' };
  }

  async togglePin(id) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Announcement not found.');
      err.statusCode = 404;
      throw err;
    }

    return this.update(id, { isPinned: !existing.isPinned });
  }

  _formatAnnouncement(r) {
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      targetRole: r.target_role || 'ALL',
      category: r.category || 'GENERAL',
      priority: r.priority || 'NORMAL',
      authorId: r.author_id,
      authorName: r.author_name || 'Campus Administration',
      isPinned: Boolean(r.is_pinned),
      createdAt: r.created_at,
      updated_at: r.updated_at
    };
  }
}

module.exports = new AnnouncementsService();
