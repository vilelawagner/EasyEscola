#!/usr/bin/env node
require('tsx/cjs');
const knex = require('knex');
const config = require('./src/config/knexfile.ts').default;

const db = knex(config.development);

db.seed
  .run()
  .then(() => {
    console.log('✓ Seeds executados com sucesso!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ Erro ao executar seeds:', err);
    process.exit(1);
  });
