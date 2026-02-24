import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import filtersRouter from './routes/filters.js';
import reporterRouter from './routes/reporter.js';
import managementRouter from './routes/management.js';
import agentRouter from './routes/agent.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/filters', filtersRouter);
app.use('/api/reporter', reporterRouter);
app.use('/api/management', managementRouter);
app.use('/api/agent', agentRouter);

async function startServer() {
  try {
    await initDB();
    console.log('Database initialized successfully');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
