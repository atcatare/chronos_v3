import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the notification service.
   * Requests permissions and sets up configuration.
   */
  async init() {
    if (this.isInitialized) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    this.isInitialized = true;
  }

  /**
   * Schedule a daily reminder notification.
   * @param {number} hour - The hour (0-23)
   * @param {number} minute - The minute (0-59)
   * @param {string} [title] - Notification title
   * @param {string} [body] - Notification body
   */
  async scheduleDailyReminder(hour, minute, title = 'Daily Reminder', body = 'Time to check your journal!') {
    // Cancel existing notifications to avoid duplicates if re-scheduling
    // Or you might want to manage IDs specifically, but for a single daily reminder, 
    // it's safer to clear previous ones or use a constant identifier if the API supports it.
    // Here we'll just schedule a new one. The caller might want to cancelAll first.

    // Check if we need to request permissions again
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await this.init();
    }

    const time = new Date();
    time.setHours(hour);
    time.setMinutes(minute);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      },
    });

    return identifier;
  }

  /**
   * Cancel all scheduled notifications.
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get all scheduled notifications (for debugging/verification).
   */
  async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();
