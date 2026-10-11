const express = require('express');
const taskRoutes = require('./routes/taskRoutes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Ayrıştırma hataları dahil bütün istekler önce loglanır.
app.use(logger);
app.use(express.json({ limit: '100kb', strict: false }));
app.use('/tasks', taskRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: 'İstenen endpoint bulunamadı.' },
  });
});

app.use(errorHandler);
module.exports = app;
