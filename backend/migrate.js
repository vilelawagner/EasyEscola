#!/usr/bin/env node
require('tsx/cjs');
const knex = require('knex');
const config = require('./src/config/knexfile.ts').default;

const db = knex(config.development);

db.migrate
  .latest()
  .then(() => {
    console.log('✓ Migrations executadas com sucesso!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ Erro ao executar migrations:', err);
    process.exit(1);
  });
