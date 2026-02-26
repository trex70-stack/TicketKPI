import { Router } from 'express';
import { getKpiDB } from '../db.js';

const router = Router();

router.get('/kpis', async (req, res) => {
  try {
    const { category, priority } = req.query;
    const db = getKpiDB();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      whereClause += ' AND t.type_id = ?';
      params.push(category);
    }

    if (priority && priority !== 'all') {
      whereClause += ' AND t.priority_id = ?';
      params.push(priority);
    }

    const ticketsNewWithoutAgent = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM cs_ticket_ticket t
      ${whereClause} AND t.status = '0' AND (t.agent IS NULL OR t.agent = '')
    `, params);

    const ticketsInProgress = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM cs_ticket_ticket t
      ${whereClause} AND t.status = '80'
    `, params);

    const ticketsClosedThisYear = await db.queryOne(`
      SELECT COUNT(DISTINCT t.ticket_id) as count
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE t.status = '200'
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      AND substr(p.CDBPROT_ZEIT, 7, 2) = substr(strftime('%Y', 'now'), 3, 2)
    `, params);

    const avgProcessingTime = await db.queryOne(`
      SELECT AVG(
        julianday('20' || substr(p.CDBPROT_ZEIT, 7, 2) || '-' || substr(p.CDBPROT_ZEIT, 4, 2) || '-' || substr(p.CDBPROT_ZEIT, 1, 2))
        - julianday('20' || substr(t.CDB_CDATE, 7, 2) || '-' || substr(t.CDB_CDATE, 4, 2) || '-' || substr(t.CDB_CDATE, 1, 2))
      ) * 24 * 60 as avg_minutes
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE 1=1
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      AND substr(t.CDB_CDATE, 7, 2) = substr(strftime('%Y', 'now'), 3, 2)
      AND substr(p.CDBPROT_ZEIT, 7, 2) = substr(strftime('%Y', 'now'), 3, 2)
    `, params);

    const byCategory = await db.queryAll(`
      SELECT ty.type_name_de as category, t.status as status, COUNT(*) as count
      FROM cs_ticket_ticket t
      JOIN cs_ticket_type ty ON t.type_id = ty.type_id
      ${whereClause.replace('WHERE 1=1', 'WHERE 1=1').replace('t.', 't.')}
      GROUP BY ty.type_name_de, t.status
      ORDER BY ty.type_name_de
    `, params);

    const byPriority = await db.queryAll(`
      SELECT pr.priority_name_de as priority, t.status as status, COUNT(*) as count
      FROM cs_ticket_ticket t
      JOIN cs_ticket_priority pr ON t.priority_id = pr.priority_id
      ${whereClause}
      GROUP BY pr.priority_name_de, t.status
      ORDER BY 
        CASE pr.priority_name_de
          WHEN 'Kritisch' THEN 1
          WHEN 'Hoch' THEN 2
          WHEN 'Mittel' THEN 3
          WHEN 'Niedrig' THEN 4
        END
    `, params);

    const newTicketsWithoutAgentByCategory = await db.queryAll(`
      SELECT ty.type_name_de as category, COUNT(*) as count
      FROM cs_ticket_ticket t
      JOIN cs_ticket_type ty ON t.type_id = ty.type_id
      WHERE t.status = '0' AND (t.agent IS NULL OR t.agent = '')
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      GROUP BY ty.type_name_de
      ORDER BY count DESC
    `, params);

    res.json({
      ticketsNewWithoutAgent: ticketsNewWithoutAgent?.count || 0,
      ticketsInProgress: ticketsInProgress?.count || 0,
      ticketsClosedThisYear: ticketsClosedThisYear?.count || 0,
      avgProcessingTimeMinutes: avgProcessingTime?.avg_minutes || 0,
      byCategory,
      byPriority,
      newTicketsWithoutAgentByCategory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
