import { requireRole } from './auth.js';
export function allow(roles) {
    return async function (req, res, next) {
        console.log(req);
        const orgId =
            (req.orgId ??
                req.body?.orgId ??
                req.params?.orgId ??
                req.query?.orgId ??
                req.get?.('x-org-id') ??
                new URLSearchParams((req.originalUrl || req.url || '').split('?')[1] || '').get('orgId')
            )?.toString().trim();
        if (!orgId) return res.status(400).json({ error: 'orgId required' });
        const ok = await requireRole(orgId, req.user.uid, roles);
        if (!ok) return res.status(403).json({ error: 'forbidden' });
        req.orgId = orgId; next();
    };
}