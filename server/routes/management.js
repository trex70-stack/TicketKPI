import { Router } from 'express';
import { getKpiDB, getDbType } from '../db.js';
import { getYearFilter, getDateDiffMinutes, alias } from '../sqlUtils.js';

const router = Router();

router.get('/kpis', async (req, res) => {
  try {
    const { category, priority } = req.query;
    const db = getKpiDB();
    const yearFilter = getYearFilter();
    const isOracle = getDbType() === 'oracle';

    const agentEmpty = isOracle ? 't.agent IS NULL' : "(t.agent IS NULL OR t.agent = '')";
    
    const countCol = isOracle ? 'COUNT' : 'count';
    const categoryCol = isOracle ? 'CATEGORY' : 'category';
    const statusCol = isOracle ? 'STATUS' : 'status';
    const priorityCol = isOracle ? 'PRIORITY' : 'priority';
    const avgMinutesCol = isOracle ? 'AVG_MINUTES' : 'avg_minutes';

    const yearWhere = isOracle 
      ? `TO_CHAR(t.CDB_CDATE, 'YY') = ${yearFilter}`
      : `substr(t.CDB_CDATE, 7, 2) = ${yearFilter}`;
    
    const protYearWhere = isOracle 
      ? `TO_CHAR(p.CDBPROT_ZEIT, 'YY') = ${yearFilter}`
      : `substr(p.CDBPROT_ZEIT, 7, 2) = ${yearFilter}`;

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
      SELECT COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      ${whereClause} AND t.status = '0' AND ${agentEmpty}
    `, params);

    const ticketsInProgress = await db.queryOne(`
      SELECT COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      ${whereClause} AND t.status = '80'
    `, params);

    const ticketsClosedThisYear = await db.queryOne(`
      SELECT COUNT(DISTINCT t.ticket_id) as ${alias('count')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE t.status = '200'
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      AND ${protYearWhere}
    `, params);

    const yearParams = [];
    if (category && category !== 'all') yearParams.push(category);
    if (priority && priority !== 'all') yearParams.push(priority);

    const avgProcessingTime = await db.queryOne(`
      SELECT ${getDateDiffMinutes('p.CDBPROT_ZEIT', 't.CDB_CDATE')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE ${yearWhere}
      AND ${protYearWhere}
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
    `, yearParams);

    const byCategory = await db.queryAll(`
      SELECT ty.type_name_de as ${alias('category')}, t.status as ${alias('status')}, COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_type ty ON t.type_id = ty.type_id
      WHERE ${yearWhere}
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      GROUP BY ty.type_name_de, t.status
      ORDER BY ty.type_name_de
    `, yearParams);

    const byPriority = await db.queryAll(`
      SELECT pr.priority_name_de as ${alias('priority')}, t.status as ${alias('status')}, COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_priority pr ON t.priority_id = pr.priority_id
      WHERE ${yearWhere}
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      GROUP BY pr.priority_name_de, t.status
      ORDER BY 
        CASE pr.priority_name_de
          WHEN 'Kritisch' THEN 1
          WHEN 'Hoch' THEN 2
          WHEN 'Mittel' THEN 3
          WHEN 'Niedrig' THEN 4
        END
    `, yearParams);

    const newTicketsWithoutAgentByCategory = await db.queryAll(`
      SELECT ty.type_name_de as ${alias('category')}, COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_type ty ON t.type_id = ty.type_id
      WHERE t.status = '0' AND ${agentEmpty}
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      GROUP BY ty.type_name_de
      ORDER BY count DESC
    `, params);

    res.json({
      ticketsNewWithoutAgent: ticketsNewWithoutAgent?.[countCol] || 0,
      ticketsInProgress: ticketsInProgress?.[countCol] || 0,
      ticketsClosedThisYear: ticketsClosedThisYear?.[countCol] || 0,
      avgProcessingTimeMinutes: avgProcessingTime?.[avgMinutesCol] || 0,
      byCategory: byCategory.map(row => ({
        category: row[categoryCol],
        status: row[statusCol],
        count: row[countCol]
      })),
      byPriority: byPriority.map(row => ({
        priority: row[priorityCol],
        status: row[statusCol],
        count: row[countCol]
      })),
      newTicketsWithoutAgentByCategory: newTicketsWithoutAgentByCategory.map(row => ({
        category: row[categoryCol],
        count: row[countCol]
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
