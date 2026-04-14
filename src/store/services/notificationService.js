import api from "../api/axiosClient";

const notificationService = {
  getNotifications: async (userId) => {
    try {
      const response = await api.get(`/notifications/user/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },

  markAllAsRead: async (userId) => {
    try {
      await api.patch(`/notifications/user/${userId}/read-all`);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
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
