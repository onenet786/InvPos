const path = require('path');
const fs = require('fs');

// Simple migration runner that executes SQL files in order
async function runMigrations(direction = 'up') {
  const sequelize = require('../config/database');
  const migrationsDir = path.join(__dirname, 'migrations');

  // Ensure migrations table exists
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS sequelize_meta (
      name VARCHAR(255) PRIMARY KEY
    );
  `);

  const [executed] = await sequelize.query('SELECT name FROM sequelize_meta ORDER BY name;');
  const executedNames = executed.map((r) => r.name);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (direction === 'undo') {
    // Undo last migration
    const lastExecuted = executedNames[executedNames.length - 1];
    if (!lastExecuted) {
      console.log('No migrations to undo.');
      process.exit(0);
    }
    const filePath = path.join(migrationsDir, lastExecuted);
    const sql = fs.readFileSync(filePath, 'utf8');
    const downMatch = sql.match(/-- DOWN[\s\S]*$/i);
    if (downMatch) {
      const downSql = downMatch[0].replace(/-- DOWN\s*/i, '').trim();
      if (downSql) {
        await sequelize.query(downSql);
        await sequelize.query('DELETE FROM sequelize_meta WHERE name = $1;', {
          bind: [lastExecuted],
        });
        console.log(`Reverted: ${lastExecuted}`);
      }
    }
  } else {
    for (const file of files) {
      if (executedNames.includes(file)) continue;
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const upMatch = sql.match(/-- UP\s*([\s\S]*?)(-- DOWN|$)/i);
      if (upMatch) {
        const upSql = upMatch[1].trim();
        if (upSql) {
          await sequelize.query(upSql);
          await sequelize.query('INSERT INTO sequelize_meta (name) VALUES ($1);', {
            bind: [file],
          });
          console.log(`Migrated: ${file}`);
        }
      }
    }
  }

  await sequelize.close();
  console.log('Migrations complete.');
  process.exit(0);
}

const direction = process.argv.includes('--undo') ? 'undo' : 'up';
runMigrations(direction).catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
