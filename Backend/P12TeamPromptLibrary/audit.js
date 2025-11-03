import AuditLog from './models/AuditLog.js';
export async function audit({ orgId, userId, action, entity, entityId, data }) {
    try { await AuditLog.create({ orgId, userId, action, entity, entityId, data }); } catch { }
}