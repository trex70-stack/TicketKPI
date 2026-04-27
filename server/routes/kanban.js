import { Router } from 'express';
import { getKpiDB, getConfigDB, getDbType } from '../db.js';
import { alias } from '../sqlUtils.js';

const router = Router();

const DEFAULT_STATUS_LABELS = {
  '0': 'Neu',
  // '20': 'Warte auf Rückfrage', // TODO: Später aktivieren wenn in DB verwendet
  '80': 'In Bearbeitung',
  // '150': 'In Prüfung', // TODO: Später aktivieren wenn in DB verwendet
  '200': 'Geschlossen'
};

const STATUS_ORDER = ['0', '80', '200'];

router.get('/tickets', async (req, res) => {
  try {
    const { category, priority, agent, status } = req.query;
    const db = getKpiDB();
    const isOracle = getDbType() === 'oracle';

    const ticketIdCol = isOracle ? 'TICKET_ID' : 'ticket_id';
    const titleCol = isOracle ? 'TITLE' : 'title';
    const descriptionCol = isOracle ? 'DESCRIPTION' : 'description';
    const statusCol = isOracle ? 'STATUS' : 'status';
    const agentCol = isOracle ? 'AGENT' : 'agent';
    const reporterCol = isOracle ? 'REPORTER' : 'reporter';
    const typeIdCol = isOracle ? 'TYPE_ID' : 'type_id';
    const priorityIdCol = isOracle ? 'PRIORITY_ID' : 'priority_id';
    const cdbCdateCol = isOracle ? 'CDB_CDATE' : 'CDB_CDATE';
    const categoryNameCol = isOracle ? 'CATEGORY_NAME' : 'category_name';
    const priorityNameCol = isOracle ? 'PRIORITY_NAME' : 'priority_name';
    const agentNameCol = isOracle ? 'AGENT_NAME' : 'agent_name';
    const reporterNameCol = isOracle ? 'REPORTER_NAME' : 'reporter_name';

    let whereClause;
    const params = [];

    if (isOracle) {
      whereClause = `WHERE (
        t.status IN (0, 80)
        OR (
          t.status = 200
          AND EXISTS (
            SELECT 1 FROM cs_ticket_prot p
            WHERE p.TICKET_ID = t.ticket_id
            AND p.CDBPROT_NEWSTATE = 200
            AND p.CDBPROT_ZEIT >= SYSDATE - 7
          )
        )
      )`;
    } else {
      whereClause = `WHERE (
        t.status IN ('0', '80')
        OR (
          t.status = '200'
          AND EXISTS (
            SELECT 1 FROM cs_ticket_prot p
            WHERE p.TICKET_ID = t.ticket_id
            AND p.CDBPROT_NEWSTATE = 200
            AND date(substr(p.CDBPROT_ZEIT, 7, 2) || '-' || substr(p.CDBPROT_ZEIT, 4, 2) || '-' || substr(p.CDBPROT_ZEIT, 1, 2)) >= date('now', '-7 days')
          )
        )
      )`;
    }

    if (category && category !== 'all') {
      whereClause += ' AND t.type_id = ?';
      params.push(category);
    }

    if (priority && priority !== 'all') {
      whereClause += ' AND t.priority_id = ?';
      params.push(priority);
    }

    if (agent && agent !== 'all') {
      whereClause += ' AND t.agent = ?';
      params.push(agent);
    }

    if (status && status !== 'all') {
      whereClause += ' AND t.status = ?';
      params.push(isOracle ? parseInt(status) : status);
    }

    const tickets = await db.queryAll(`
      SELECT 
        t.ticket_id as ${alias('ticket_id')},
        t.title_de as ${alias('title')},
        t.description_de as ${alias('description')},
        t.status as ${alias('status')},
        t.agent as ${alias('agent')},
        t.reporter as ${alias('reporter')},
        t.type_id as ${alias('type_id')},
        t.priority_id as ${alias('priority_id')},
        t.CDB_CDATE as ${alias('created_at')},
        ty.type_name_de as ${alias('category_name')},
        pr.priority_name_de as ${alias('priority_name')},
        ag.name as ${alias('agent_name')},
        rp.name as ${alias('reporter_name')}
      FROM cs_ticket_ticket t
      LEFT JOIN cs_ticket_type ty ON t.type_id = ty.type_id
      LEFT JOIN cs_ticket_priority pr ON t.priority_id = pr.priority_id
      LEFT JOIN angestellter ag ON t.agent = ag.personalnummer
      LEFT JOIN angestellter rp ON t.reporter = rp.personalnummer
      ${whereClause}
      ORDER BY t.CDB_CDATE DESC
    `, params);

    const normalizedTickets = tickets.map(row => ({
      ticket_id: row[ticketIdCol],
      title: row[titleCol] || 'Ohne Titel',
      description: row[descriptionCol] || '',
      status: String(row[statusCol] ?? '0'),
      agent: row[agentCol],
      reporter: row[reporterCol],
      type_id: row[typeIdCol],
      priority_id: row[priorityIdCol],
      created_at: row[cdbCdateCol],
      category_name: row[categoryNameCol] || 'Unbekannt',
      priority_name: row[priorityNameCol] || 'Unbekannt',
      agent_name: row[agentNameCol] || 'Nicht zugewiesen',
      reporter_name: row[reporterNameCol] || 'Unbekannt'
    }));

    const labels = await getStatusLabels();
    const statusMap = {};
    STATUS_ORDER.forEach((code, index) => {
      statusMap[code] = { code, label: labels[code] || DEFAULT_STATUS_LABELS[code], order: index + 1 };
    });

    res.json({ tickets: normalizedTickets, statusMap });
  } catch (error) {
    console.error('Kanban tickets error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function getStatusLabels() {
  const db = getConfigDB();
  
  try {
    const rows = await db.queryAll('SELECT status_code, label FROM status_labels');
    const labels = {};
    rows.forEach(row => {
      labels[row.status_code] = row.label;
    });
    
    for (const code of STATUS_ORDER) {
      if (!labels[code]) {
        labels[code] = DEFAULT_STATUS_LABELS[code];
      }
    }
    
    return labels;
  } catch (error) {
    console.error('getStatusLabel error:', error);
    return { ...DEFAULT_STATUS_LABELS };
  }
}

router.get('/status-labels', async (req, res) => {
  try {
    const labels = await getStatusLabels();
    res.json({ labels });
  } catch (error) {
    console.error('GET /status-labels error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/status-labels', async (req, res) => {
  try {
    const { labels } = req.body;
    
    if (!labels || typeof labels !== 'object') {
      return res.status(400).json({ error: 'Labels sind erforderlich' });
    }
    
    const db = getConfigDB();
    
    try {
      for (const [code, label] of Object.entries(labels)) {
        await db.run(
          'INSERT OR REPLACE INTO status_labels (status_code, label) VALUES (?, ?)',
          [code, label]
        );
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('Error during insert:', err);
      throw err;
    }
  } catch (error) {
    console.error('POST /status-labels error:', error);
    res.status(500).json({ error: error.message });
  }
});

export async function initStatusLabelsTable() {
  const db = getConfigDB();
  
  await db.run(`
    CREATE TABLE IF NOT EXISTS status_labels (
      status_code TEXT PRIMARY KEY,
      label TEXT NOT NULL
    )
  `);
  
  const existing = await db.queryAll('SELECT COUNT(*) as count FROM status_labels');
  const count = existing[0]?.count || 0;
  
  if (count === 0) {
    for (const [code, label] of Object.entries(DEFAULT_STATUS_LABELS)) {
      await db.run(
        'INSERT INTO status_labels (status_code, label) VALUES (?, ?)',
        [code, label]
      );
    }
  }
}

export default router;
