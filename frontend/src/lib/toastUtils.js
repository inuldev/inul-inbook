import { toast } from "react-hot-toast";

/**
 * Show a success toast notification
 * @param {string} message - Success message to display
 */
export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-center",
    style: {
      background: "#10B981",
      color: "#fff",
      fontWeight: "bold",
    },
  });
};

/**
 * Show an error toast notification
 * @param {string} message - Error message to display
 */
export const showErrorToast = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-center",
    style: {
      background: "#EF4444",
      color: "#fff",
      fontWeight: "bold",
    },
  });
};

/**
 * Show an info toast notification
 * @param {string} message - Info message to display
 */
export const showInfoToast = (message) => {
  toast(message, {
    duration: 3000,
    position: "top-center",
    style: {
      background: "#3B82F6",
      color: "#fff",
      fontWeight: "bold",
    },
  });
};
