import { Router } from 'express';
import { getKpiDB } from '../db.js';

const router = Router();

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

router.get('/', (req, res) => {
  try {
    const reporters = queryAll(`
      SELECT DISTINCT mapped_reporter as id, mapped_reporter as name 
      FROM cs_tickets 
      WHERE mapped_reporter IS NOT NULL AND mapped_reporter != ''
      ORDER BY mapped_reporter
    `);

    const agents = queryAll(`
      SELECT DISTINCT mapped_agent as id, mapped_agent as name 
      FROM cs_tickets 
      WHERE mapped_agent IS NOT NULL AND mapped_agent != ''
      ORDER BY mapped_agent
    `);

    const categories = queryAll(`
      SELECT DISTINCT type_name_de as id, type_name_de as name 
      FROM cs_tickets 
      WHERE type_name_de IS NOT NULL
      ORDER BY type_name_de
    `);

    const priorities = queryAll(`
      SELECT DISTINCT priority_name_de as id, priority_name_de as name 
      FROM cs_tickets 
      WHERE priority_name_de IS NOT NULL
      ORDER BY 
        CASE priority_name_de
          WHEN 'Kritisch' THEN 1
          WHEN 'Hoch' THEN 2
          WHEN 'Mittel' THEN 3
          WHEN 'Niedrig' THEN 4
        END
    `);

    res.json({
      reporters,
      agents,
      categories,
      priorities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
