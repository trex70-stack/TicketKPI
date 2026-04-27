import { Router } from 'express';
import { getExcelBuffer, getClosedTicketsData } from './closed-tickets-report.js';

const router = Router();

router.get('/closed-tickets/:year?', async (req, res) => {
  try {
    const year = req.params.year || '26';
    
    if (!/^\d{2}$/.test(year) && !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: 'Ungültiges Jahr. Bitte 2- oder 4-stelliges Jahr angeben.' });
    }
    
    const yearShort = year.length === 4 ? year.slice(2) : year;
    
    const format = req.query.format || 'excel';
    
    if (format === 'json') {
      const data = await getClosedTicketsData(yearShort);
      return res.json({
        year: `20${yearShort}`,
        count: data.length,
        tickets: data
      });
    }
    
    const buffer = await getExcelBuffer(yearShort);
    
    const filename = `geschlossene_tickets_20${yearShort}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
