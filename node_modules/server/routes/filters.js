import { Router } from 'express';
import { getKpiDB } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getKpiDB();

    // Reporter: Kürzel + Name aus angestellter
    const reporters = await db.queryAll(`
      SELECT DISTINCT 
        t.reporter as id, 
        a.name as name
      FROM cs_ticket_ticket t
      JOIN angestellter a ON t.reporter = a.personalnummer
      WHERE t.reporter IS NOT NULL AND t.reporter != ''
      ORDER BY a.name
    `);

    // Agent: Kürzel + Name aus angestellter
    const agents = await db.queryAll(`
      SELECT DISTINCT 
        t.agent as id, 
        a.name as name
      FROM cs_ticket_ticket t
      JOIN angestellter a ON t.agent = a.personalnummer
      WHERE t.agent IS NOT NULL AND t.agent != ''
      ORDER BY a.name
    `);

    // Categories: ID + Name aus cs_ticket_type
    const categories = await db.queryAll(`
      SELECT DISTINCT 
        ty.type_id as id, 
        ty.type_name_de as name
      FROM cs_ticket_type ty
      WHERE ty.type_name_de IS NOT NULL
      ORDER BY ty.type_name_de
    `);

    // Priorities: ID + Name aus cs_ticket_priority
    const priorities = await db.queryAll(`
      SELECT DISTINCT 
        p.priority_id as id, 
        p.priority_name_de as name
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
