// services/api.js


const BASE_URL = 'https://jqh5mcshzzlag7z26d76elkf6u0vtgzw.lambda-url.eu-central-1.on.aws';

export const api = {
  login: async (shopId, password) => {
    console.log(`[LOGIN ATTEMPT] Connecting to: ${BASE_URL}/login`);
    console.log(`[PAYLOAD] Shop: ${shopId}, Pass: ${password}`);

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json' // Λέμε στον server ότι θέλουμε JSON
        },
        body: JSON.stringify({ shopId, password }) // το backend περιμένει { shopId, password }
      });

      console.log(`[STATUS] Response Code: ${response.status}`);

      // ΑΝ ΔΕΝ ΕΙΝΑΙ 200 (OK), ΔΙΑΒΑΣΕ ΤΟ ΚΕΙΜΕΝΟ ΤΟΥ ERROR
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SERVER ERROR] Body: ${errorText}`);
        return { success: false, error: `Server Error (${response.status}): ${errorText}` };
      }

      // ΑΝ ΕΙΝΑΙ 200, ΚΑΝΕ PARSE ΤΟ JSON
      const data = await response.json();
      console.log(`[SUCCESS] Data:`, data);
      return data;

    } catch (error) {
      console.error("[NETWORK CRASH]", error);
      return { success: false, error: "Network Error or CORS. Check Console." };
    }
  },

  // 2. GET FULL DATA
  getFullData: async (shopId, password) => {
    try {
        const response = await fetch(`${BASE_URL}/get-full-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shopId, password }),
        });
        
        if (!response.ok) return { success: false, error: "Failed to load data" };

        const data = await response.json();

        // --- SMART FIX ---
        if (data.menu && !Array.isArray(data.menu) && Array.isArray(data.menu.menu)) {
            data.menu = data.menu.menu;
        }
        if (!Array.isArray(data.menu)) {
            console.warn('[API] Unexpected menu shape for shopId:', data.menu);
            data.menu = [];
        }

        return data;

    } catch (error) {
        return { success: false, error: error.message };
    }
  },

  // Alias για συμβατότητα με το UI
  getMenuData: async (shopId, password) => {
      return api.getFullData(shopId, password);
  },

  // 3. SAVE MENU
  saveMenu: async (shopId, password, fullShopData) => {
    try {
        const response = await fetch(`${BASE_URL}/save-menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shopId,
                password,
                data: fullShopData // ΠΛΕΟΝ ΣΤΕΛΝΕΙ ΟΛΟΚΛΗΡΟ ΤΟ ΑΝΤΙΚΕΙΜΕΝΟ ΑΘΙΚΤΟ
            }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
  },

  // Alias για συμβατότητα με το UI
  saveMenuData: async (shopId, password, fullShopData) => {
      return api.saveMenu(shopId, password, fullShopData);
  }
};