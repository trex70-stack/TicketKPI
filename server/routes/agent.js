import { Router } from 'express';
import { getKpiDB, getDbType } from '../db.js';
import { getYearFilter, getDateDiffMinutes, alias } from '../sqlUtils.js';

const router = Router();

router.get('/:agentId/kpis', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { category, priority } = req.query;
    const db = getKpiDB();
    const yearFilter = getYearFilter();
    const isOracle = getDbType() === 'oracle';

    const agentEmpty = isOracle ? 't.agent IS NULL' : "(t.agent IS NULL OR t.agent = '')";
    const agentNotEmpty = isOracle ? 't.agent IS NOT NULL' : "t.agent IS NOT NULL AND t.agent != ''";
    
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

    const filterParams = params.slice(1);

    const ticketsNewNoAgent = await db.queryOne(`
      SELECT COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      WHERE t.status = '0' AND ${agentEmpty}
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
    `, filterParams);

    const ticketsInProgress = await db.queryOne(`
      SELECT COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      ${baseWhere} AND t.status = '80'
    `, params);

    const allAgentsInProgress = await db.queryAll(`
      SELECT t.agent, COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      WHERE t.status = '80' AND ${agentNotEmpty}
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      GROUP BY t.agent
    `, filterParams);

    const avgColleaguesInProgress = allAgentsInProgress.length > 0
      ? allAgentsInProgress.filter(a => a.agent !== agentId).reduce((sum, a) => sum + a[countCol], 0) / 
        Math.max(allAgentsInProgress.filter(a => a.agent !== agentId).length, 1)
      : 0;

    const ticketsClosedThisYear = await db.queryOne(`
      SELECT COUNT(DISTINCT t.ticket_id) as ${alias('count')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE t.agent = ?
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      AND ${protYearWhere}
    `, params);

    const allAgentsClosedThisYear = await db.queryAll(`
      SELECT t.agent, COUNT(DISTINCT t.ticket_id) as ${alias('count')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE ${agentNotEmpty}
      AND ${protYearWhere}
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      GROUP BY t.agent
    `, filterParams);

    const avgColleaguesClosedThisYear = allAgentsClosedThisYear.length > 0
      ? allAgentsClosedThisYear.filter(a => a.agent !== agentId).reduce((sum, a) => sum + a[countCol], 0) /
        Math.max(allAgentsClosedThisYear.filter(a => a.agent !== agentId).length, 1)
      : 0;

    const avgProcessingTime = await db.queryOne(`
      SELECT ${getDateDiffMinutes('p.CDBPROT_ZEIT', 't.CDB_CDATE')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE t.agent = ?
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      AND ${yearWhere}
      AND ${protYearWhere}
    `, params);

    const allAgentsAvgProcessingTime = await db.queryAll(`
      SELECT t.agent, ${getDateDiffMinutes('p.CDBPROT_ZEIT', 't.CDB_CDATE')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_prot p ON t.ticket_id = p.TICKET_ID AND p.CDBPROT_NEWSTATE = 200
      WHERE ${agentNotEmpty}
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      AND ${yearWhere}
      AND ${protYearWhere}
      GROUP BY t.agent
    `, filterParams);

    const avgColleaguesProcessingTime = allAgentsAvgProcessingTime.length > 0
      ? allAgentsAvgProcessingTime.filter(a => a.agent !== agentId).reduce((sum, a) => sum + (a[avgMinutesCol] || 0), 0) /
        Math.max(allAgentsAvgProcessingTime.filter(a => a.agent !== agentId).length, 1)
      : 0;

    const byCategory = await db.queryAll(`
      SELECT ty.type_name_de as ${alias('category')}, t.status as ${alias('status')}, COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_type ty ON t.type_id = ty.type_id
      WHERE t.agent = ? AND ${yearWhere}
      ${category && category !== 'all' ? ' AND t.type_id = ?' : ''}
      ${priority && priority !== 'all' ? ' AND t.priority_id = ?' : ''}
      GROUP BY ty.type_name_de, t.status
      ORDER BY ty.type_name_de
    `, params);

    const byPriority = await db.queryAll(`
      SELECT pr.priority_name_de as ${alias('priority')}, t.status as ${alias('status')}, COUNT(*) as ${alias('count')}
      FROM cs_ticket_ticket t
      JOIN cs_ticket_priority pr ON t.priority_id = pr.priority_id
      WHERE t.agent = ? AND ${yearWhere}
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
    `, params);

    res.json({
      ticketsNewNoAgent: ticketsNewNoAgent?.[countCol] || 0,
      ticketsInProgress: ticketsInProgress?.[countCol] || 0,
      avgColleaguesInProgress: Math.round(avgColleaguesInProgress * 10) / 10,
      ticketsClosedThisYear: ticketsClosedThisYear?.[countCol] || 0,
      avgColleaguesClosedThisYear: Math.round(avgColleaguesClosedThisYear * 10) / 10,
      avgProcessingTimeMinutes: avgProcessingTime?.[avgMinutesCol] || 0,
      avgColleaguesProcessingTimeMinutes: Math.round(avgColleaguesProcessingTime * 10) / 10,
      byCategory: byCategory.map(row => ({
        category: row[categoryCol],
        status: row[statusCol],
        count: row[countCol]
      })),
      byPriority: byPriority.map(row => ({
        priority: row[priorityCol],
        status: row[statusCol],
        count: row[countCol]
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
