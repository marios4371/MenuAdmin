const BASE_URL = 'https://jqh5mcshzzlag7z26d76elkf6u0vtgzw.lambda-url.eu-central-1.on.aws';

// ─── functions for posada mapping and transformation ───────────────────────────────────

function resolveText(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.el || val.en || '';
}

function isTabBasedMenu(menu) {
  return Array.isArray(menu) && menu.length > 0 &&
    typeof menu[0].tabId === 'string' &&
    Array.isArray(menu[0].categories);
}

function flattenTabMenu(tabs) {
  const flat = [];
  tabs.forEach((tab, tabIdx) => {
    (tab.categories || []).forEach((cat, catIdx) => {
      if (cat.type === 'welcome' || cat.type === 'footer') return;
      flat.push({
        id: tab.tabId + '__' + catIdx,
        title: resolveText(tab.tabName) + ' › ' + resolveText(cat.name),
        _tabIdx: tabIdx,
        _catIdx: catIdx,
        items: (cat.items || []).map(item => ({
          name: resolveText(item.name) || resolveText(item.label) || '',
          price: item.price || '',
          description: resolveText(item.desc) || resolveText(item.note) || resolveText(item.ingredients) || '',
          station: item.station || 'BAR',
          _original: item,
        })),
      });
    });
  });
  return flat;
}

function denormalizeTabMenu(flatMenu, originalTabs) {
  const tabs = JSON.parse(JSON.stringify(originalTabs));

  const flatLookup = new Map();
  flatMenu.forEach(flatCat => {
    if (flatCat._tabIdx !== undefined && flatCat._catIdx !== undefined) {
      flatLookup.set(`${flatCat._tabIdx}_${flatCat._catIdx}`, flatCat);
    }
  });

  tabs.forEach((tab, tabIdx) => {
    (tab.categories || []).forEach((cat, catIdx) => {
      const flatCat = flatLookup.get(`${tabIdx}_${catIdx}`);
      if (!flatCat) return; // welcome/footer — preserve unchanged

      cat.items = flatCat.items.map(item => {
        const orig = item._original || {};
        const name = typeof orig.name === 'object' && orig.name !== null
          ? { ...orig.name, el: item.name }
          : item.name;
        const label = orig.label
          ? (typeof orig.label === 'object' ? { ...orig.label, el: item.name } : item.name)
          : undefined;
        const desc = orig.desc
          ? (typeof orig.desc === 'object' ? { ...orig.desc, el: item.description } : (item.description || orig.desc))
          : undefined;
        const note = orig.note
          ? (typeof orig.note === 'object' ? { ...orig.note, el: item.description } : (item.description || orig.note))
          : undefined;
        const ingredients = orig.ingredients !== undefined
          ? (item.description || orig.ingredients)
          : undefined;

        return {
          ...orig,
          ...(label !== undefined ? { label } : { name }),
          price: item.price,
          ...(desc !== undefined ? { desc } : {}),
          ...(note !== undefined ? { note } : {}),
          ...(ingredients !== undefined ? { ingredients } : {}),
        };
      });
    });
  });

  return tabs;
}

// ─────────────────────────────────────────────────────────────────────────────

export const api = {
  login: async (shopId, password) => {
    console.log(`[LOGIN ATTEMPT] Connecting to: ${BASE_URL}/login`);
    console.log(`[PAYLOAD] Shop: ${shopId}, Pass: ${password}`);
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ shopId, password })
      });
      console.log(`[STATUS] Response Code: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SERVER ERROR] Body: ${errorText}`);
        return { success: false, error: `Server Error (${response.status}): ${errorText}` };
      }
      const data = await response.json();
      console.log(`[SUCCESS] Data:`, data);
      return data;
    } catch (error) {
      console.error("[NETWORK CRASH]", error);
      return { success: false, error: "Network Error or CORS. Check Console." };
    }
},

  getFullData: async (shopId, password) => {
    try {
      const response = await fetch(`${BASE_URL}/get-full-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, password }),
      });

      if (!response.ok) return { success: false, error: 'Failed to load data' };

      const data = await response.json();

      // Standard nested-menu fix
      if (data.menu && !Array.isArray(data.menu) && Array.isArray(data.menu.menu)) {
        data.menu = data.menu.menu;
      }

      // Tab-based (Posada-style) normalization  ← ΝΕΟ
      if (isTabBasedMenu(data.menu)) {
        data._originalMenu = JSON.parse(JSON.stringify(data.menu));
        data.menu = flattenTabMenu(data.menu);
      }

      if (!Array.isArray(data.menu)) {
        data.menu = [];
      }

      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getMenuData: async (shopId, password) => {
    return api.getFullData(shopId, password);
  },

  saveMenu: async (shopId, password, fullShopData) => {
    try {
      let dataToSave = { ...fullShopData };

      // Denormalize tab-based menu back to original structure  ← ΝΕΟ
      if (dataToSave._originalMenu) {
        const newTabMenu = denormalizeTabMenu(dataToSave.menu, dataToSave._originalMenu);
        dataToSave = { ...dataToSave, menu: newTabMenu };
        delete dataToSave._originalMenu;
      }

      const response = await fetch(`${BASE_URL}/save-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, password, data: dataToSave }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  saveMenuData: async (shopId, password, fullShopData) => {
    return api.saveMenu(shopId, password, fullShopData);
  }
};