import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { CalendarEntry } from "./models";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission for push notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    // Notifications not supported on web
    return false;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

/**
 * Schedule a notification for an entry
 */
export async function scheduleEntryNotification(
  entry: CalendarEntry,
): Promise<void> {
  if (Platform.OS === "web" || !entry.notifyEnabled) {
    return;
  }

  try {
    const [year, month, day] = entry.date.split("-").map(Number);
    const notifyDate = new Date(year, month - 1, day, 0, 0, 0);

    // Subtract the minutes before
    const minutesBefore = entry.notifyMinutesBefore || 0;
    notifyDate.setMinutes(notifyDate.getMinutes() - minutesBefore);

    // Only schedule if the time is in the future
    if (notifyDate > new Date()) {
      const secondsUntilNotification = Math.floor(
        (notifyDate.getTime() - Date.now()) / 1000,
      );
      if (secondsUntilNotification > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: entry.title,
            body: entry.description || "You have an upcoming entry",
            data: { entryId: entry.id },
          },
          trigger: {
            type: "interval",
            seconds: Math.max(
              1,
              Math.min(secondsUntilNotification, 7 * 24 * 60 * 60),
            ),
          } as any,
        });
      }
    }
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
}

/**
 * Cancel notifications for an entry
 */
export async function cancelEntryNotification(entryId: string): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const notifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = notifications.filter(
      (notif) => notif.content.data?.entryId === entryId,
    );

    for (const notif of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
}
