const app = require('./app');
const config = require('./config/config');

const PORT = config.port;

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando no modo ${config.nodeEnv} na porta ${PORT}`);
});
