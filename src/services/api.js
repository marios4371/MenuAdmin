// src/services/api.js
import axios from 'axios';

// ΒΑΛΕ ΕΔΩ ΤΟ URL ΤΟΥ LAMBDA ΣΟΥ (Χωρίς το / στο τέλος)
const BASE_URL = 'https://jqh5mcshzzlag7z26d76elkf6u0vtgzw.lambda-url.eu-central-1.on.aws';

export const api = {
  // 1. Login Function
  login: async (shop_id, password) => {
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        shop_id,
        password
      });
      return response.data; // { success: true, message: "..." }
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      return { success: false, message: "Connection Error" };
    }
  },

  // 2. Get Data Function
  getMenuData: async (shop_id, password) => {
    try {
      const response = await axios.post(`${BASE_URL}/get-data`, {
        shop_id,
        password
      });
      return response.data; // Επιστρέφει όλο το JSON του μαγαζιού
    } catch (error) {
      console.error("Get Data Error:", error);
      return null;
    }
  },

  // 3. Save Data Function (Θα το χρειαστούμε αργότερα)
  saveMenuData: async (shop_id, password, newData) => {
    try {
      const response = await axios.post(`${BASE_URL}/save-data`, {
        shop_id,
        password,
        newData
      });
      return response.data;
    } catch (error) {
      console.error("Save Error:", error);
      return { success: false };
    }
  }
};