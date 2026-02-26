import { Router } from 'express';
import { getKpiDB } from '../db.js';

const router = Router();

router.get('/:agentId/kpis', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { category, priority } = req.query;
    const db = getKpiDB();

    let baseWhere = 'WHERE t.agent = ?';
    let params = [agentId];

    if (category && category !== 'all') {
      baseWhere += ' AND t.type_id = ?';
      params.push(category);
    }

    if (priority && priority !== 'all') {
      baseWhere += ' AND t.priority_id = ?';
      params.push(priority);
    }

    const ticketsNewNoAgent = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM cs_ticket_ticket t
      ${baseWhere} AND t.status = '0' AND (t.agent IS NULL OR t.agent = '')
    `, params);

    const ticketsInProgress = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM cs_ticket_ticket t
      ${baseWhere} AND t.status = '80'
    `, params);

    const filterParams = params.slice(1);
    const allAgentsInProgress = await db.queryAll(`
      SELECT t.agent, COUNT(*) as count
      FROM cs_ticket_ticket t
      WHERE t.status = '80' AND t.agent IS NOT NULL AND t.agent != ''
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      GROUP BY t.agent
    `, filterParams);

    const avgColleaguesInProgress = allAgentsInProgress.length > 0
      ? allAgentsInProgress.filter(a => a.agent !== agentId).reduce((sum, a) => sum + a.count, 0) / 
        Math.max(allAgentsInProgress.filter(a => a.agent !== agentId).length, 1)
      : 0;

    const ticketsClosedThisYear = await db.queryOne(`
      SELECT COUNT(DISTINCT t.ticket_id) as count
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE t.agent = ?
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      AND substr(p.CDBPROT_ZEIT, 7, 2) = substr(strftime('%Y', 'now'), 3, 2)
    `, params);

    const allAgentsClosedThisYear = await db.queryAll(`
      SELECT t.agent, COUNT(DISTINCT t.ticket_id) as count
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE t.agent IS NOT NULL AND t.agent != ''
      AND substr(p.CDBPROT_ZEIT, 7, 2) = substr(strftime('%Y', 'now'), 3, 2)
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      GROUP BY t.agent
    `, filterParams);

    const avgColleaguesClosedThisYear = allAgentsClosedThisYear.length > 0
      ? allAgentsClosedThisYear.filter(a => a.agent !== agentId).reduce((sum, a) => sum + a.count, 0) /
        Math.max(allAgentsClosedThisYear.filter(a => a.agent !== agentId).length, 1)
      : 0;

    const avgProcessingTime = await db.queryOne(`
      SELECT AVG(
        julianday('20' || substr(p.CDBPROT_ZEIT, 7, 2) || '-' || substr(p.CDBPROT_ZEIT, 4, 2) || '-' || substr(p.CDBPROT_ZEIT, 1, 2))
        - julianday('20' || substr(t.CDB_CDATE, 7, 2) || '-' || substr(t.CDB_CDATE, 4, 2) || '-' || substr(t.CDB_CDATE, 1, 2))
      ) * 24 * 60 as avg_minutes
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE t.agent = ?
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      AND substr(t.CDB_CDATE, 7, 2) = substr(strftime('%Y', 'now'), 3, 2)
      AND substr(p.CDBPROT_ZEIT, 7, 2) = substr(strftime('%Y', 'now'), 3, 2)
    `, params);

    const allAgentsAvgProcessingTime = await db.queryAll(`
      SELECT t.agent, AVG(
        julianday('20' || substr(p.CDBPROT_ZEIT, 7, 2) || '-' || substr(p.CDBPROT_ZEIT, 4, 2) || '-' || substr(p.CDBPROT_ZEIT, 1, 2))
        - julianday('20' || substr(t.CDB_CDATE, 7, 2) || '-' || substr(t.CDB_CDATE, 4, 2) || '-' || substr(t.CDB_CDATE, 1, 2))
      ) * 24 * 60 as avg_minutes
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE t.agent IS NOT NULL AND t.agent != ''
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      AND substr(t.CDB_CDATE, 7, 2) = substr(strftime('%Y', 'now'), 3, 2)
      AND substr(p.CDBPROT_ZEIT, 7, 2) = substr(strftime('%Y', 'now'), 3, 2)
      GROUP BY t.agent
    `, filterParams);

    const avgColleaguesProcessingTime = allAgentsAvgProcessingTime.length > 0
      ? allAgentsAvgProcessingTime.filter(a => a.agent !== agentId).reduce((sum, a) => sum + (a.avg_minutes || 0), 0) /
        Math.max(allAgentsAvgProcessingTime.filter(a => a.agent !== agentId).length, 1)
      : 0;

    const byCategory = await db.queryAll(`
      SELECT ty.type_name_de as category, t.status as status, COUNT(*) as count
      FROM cs_ticket_ticket t
      JOIN cs_ticket_type ty ON t.type_id = ty.type_id
      ${baseWhere}
      GROUP BY ty.type_name_de, t.status
      ORDER BY ty.type_name_de
    `, params);

    const byPriority = await db.queryAll(`
      SELECT pr.priority_name_de as priority, t.status as status, COUNT(*) as count
      FROM cs_ticket_ticket t
      JOIN cs_ticket_priority pr ON t.priority_id = pr.priority_id
      ${baseWhere}
      GROUP BY pr.priority_name_de, t.status
      ORDER BY 
        CASE pr.priority_name_de
          WHEN 'Kritisch' THEN 1
          WHEN 'Hoch' THEN 2
          WHEN 'Mittel' THEN 3
          WHEN 'Niedrig' THEN 4
        END
    `, params);

    res.json({
      ticketsNewNoAgent: ticketsNewNoAgent?.count || 0,
      ticketsInProgress: ticketsInProgress?.count || 0,
      avgColleaguesInProgress: Math.round(avgColleaguesInProgress * 10) / 10,
      ticketsClosedThisYear: ticketsClosedThisYear?.count || 0,
      avgColleaguesClosedThisYear: Math.round(avgColleaguesClosedThisYear * 10) / 10,
      avgProcessingTimeMinutes: avgProcessingTime?.avg_minutes || 0,
      avgColleaguesProcessingTimeMinutes: Math.round(avgColleaguesProcessingTime * 10) / 10,
      byCategory,
      byPriority
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
