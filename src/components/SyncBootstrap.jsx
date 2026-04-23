import { useEffect } from 'react';
import { useUser } from './Usercontext';
import { flushPendingSync } from '../syncEngine';
import { offlineManager } from '../offlineStore';

export default function SyncBootstrap() {
  const { user } = useUser();

  useEffect(() => {
    if (!user?.id) return;

    const syncNow = () => {
      flushPendingSync(user.id).catch((error) => {
        console.error('Background sync failed:', error);
      });
    };

    const maintain = () => {
      offlineManager.runMaintenance().catch((error) => {
        console.error('Offline maintenance failed:', error);
      });
    };

    syncNow();
    maintain();
    window.addEventListener('online', syncNow);
    const timer = window.setInterval(syncNow, 30000);
    const maintenanceTimer = window.setInterval(maintain, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', syncNow);
      window.clearInterval(timer);
      window.clearInterval(maintenanceTimer);
    };
  }, [user?.id]);

  return null;
}
