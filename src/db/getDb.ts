import { IDatabaseDriver } from './driver';
import { initDatabase } from './schema';
import { DatabaseRepository } from './repository';
import { Platform } from 'react-native';

let repoInstance: DatabaseRepository | null = null;

export function getDatabaseRepository(customDriver?: IDatabaseDriver): DatabaseRepository {
  if (customDriver) {
    initDatabase(customDriver);
    return new DatabaseRepository(customDriver);
  }

  if (!repoInstance) {
    let driver: IDatabaseDriver;
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        const { createOpSqliteDriver } = require('./opSqliteDriver');
        driver = createOpSqliteDriver('expenseSummary.sqlite');
      } else {
        const { createNodeSqliteDriver } = require('./nodeDriver');
        driver = createNodeSqliteDriver(':memory:');
      }
    } catch {
      const { createNodeSqliteDriver } = require('./nodeDriver');
      driver = createNodeSqliteDriver(':memory:');
    }
    initDatabase(driver);
    repoInstance = new DatabaseRepository(driver);
  }
  return repoInstance;
}

export function resetDatabaseRepository(): void {
  repoInstance = null;
}
