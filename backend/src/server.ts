import app from './app';
import db from './config/database';
import logger from './utils/logger';
import { FinanceScheduler } from './services/FinanceScheduler';

const PORT = process.env.APP_PORT || 4000;

// Testa conexão com o banco
const testDatabaseConnection = async (): Promise<void> => {
  try {
    await db.raw('SELECT 1');
    logger.info('✓ Conexão com o banco de dados estabelecida');
  } catch (error) {
    logger.error('✗ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
};

// Inicia o servidor
const startServer = async (): Promise<void> => {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
      
      // Iniciar scheduler de finanças
      FinanceScheduler.startScheduler();
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} recebido. Encerrando gracefully...`);

  try {
    await db.destroy();
    logger.info('Conexões com banco de dados fechadas');
    process.exit(0);
  } catch (error) {
    logger.error('Erro durante shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Captura erros não tratados
process.on('unhandledRejection', (reason: Error | any) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
