import api from "../api/axiosClient";

function resolveIsRead(notification) {
  if (!notification || typeof notification !== "object") return false;

  const direct = notification.isRead ?? notification.read ?? notification.seen;
  if (typeof direct === "boolean") return direct;

  const status = String(
    notification.status ?? notification.readStatus ?? notification.state ?? "",
  )
    .trim()
    .toUpperCase();

  if (["READ", "SEEN", "DONE", "VIEWED"].includes(status)) return true;

  if (notification.readAt || notification.seenAt) return true;

  return false;
}

function normalizeNotification(notification) {
  return {
    ...notification,
    notificationId: notification?.notificationId ?? notification?.id,
    isRead: resolveIsRead(notification),
  };
}

const notificationService = {
  getNotifications: async (userId) => {
    try {
      const response = await api.get(`/notifications/user/${userId}`);
      const raw = response?.data?.data;
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeNotification);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  },

  markAllAsRead: async (userId) => {
    try {
      await api.patch(`/notifications/user/${userId}/read-all`);
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  },

  clearAllNotifications: async (userId) => {
    try {
      await api.delete(`/notifications/user/${userId}`);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  },
};

export default notificationService;
