import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  initializeNotifications,
  checkForMissedDoses,
  ensureDailyVitalsReminderScheduled,
} from '../services/notifications';

export default function useNotifications() {
  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    (async () => {
      await initializeNotifications();
      await ensureDailyVitalsReminderScheduled();
      if (!isMounted) return;

      // periodic missed-dose check every 30 minutes
      intervalId = setInterval(() => {
        checkForMissedDoses().catch(() => {});
      }, 30 * 60 * 1000);
    })();

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        checkForMissedDoses().catch(() => {});
      }
    };

    const sub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      sub.remove();
    };
  }, []);
}
