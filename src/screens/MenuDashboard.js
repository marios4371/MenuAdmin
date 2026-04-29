import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl, KeyboardAvoidingView, Platform, BackHandler, TouchableOpacity } from 'react-native';
import { Text, Card, Button, IconButton, ActivityIndicator, FAB, Divider, TextInput, Menu } from 'react-native-paper'; 
import { api } from '../services/api';
import { CommonActions } from '@react-navigation/native'; 

const COLORS = {
  primary: '#000000',    
  background: '#F4F4F4', 
  card: '#FFFFFF',       
  text: '#000000',       
  subtext: '#666666',    
  border: '#000000',     
};

const ToggleSwitch = ({ value, onToggle }) => {
    const isEnabled = value === 1;
    return (
        <TouchableOpacity
            onPress={onToggle}
            style={{
                width: 44, height: 24,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isEnabled ? '#000' : '#ccc',
                backgroundColor: isEnabled ? '#000' : '#fff',
                justifyContent: 'center',
                paddingHorizontal: 2,
                alignItems: isEnabled ? 'flex-end' : 'flex-start',
            }}
        >
            <View style={{
                width: 16, height: 16,
                borderRadius: 8,
                backgroundColor: isEnabled ? '#fff' : '#ccc',
            }} />
        </TouchableOpacity>
    );
};

