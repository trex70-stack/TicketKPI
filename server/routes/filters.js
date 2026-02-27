import { Router } from 'express';
import { getKpiDB, getDbType } from '../db.js';
import { alias } from '../sqlUtils.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getKpiDB();
    const isOracle = getDbType() === 'oracle';

    const notEmpty = isOracle ? 'IS NOT NULL' : "IS NOT NULL AND t.reporter != ''";
    const idCol = isOracle ? 'ID' : 'id';
    const nameCol = isOracle ? 'NAME' : 'name';

    // Reporter: Kürzel + Name aus angestellter
    const reportersRaw = await db.queryAll(`
      SELECT DISTINCT 
        t.reporter as ${alias('id')}, 
        a.name as ${alias('name')}
      FROM cs_ticket_ticket t
      JOIN angestellter a ON t.reporter = a.personalnummer
      WHERE t.reporter ${notEmpty}
      ORDER BY a.name
    `);

    // Agent: Kürzel + Name aus angestellter
    const agentsRaw = await db.queryAll(`
      SELECT DISTINCT 
        t.agent as ${alias('id')}, 
        a.name as ${alias('name')}
      FROM cs_ticket_ticket t
      JOIN angestellter a ON t.agent = a.personalnummer
      WHERE t.agent ${notEmpty.replace(/reporter/g, 'agent')}
      ORDER BY a.name
    `);

    // Categories: ID + Name aus cs_ticket_type
    const categoriesRaw = await db.queryAll(`
      SELECT DISTINCT 
        ty.type_id as ${alias('id')}, 
        ty.type_name_de as ${alias('name')}
      FROM cs_ticket_type ty
      WHERE ty.type_name_de IS NOT NULL
      ORDER BY ty.type_name_de
    `);

    // Priorities: ID + Name aus cs_ticket_priority
    const prioritiesRaw = await db.queryAll(`
      SELECT DISTINCT 
        p.priority_id as ${alias('id')}, 
        p.priority_name_de as ${alias('name')}
      FROM cs_ticket_priority p
      WHERE p.priority_name_de IS NOT NULL
      ORDER BY 
        CASE p.priority_name_de
          WHEN 'Kritisch' THEN 1
          WHEN 'Hoch' THEN 2
          WHEN 'Mittel' THEN 3
          WHEN 'Niedrig' THEN 4
        END
    `);

    const normalize = (arr) => arr.map(row => ({
      id: row[idCol],
      name: row[nameCol]
    }));

    res.json({
      reporters: normalize(reportersRaw),
      agents: normalize(agentsRaw),
      categories: normalize(categoriesRaw),
      priorities: normalize(prioritiesRaw)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
