const app = require('./app');
const taskService = require('./services/taskService');

async function start() {
  const portValue = process.env.PORT ?? '3000';
  const port = Number(portValue);
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT 1–65535 arasında bir tam sayı olmalıdır.');
  }

  // Bozuk veya erişilemeyen veriyle sunucuyu açma.
  await taskService.initialize();
  const server = app.listen(port, () => {
    console.log('TASKFLOW API http://localhost:' + port + ' adresinde dinleniyor.');
  });
  server.on('error', (error) => {
    console.error(error.code === 'EADDRINUSE'
      ? 'Port ' + port + ' kullanımda. Başka bir PORT seçin.'
      : 'Sunucu başlatılamadı: ' + error.message);
    process.exitCode = 1;
  });
}

start().catch((error) => {
  console.error('Sunucu başlatılamadı:', error);
  process.exitCode = 1;
});
