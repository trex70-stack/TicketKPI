import { Router } from 'express';
import { getKpiDB } from '../db.js';

const router = Router();

function queryOne(sql, params = []) {
  const db = getKpiDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function queryAll(sql, params = []) {
  const db = getKpiDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

router.get('/:agentId/kpis', (req, res) => {
  try {
    const { agentId } = req.params;
    const { category, priority } = req.query;

    let baseWhere = 'WHERE mapped_agent = ?';
    let params = [agentId];

    if (category && category !== 'all') {
      baseWhere += ' AND type_name_de = ?';
      params.push(category);
    }

    if (priority && priority !== 'all') {
      baseWhere += ' AND priority_name_de = ?';
      params.push(priority);
    }

    const ticketsNewNoAgent = queryOne(`
      SELECT COUNT(*) as count
      FROM cs_tickets
      ${baseWhere} AND status = '0' AND (mapped_agent IS NULL OR mapped_agent = '')
    `, params);

    const ticketsInProgress = queryOne(`
      SELECT COUNT(*) as count
      FROM cs_tickets
      ${baseWhere} AND status = '80'
    `, params);

    const filterParams = params.slice(1);
    const allAgentsInProgress = queryAll(`
      SELECT mapped_agent, COUNT(*) as count
      FROM cs_tickets
      WHERE status = '80' AND mapped_agent IS NOT NULL AND mapped_agent != ''
      ${category && category !== 'all' ? ' AND type_name_de = ?' : ''}
      ${priority && priority !== 'all' ? ' AND priority_name_de = ?' : ''}
      GROUP BY mapped_agent
    `, filterParams);

    const avgColleaguesInProgress = allAgentsInProgress.length > 0
      ? allAgentsInProgress.filter(a => a.mapped_agent !== agentId).reduce((sum, a) => sum + a.count, 0) / 
        Math.max(allAgentsInProgress.filter(a => a.mapped_agent !== agentId).length, 1)
      : 0;

    const ticketsClosedThisYear = queryOne(`
      SELECT COUNT(*) as count
      FROM cs_tickets t
      JOIN cs_ticket_protocol p ON t.ticket_id = p.ticket_id AND p.cdbprot_newstate = '200'
      WHERE t.mapped_agent = ?
      ${category && category !== 'all' ? ' AND t.type_name_de = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_name_de = ?' : ''}
      AND strftime('%Y', p.cdbprot_zeit) = strftime('%Y', 'now')
    `, params);

    const allAgentsClosedThisYear = queryAll(`
      SELECT t.mapped_agent, COUNT(*) as count
      FROM cs_tickets t
      JOIN cs_ticket_protocol p ON t.ticket_id = p.ticket_id AND p.cdbprot_newstate = '200'
      WHERE t.mapped_agent IS NOT NULL AND t.mapped_agent != ''
      AND strftime('%Y', p.cdbprot_zeit) = strftime('%Y', 'now')
      ${category && category !== 'all' ? ' AND t.type_name_de = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_name_de = ?' : ''}
      GROUP BY t.mapped_agent
    `, filterParams);

    const avgColleaguesClosedThisYear = allAgentsClosedThisYear.length > 0
      ? allAgentsClosedThisYear.filter(a => a.mapped_agent !== agentId).reduce((sum, a) => sum + a.count, 0) /
        Math.max(allAgentsClosedThisYear.filter(a => a.mapped_agent !== agentId).length, 1)
      : 0;

    const avgProcessingTime = queryOne(`
      SELECT AVG(
        julianday(p.cdbprot_zeit) - julianday(t.cdb_cdate)
      ) * 24 * 60 as avg_minutes
      FROM cs_tickets t
      JOIN cs_ticket_protocol p ON t.ticket_id = p.ticket_id AND p.cdbprot_newstate = '200'
      WHERE t.mapped_agent = ?
      ${category && category !== 'all' ? ' AND t.type_name_de = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_name_de = ?' : ''}
      AND strftime('%Y', t.cdb_cdate) = strftime('%Y', 'now')
      AND strftime('%Y', p.cdbprot_zeit) = strftime('%Y', 'now')
    `, params);

    const allAgentsAvgProcessingTime = queryAll(`
      SELECT t.mapped_agent, AVG(julianday(p.cdbprot_zeit) - julianday(t.cdb_cdate)) * 24 * 60 as avg_minutes
      FROM cs_tickets t
      JOIN cs_ticket_protocol p ON t.ticket_id = p.ticket_id AND p.cdbprot_newstate = '200'
      WHERE t.mapped_agent IS NOT NULL AND t.mapped_agent != ''
      ${category && category !== 'all' ? ' AND t.type_name_de = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_name_de = ?' : ''}
      AND strftime('%Y', t.cdb_cdate) = strftime('%Y', 'now')
      AND strftime('%Y', p.cdbprot_zeit) = strftime('%Y', 'now')
      GROUP BY t.mapped_agent
    `, filterParams);

    const avgColleaguesProcessingTime = allAgentsAvgProcessingTime.length > 0
      ? allAgentsAvgProcessingTime.filter(a => a.mapped_agent !== agentId).reduce((sum, a) => sum + (a.avg_minutes || 0), 0) /
        Math.max(allAgentsAvgProcessingTime.filter(a => a.mapped_agent !== agentId).length, 1)
      : 0;

    const byCategory = queryAll(`
      SELECT type_name_de as category, status, COUNT(*) as count
      FROM cs_tickets
      ${baseWhere}
      AND strftime('%Y', cdb_cdate) = strftime('%Y', 'now')
      GROUP BY type_name_de, status
      ORDER BY type_name_de
    `, params);

    const byPriority = queryAll(`
      SELECT priority_name_de as priority, status, COUNT(*) as count
      FROM cs_tickets
      ${baseWhere}
      AND strftime('%Y', cdb_cdate) = strftime('%Y', 'now')
      GROUP BY priority_name_de, status
      ORDER BY 
        CASE priority_name_de
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