export default function MenuDashboard({ route, navigation }) {
  const { shopId, password } = route.params;

  const [fullShopData, setFullShopData] = useState({}); // SOS: Κρατάει όλο το JSON άθικτο (μαζί με features)
  const [menuData, setMenuData] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('LIST');
  
  const [openCategoryIndex, setOpenCategoryIndex] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Data Holders
  const [editingCatIndex, setEditingCatIndex] = useState(null);
  const [editingProdCoords, setEditingProdCoords] = useState(null);
  const [tempCatTitle, setTempCatTitle] = useState('');
  const [tempCatTitleEn, setTempCatTitleEn] = useState('');
  const [tempCatTitleDe, setTempCatTitleDe] = useState('');
  const [tempProd, setTempProd] = useState({ name: '', name_en: '', name_de: '', description: '', description_en: '', description_de: '', price: '', station: 'KITCHEN' });

  const loadMenu = async () => {
    setLoading(true);
    const data = await api.getMenuData(shopId, password);
    if (data) {
      setFullShopData(data); // Αποθηκεύουμε τα πάντα (και το features)
      setMenuData(data.menu || []);
      setSettings(data.settings || {});
    } else {
      Alert.alert("Error", "Could not load menu data");
    }
    setLoading(false);
  };

  useEffect(() => { loadMenu(); }, []);

  useEffect(() => {
    const backAction = () => {
      if (viewMode !== 'LIST') {
        setViewMode('LIST');
        return true;
      }
      return false; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [viewMode]);

  const toggleCategory = (index) => {
    setOpenCategoryIndex(prev => prev === index ? null : index);
  };

  const handleLogout = () => {
    setMenuVisible(false);
    navigation.dispatch(
        CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        })
    );
  };

  const saveChanges = async (updatedMenu) => {
    setSaving(true);
    // ΠΡΟΣΟΧΗ: Ενώνουμε το παλιό JSON με το νέο menu, ώστε να μην χαθεί το "features"
    const dataToSave = {
        ...fullShopData,
        menu: updatedMenu,
        settings: settings
    };
    
    const result = await api.saveMenuData(shopId, password, dataToSave);
    setSaving(false);
    if (result.success) {
      setFullShopData(dataToSave);
      setMenuData(updatedMenu);
      if (!skipViewReset) setViewMode('LIST');
    } else {
      Alert.alert("Error", "Failed to save");
    }
  };

  // ACTIONS
  const openCategoryEdit = (index = null) => {
    if (index !== null) {
      setEditingCatIndex(index);
      setTempCatTitle(menuData[index].title);
      setTempCatTitleEn(menuData[index].title_en || '');
      setTempCatTitleDe(menuData[index].title_de || '');
    } else {
      setEditingCatIndex(null);
      setTempCatTitle('');
      setTempCatTitleEn('');
      setTempCatTitleDe('');
    }
    setViewMode('EDIT_CAT');
  };

  const saveCategory = () => {
    if (!tempCatTitle.trim()) { Alert.alert("Error", "Title required"); return; }
    const newMenu = [...menuData];
    const isRakoumel = shopId === 'rakoumel';

    if (editingCatIndex !== null) {
      newMenu[editingCatIndex].title = tempCatTitle;
      if (isRakoumel) {
        newMenu[editingCatIndex].title_en = tempCatTitleEn;
        newMenu[editingCatIndex].title_de = tempCatTitleDe;
      }
    } else {
      const newId = tempCatTitle.toLowerCase().replace(/ /g, '-') + '-' + Date.now();
      const extraFields = isRakoumel ? { title_en: tempCatTitleEn, title_de: tempCatTitleDe } : {};
      const newCategory = { id: newId, title: tempCatTitle, ...extraFields, items: [] };

      const DAILY_TITLE  = 'ΠΙΆΤΑ ΗΜΈΡΑΣ';
      const ANCHOR_TITLE = 'ΦΑΓΗΤΆ ΤΗΣ ΏΡΑΣ';

      if (tempCatTitle.trim().toUpperCase() === DAILY_TITLE) {
        const anchorIndex = newMenu.findIndex(
          cat => cat.title.trim().toUpperCase() === ANCHOR_TITLE
        );
        if (anchorIndex !== -1) {
          newMenu.splice(anchorIndex + 1, 0, newCategory);
        } else {
          newMenu.push(newCategory);
        }
      } else {
        newMenu.push(newCategory);
      }
    }
    saveChanges(newMenu);
  };

  const DAILY_ID = 'piata_imeras';

  const toggleCategoryEnable = () => {
      const newMenu = [...menuData];
      const catIndex = newMenu.findIndex(c => c.id === DAILY_ID);
      if (catIndex === -1) return;
      newMenu[catIndex].enable = newMenu[catIndex].enable === 1 ? 0 : 1;
      saveChanges(newMenu, true);
  };

  const toggleItemEnable = (prodIndex) => {
      const newMenu = [...menuData];
      const catIndex = newMenu.findIndex(c => c.id === DAILY_ID);
      if (catIndex === -1) return;
      const item = newMenu[catIndex].items[prodIndex];
      item.enable = item.enable === 1 ? 0 : 1;
      saveChanges(newMenu, true);
  };

  const handleDeleteCategory = (index) => {
      Alert.alert("Delete Category", "Delete all products inside?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: 'destructive', onPress: () => {
            const newMenu = [...menuData];
            newMenu.splice(index, 1);
            if (openCategoryIndex === index) setOpenCategoryIndex(null);
            saveChanges(newMenu);
        }}
      ]);
  };

  const openProductEdit = (catIndex, prodIndex = null) => {
    if (prodIndex !== null) {
      setEditingProdCoords({ catIndex, prodIndex });
      // SOS: Κάνουμε copy (...) όλο το αντικείμενο για να μην χαθεί το station ή το productId!
      setTempProd({ ...menuData[catIndex].items[prodIndex] });
    } else {
      setEditingProdCoords({ catIndex, prodIndex: null });
      setTempProd({ name: '', name_en: '', name_de: '', description: '', description_en: '', description_de: '', price: '', station: 'KITCHEN' });

    }
    setViewMode('EDIT_PROD');
  };

  const saveProduct = () => {
    if (!tempProd.name.trim() || !tempProd.price.trim()) { Alert.alert("Error", "Name & Price required"); return; }
    const newMenu = [...menuData];
    const { catIndex, prodIndex } = editingProdCoords;
    if (prodIndex !== null) {
      newMenu[catIndex].items[prodIndex] = tempProd;
    } else {
      newMenu[catIndex].items.push(tempProd);
    }
    saveChanges(newMenu);
  };

  const handleDeleteProduct = (catIndex, prodIndex) => {
    Alert.alert("Delete Product", "Sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: 'destructive', onPress: () => {
          const newMenu = [...menuData];
          newMenu[catIndex].items.splice(prodIndex, 1);
          saveChanges(newMenu);
      }}
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;

  // A. MAIN LIST VIEW
  const renderList = () => (
    <>
      <View style={styles.header}>
        <View style={styles.shopTitleRow}>
            <Text variant="titleMedium" style={{color:'#fff', fontWeight:'bold', letterSpacing:1}}>
                SHOP: {shopId.toUpperCase()}
            </Text>
            
            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                    <IconButton
                        icon="chevron-down"
                        iconColor="white"
                        size={20}
                        onPress={() => setMenuVisible(true)}
                        style={{ margin: 0 }}
                    />
                }
                contentStyle={{ backgroundColor: 'white' }}
            >
                <Menu.Item
                    onPress={handleLogout}
                    title="Logout"
                    titleStyle={{ color: 'black' }} 
                    leadingIcon="logout"
                />
            </Menu>
        </View>

        <IconButton icon="refresh" iconColor="#fff" onPress={loadMenu} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMenu} />}>
        {menuData.length === 0 && <Text style={{textAlign:'center', marginTop: 40, color:'#888'}}>No categories.</Text>}
        
        {menuData.map((category, catIndex) => {
          const isExpanded = openCategoryIndex === catIndex;

          return (
            <Card key={category.id || catIndex} style={styles.card} mode="elevated">
              
              <View style={styles.catHeader}>
                <Text variant="titleMedium" style={styles.catTitle}>{category.title.toUpperCase()}</Text>

                {isExpanded && (
                    <View style={styles.actionButtonsRow}>
                        {/* Toggle μόνο για ΠΙΆΤΑ ΗΜΈΡΑΣ */}
                        {category.id === DAILY_ID && (
                            <ToggleSwitch
                                value={category.enable ?? 0}
                                onToggle={toggleCategoryEnable}
                            />
                        )}
                        <Button mode="outlined" compact onPress={() => openCategoryEdit(catIndex)} style={styles.actionBtn} labelStyle={styles.actionBtnLabel} textColor="black">Edit</Button>
                        <Button mode="outlined" compact onPress={() => openProductEdit(catIndex)} style={styles.actionBtn} labelStyle={styles.actionBtnLabel} textColor="black">Add</Button>
                        <Button mode="outlined" compact onPress={() => handleDeleteCategory(catIndex)} style={styles.actionBtn} labelStyle={styles.actionBtnLabel} textColor="black">Delete</Button>
                    </View>
                )}

                  <IconButton
                    icon={isExpanded ? "chevron-down" : "chevron-up"}
                    iconColor="black"
                    size={24}
                    onPress={() => toggleCategory(catIndex)} 
                    style={{margin:0}}
                  />
              </View>
              
              <Divider />

              {isExpanded && (
                <View>
                  {category.items.map((item, prodIndex) => (
                      <View key={prodIndex} style={styles.productRow}>
                          <TouchableOpacity style={{flex: 1}} onPress={() => openProductEdit(catIndex, prodIndex)}>
                              <Text style={styles.prodName}>{item.name}</Text>
                              {item.description ? <Text style={styles.prodDesc} numberOfLines={1}>{item.description}</Text> : null}
                              <Text style={styles.prodPrice}>{item.price} ...</Text>
                          </TouchableOpacity>

                          {/* Toggle μόνο για items του ΠΙΆΤΑ ΗΜΈΡΑΣ */}
                          {category.id === DAILY_ID && (
                              <ToggleSwitch
                                  value={item.enable ?? 0}
                                  onToggle={() => toggleItemEnable(prodIndex)}
                              />
                          )}

                          <Button mode="outlined" compact onPress={() => handleDeleteProduct(catIndex, prodIndex)} style={styles.actionBtn} labelStyle={styles.actionBtnLabel} textColor="black">Delete</Button>
                      </View>
                  ))}
                </View>
              )}
            </Card>
          );
        })}
        <View style={{height: 100}} />
      </ScrollView>

      <FAB 
        icon="plus" 
        color="white" 
        style={styles.fab} 
        onPress={() => openCategoryEdit(null)} 
      />
    </>
  );

  // B. EDIT FORM VIEW
  const renderForm = (title, content, onSave) => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
            <IconButton icon="arrow-left" iconColor="#fff" onPress={() => setViewMode('LIST')} />
            <Text variant="titleMedium" style={{color:'#fff', fontWeight:'bold', flex:1}}>{title}</Text>
            {saving && <ActivityIndicator color="#fff" size={20} />}
        </View>

        <ScrollView contentContainerStyle={{padding: 20}}>
            <Card style={{padding: 10, backgroundColor:'white'}}>
                {content}
                <View style={styles.formButtons}>
                    <Button 
                        mode="outlined" 
                        onPress={() => setViewMode('LIST')} 
                        style={{flex:1, marginRight:10, borderColor: 'black'}} 
                        textColor="black"
                    >
                        Cancel
                    </Button>
                    <Button 
                        mode="contained" 
                        onPress={onSave} 
                        style={{flex:1}} 
                        buttonColor="black"
                        textColor="white"
                        loading={saving}
                    >
                        Save
                    </Button>
                </View>
            </Card>
        </ScrollView>
    </KeyboardAvoidingView>
  );

  if (viewMode === 'EDIT_CAT') {
    return renderForm(
        editingCatIndex !== null ? 'EDIT CATEGORY' : 'NEW CATEGORY',
        <>
            <TextInput label="NAME (GR)" value={tempCatTitle} onChangeText={setTempCatTitle} mode="outlined" autoFocus style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
            {shopId === 'rakoumel' && (
                <>
                    <TextInput label="NAME (EN)" value={tempCatTitleEn} onChangeText={setTempCatTitleEn} mode="outlined" style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
                    <TextInput label="NAME (DE)" value={tempCatTitleDe} onChangeText={setTempCatTitleDe} mode="outlined" style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
                </>
            )}
        </>,
        saveCategory
    );
  }

  if (viewMode === 'EDIT_PROD') {
      return renderForm(
          editingProdCoords?.prodIndex !== null ? 'EDIT PRODUCT' : 'NEW PRODUCT',
          <>
            <TextInput label="NAME" value={tempProd.name} onChangeText={(t) => setTempProd({...tempProd, name: t})} mode="outlined" style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
            <TextInput label="PRICE" value={tempProd.price} onChangeText={(t) => setTempProd({...tempProd, price: t})} mode="outlined" keyboardType="numbers-and-punctuation" style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
            <TextInput label="DESCRIPTION" value={tempProd.description} onChangeText={(t) => setTempProd({...tempProd, description: t})} mode="outlined" multiline numberOfLines={3} style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
            {shopId === 'rakoumel' && (
                <>
                    <TextInput label="NAME (EN)" value={tempProd.name_en || ''} onChangeText={(t) => setTempProd({...tempProd, name_en: t})} mode="outlined" style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
                    <TextInput label="NAME (DE)" value={tempProd.name_de || ''} onChangeText={(t) => setTempProd({...tempProd, name_de: t})} mode="outlined" style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
                    <TextInput label="DESCRIPTION (EN)" value={tempProd.description_en || ''} onChangeText={(t) => setTempProd({...tempProd, description_en: t})} mode="outlined" multiline numberOfLines={3} style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
                    <TextInput label="DESCRIPTION (DE)" value={tempProd.description_de || ''} onChangeText={(t) => setTempProd({...tempProd, description_de: t})} mode="outlined" multiline numberOfLines={3} style={styles.input} activeOutlineColor="black" outlineColor="#ccc" textColor="black" theme={{ colors: { background: 'white' } }} />
                </>
            )}
            {/* ΕΠΙΛΟΓΗ STATION (BAR Ή KITCHEN) */}
            <Text style={{marginBottom: 8, marginTop: 10, fontWeight: 'bold', fontSize: 12, color: '#666'}}>STATION</Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
                <Button 
                    mode={tempProd.station === 'BAR' ? 'contained' : 'outlined'}
                    onPress={() => setTempProd({...tempProd, station: 'BAR'})}
                    style={{flex: 1, borderColor: 'black'}}
                    buttonColor={tempProd.station === 'BAR' ? 'black' : 'transparent'}
                    textColor={tempProd.station === 'BAR' ? 'white' : 'black'}
                >
                    BAR
                </Button>
                <Button 
                    mode={tempProd.station === 'KITCHEN' ? 'contained' : 'outlined'} 
                    onPress={() => setTempProd({...tempProd, station: 'KITCHEN'})}
                    style={{flex: 1, borderColor: 'black'}}
                    buttonColor={tempProd.station === 'KITCHEN' ? 'black' : 'transparent'}
                    textColor={tempProd.station === 'KITCHEN' ? 'white' : 'black'}
                >
                    KITCHEN
                </Button>
            </View>
          </>,
          saveProduct
      );
  }

  return <View style={styles.container}>{renderList()}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 10, paddingTop: 40, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation:4 },
  
  shopTitleRow: { flexDirection: 'row', alignItems: 'center' },

  scrollContent: { padding: 12 },
  card: { marginBottom: 12, backgroundColor: COLORS.card, borderRadius: 4 },
  
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 12, paddingRight: 2, paddingVertical: 8, minHeight: 50 },
  catTitle: { fontWeight: 'bold', fontSize:14, color: COLORS.text, letterSpacing: 0.5, flex: 1 },
  
  actionButtonsRow: { flexDirection: 'row', marginRight: 5, gap: 5 },
  actionBtn: { borderColor: 'black', borderWidth: 1, borderRadius: 4, height: 30, justifyContent: 'center', marginLeft: 4 },
  actionBtnLabel: { fontSize: 10, color: 'black', marginVertical: 2, marginHorizontal: 8 },

  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  prodName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  prodDesc: { fontSize: 12, color: COLORS.subtext },
  prodPrice: { fontSize: 14, color: COLORS.primary, fontWeight: 'bold', marginTop: 2 },
  
  fab: { position: 'absolute', margin: 20, right: 0, bottom: 0, backgroundColor: COLORS.primary },
  input: { marginBottom: 15 },
  formButtons: { flexDirection: 'row', marginTop: 10 }
});