import React, { useMemo } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDatabaseRepository } from './src/db/getDb';
import { BatchSyncService } from './src/sync/syncService';
import { smsReader } from './src/sms/smsReader';
import { AppShell } from './src/navigation/AppShell';

function App() {
  const repository = useMemo(() => getDatabaseRepository(), []);
  const syncService = useMemo(
    () => new BatchSyncService(repository, smsReader),
    [repository]
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <AppShell
          repository={repository}
          syncService={syncService}
          smsReader={smsReader}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});

export default App;
