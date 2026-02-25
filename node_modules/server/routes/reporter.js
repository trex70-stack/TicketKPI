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

router.get('/:reporterId/kpis', (req, res) => {
  try {
    const { reporterId } = req.params;
    const { category, priority } = req.query;

    let whereClause = 'WHERE mapped_reporter = ?';
    const params = [reporterId];

    if (category && category !== 'all') {
      whereClause += ' AND type_name_de = ?';
      params.push(category);
    }

    if (priority && priority !== 'all') {
      whereClause += ' AND priority_name_de = ?';
      params.push(priority);
    }

    const ticketsNew = queryOne(`
      SELECT COUNT(*) as count
      FROM cs_tickets
      ${whereClause} AND status = '0'
    `, params);

    const ticketsInProgress = queryOne(`
      SELECT COUNT(*) as count
      FROM cs_tickets
      ${whereClause} AND status = '80'
    `, params);

    const ticketsTotal = queryOne(`
      SELECT COUNT(*) as count
      FROM cs_tickets
      ${whereClause}
    `, params);

    const ticketsClosed = queryOne(`
      SELECT COUNT(*) as count
      FROM cs_tickets
      ${whereClause} AND status = '200'
    `, params);

    const avgProcessingTime = queryOne(`
      SELECT AVG(
        julianday(p.cdbprot_zeit) - julianday(t.cdb_cdate)
      ) * 24 * 60 as avg_minutes
      FROM cs_tickets t
      JOIN cs_ticket_protocol p ON t.ticket_id = p.ticket_id AND p.cdbprot_newstate = '200'
      WHERE t.mapped_reporter = ?
      ${category && category !== 'all' ? ' AND t.type_name_de = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_name_de = ?' : ''}
      AND strftime('%Y', t.cdb_cdate) = strftime('%Y', 'now')
      AND strftime('%Y', p.cdbprot_zeit) = strftime('%Y', 'now')
    `, params);

    const byCategory = queryAll(`
      SELECT type_name_de as category, status, COUNT(*) as count
      FROM cs_tickets
      WHERE mapped_reporter = ?
      ${category && category !== 'all' ? ' AND type_name_de = ?' : ''}
      ${priority && priority !== 'all' ? ' AND priority_name_de = ?' : ''}
      AND strftime('%Y', cdb_cdate) = strftime('%Y', 'now')
      GROUP BY type_name_de, status
      ORDER BY type_name_de
    `, params);

    const byPriority = queryAll(`
      SELECT priority_name_de as priority, status, COUNT(*) as count
      FROM cs_tickets
      WHERE mapped_reporter = ?
      ${category && category !== 'all' ? ' AND type_name_de = ?' : ''}
      ${priority && priority !== 'all' ? ' AND priority_name_de = ?' : ''}
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
      ticketsNew: ticketsNew?.count || 0,
      ticketsInProgress: ticketsInProgress?.count || 0,
      ticketsTotal: ticketsTotal?.count || 0,
      ticketsClosed: ticketsClosed?.count || 0,
      avgProcessingTimeMinutes: avgProcessingTime?.avg_minutes || 0,
      byCategory,
      byPriority
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
