/**
 * Notification Service for Medication Reminders
 * Handles scheduling and managing medication reminder notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDatabase } from './database';
import { DoseStatus, DoseGuidance } from '../types';
import { MISSED_DOSE_WINDOW } from '../constants/clinical';
import type { Medication } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Additional fields for newer NotificationBehavior typings
    // These may be ignored on some platforms but satisfy TS typing
    // @ts-ignore
    shouldShowBanner: true,
    // @ts-ignore
    shouldShowList: true,
  }),
});

/**
 * Initialize notification system
 */
export async function initializeNotifications(): Promise<boolean> {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // Set up notification categories with action buttons
    await setupNotificationCategories();

    // Set up notification response listener
    setupNotificationResponseListener();

    // Set up listener for when notification is tapped to open app
    Notifications.addNotificationReceivedListener(async notification => {
      // Dismiss notification when app is in foreground
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    });

    console.log('Notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
}

/**
 * Set up notification categories with action buttons
 */
async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  await Notifications.setNotificationCategoryAsync('MEDICATION_REMINDER', [
    {
      identifier: 'TAKEN',
      buttonTitle: 'Taken ✓',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'SKIP',
      buttonTitle: 'Skip',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: 'Snooze 15m',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

/**
 * Set up listener for notification responses (action buttons)
 */
function setupNotificationResponseListener(): void {
  Notifications.addNotificationResponseReceivedListener(async response => {
    const { medicationId, doseId, medicationName } =
      response.notification.request.content.data as any;
    const action = response.actionIdentifier;

    try {
      const db = getDatabase();

      // Dismiss the notification immediately
      await Notifications.dismissNotificationAsync(response.notification.request.identifier);

      if (action === 'TAKEN') {
        // Mark dose as taken
        await db.runAsync(
          'UPDATE doses SET status = ?, actual_time = ? WHERE id = ?',
          [DoseStatus.Taken, new Date().toISOString(), doseId]
        );
        console.log(`Dose ${doseId} marked as taken`);
      } else if (action === 'SKIP') {
        // Mark dose as skipped
        await db.runAsync(
          'UPDATE doses SET status = ?, actual_time = ? WHERE id = ?',
          [DoseStatus.Skipped, new Date().toISOString(), doseId]
        );
        console.log(`Dose ${doseId} marked as skipped`);
      } else if (action === 'SNOOZE') {
        // Reschedule notification for 15 minutes later
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${medicationName}`,
            body: response.notification.request.content.body || 'Time for your medication',
            data: { medicationId, doseId, medicationName },
            categoryIdentifier: 'MEDICATION_REMINDER',
          },
          trigger: ({ seconds: 15 * 60, repeats: false } as unknown) as Notifications.NotificationTriggerInput,
        });
        console.log(`Notification snoozed for 15 minutes`);
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  });
}

/**
 * Handle a notification action programmatically (exported for testing/integration)
 */
export async function handleNotificationAction(
  actionIdentifier: string,
  notification: Notifications.Notification
): Promise<void> {
  const { medicationId, doseId, medicationName } = notification.request.content
    .data as any;

  const fakeResponse: any = {
    actionIdentifier,
    notification,
  };
  // Reuse existing listener logic by calling directly
  try {
    const db = getDatabase();

    if (actionIdentifier === 'TAKEN') {
      await db.runAsync(
        'UPDATE doses SET status = ?, actual_time = ? WHERE id = ?',
        [DoseStatus.Taken, new Date().toISOString(), doseId]
      );
    } else if (actionIdentifier === 'SKIP') {
      await db.runAsync(
        'UPDATE doses SET status = ?, actual_time = ? WHERE id = ?',
        [DoseStatus.Skipped, new Date().toISOString(), doseId]
      );
    } else if (actionIdentifier === 'SNOOZE') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${medicationName}`,
          body: notification.request.content.body || 'Time for your medication',
          data: { medicationId, doseId, medicationName },
          categoryIdentifier: 'MEDICATION_REMINDER',
        },
        trigger: ({ seconds: 15 * 60, repeats: false } as unknown) as Notifications.NotificationTriggerInput,
      });
    }
  } catch (error) {
    console.error('Error in handleNotificationAction:', error);
  }
}

/**
 * Schedule a medication reminder notification
 */
export async function scheduleMedicationNotification(
  medicationId: string,
  doseId: string,
  time: string, // "08:00" format
  medicationName: string,
  dosage: string,
  foodInstructions?: string
): Promise<string | null> {
  try {
    const [hour, minute] = time.split(':').map(Number);

    const body = `${dosage}${foodInstructions ? ` • ${foodInstructions}` : ''}`;

    const notificationBody = body.replace(/\u0007/g, '•');
    const trigger = ({ hour, minute, repeats: true } as unknown) as Notifications.NotificationTriggerInput;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${medicationName}`,
        body: notificationBody,
        data: {
          medicationId,
          doseId,
          medicationName,
          type: 'medication_reminder',
        },
        categoryIdentifier: 'MEDICATION_REMINDER',
        sound: true,
      },
      trigger,
    });

    console.log(`Scheduled notification ${notificationId} for ${time}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule all notifications for a medication
 */
export async function scheduleMedicationNotifications(
  medicationId: string,
  medicationName: string,
  dosage: string,
  times: string[],
  foodInstructions?: string
): Promise<string[]> {
  const notificationIds: string[] = [];

  for (const time of times) {
    const doseId = `dose-${medicationId}-${time}`; // Simple ID generation
    const notificationId = await scheduleMedicationNotification(
      medicationId,
      doseId,
      time,
      medicationName,
      dosage,
      foodInstructions
    );

    if (notificationId) {
      notificationIds.push(notificationId);
    }
  }

  return notificationIds;
}

/**
 * Prompt 7 wrapper: schedule reminders for a medication object
 */
export async function scheduleMedicationReminders(
  medication: Medication
): Promise<void> {
  await scheduleMedicationNotifications(
    medication.id,
    // Use brand or generic if available via joined data; fallback to registration number
    (medication as any)?.mims?.brandName || (medication as any)?.mims?.genericName || medication.registrationNo,
    medication.userDosage,
    medication.times,
    undefined
  );
}

/**
 * Cancel all notifications for a medication
 */
export async function cancelMedicationNotifications(
  medicationId: string
): Promise<void> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of notifications) {
      const data = notification.content.data as any;
      if (data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
        console.log(`Cancelled notification ${notification.identifier}`);
      }
    }
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

/**
 * Prompt 7 wrapper: cancel all reminders for a medicationId
 */
export async function cancelMedicationReminders(medicationId: string): Promise<void> {
  await cancelMedicationNotifications(medicationId);
}

/**
 * Cancel a specific notification by ID
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled notification ${notificationId}`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Clear all presented notifications from the notification tray
 * Call this on app launch to clear any lingering notifications
 */
export async function clearAllPresentedNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.log('Cleared all presented notifications');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Schedule a one-time notification (for testing or reminders)
 */
export async function scheduleOneTimeNotification(
  title: string,
  body: string,
  seconds: number
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: ({ seconds, repeats: false } as unknown) as Notifications.NotificationTriggerInput,
  });

  return notificationId;
}

/**
 * Create dose entries for a medication
 * This should be called when adding a new medication
 */
export async function createDoseEntries(
  medicationId: string,
  times: string[],
  startDate: string
): Promise<void> {
  const db = getDatabase();
  const start = new Date(startDate);

  // Create dose entries for the next 7 days
  for (let day = 0; day < 7; day++) {
    const doseDate = new Date(start);
    doseDate.setDate(doseDate.getDate() + day);

    for (const time of times) {
      const [hour, minute] = time.split(':').map(Number);
      doseDate.setHours(hour, minute, 0, 0);

      const doseId = `${medicationId}-${doseDate.toISOString()}`;

      await db.runAsync(
        `INSERT INTO doses (id, medication_id, scheduled_time, status, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          doseId,
          medicationId,
          doseDate.toISOString(),
          DoseStatus.Pending,
          new Date().toISOString(),
        ]
      );
    }
  }

  console.log(`Created dose entries for medication ${medicationId}`);
}

/**
 * Check for missed doses and update their status
 */
export async function updateMissedDoses(): Promise<void> {
  const db = getDatabase();
  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

  await db.runAsync(
    `UPDATE doses
     SET status = ?
     WHERE status = ?
     AND scheduled_time < ?`,
    [DoseStatus.Missed, DoseStatus.Pending, fourHoursAgo.toISOString()]
  );

  console.log('Updated missed doses');
}

/**
 * Compute missed-dose guidance based on elapsed time and next dose proximity
 */
export function getMissedDoseGuidance(
  scheduledTime: Date,
  nextDoseTime: Date
): DoseGuidance {
  const now = new Date();
  const diffHours = (now.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60);
  const untilNextHours = (nextDoseTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours <= MISSED_DOSE_WINDOW.takeLateWindow) {
    return { action: 'take_now', message: 'Take now and continue your schedule.' };
  }

  if (diffHours > MISSED_DOSE_WINDOW.skipAndWaitWindow && untilNextHours < 2) {
    return { action: 'skip', message: 'Skip this dose and take your next dose as scheduled.' };
  }

  return { action: 'adjust', message: 'Take now and adjust your next dose timing if needed.' };
}

/**
 * Check for pending doses scheduled >30 minutes ago and send a follow-up notification
 * This should be called sparingly to avoid spamming - typically once per app launch or manually
 */
export async function checkForMissedDoses(): Promise<void> {
  const db = getDatabase();
  const now = new Date();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();

  // Only check for doses that are pending and between 30 mins and 4 hours ago
  // After 4 hours, they should be marked as missed by updateMissedDoses
  const pending = await db.getAllAsync<{
    id: string;
    medication_id: string;
    scheduled_time: string;
    user_dosage: string;
    times: string;
    registration_no: string;
  }>(
    `SELECT d.id, d.medication_id, d.scheduled_time, m.user_dosage, m.times, m.registration_no
     FROM doses d
     JOIN medications m ON d.medication_id = m.id
     WHERE d.status = 'pending'
     AND d.scheduled_time <= ?
     AND d.scheduled_time >= ?
     LIMIT 5`,
    [thirtyMinsAgo, fourHoursAgo]
  );

  // Only send follow-up if there are pending doses
  if (pending.length > 0) {
    for (const row of pending) {
      const medName = row.registration_no || 'your medication';
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Did you take ${medName}?`,
          body: 'Please confirm your dose to keep your adherence on track.',
          data: { medicationId: row.medication_id, doseId: row.id, medicationName: medName },
          categoryIdentifier: 'MEDICATION_REMINDER',
        },
        trigger: ({ seconds: 1, repeats: false } as unknown) as Notifications.NotificationTriggerInput,
      });
    }
    console.log(`Sent follow-up notifications for ${pending.length} pending doses`);
  }
}

/**
 * Get adherence statistics for a medication
 */
export async function getAdherenceStats(
  medicationId: string,
  days: number = 7
): Promise<{
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  adherenceRate: number;
}> {
  const db = getDatabase();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const stats = await db.getFirstAsync<{
    total: number;
    taken: number;
    skipped: number;
    missed: number;
  }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken,
       SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
       SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
     FROM doses
     WHERE medication_id = ?
     AND scheduled_time >= ?`,
    [medicationId, sinceDate.toISOString()]
  );

  const total = stats?.total || 0;
  const taken = stats?.taken || 0;
  const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

  return {
    total,
    taken,
    skipped: stats?.skipped || 0,
    missed: stats?.missed || 0,
    adherenceRate: Math.round(adherenceRate * 10) / 10, // Round to 1 decimal
  };
}
