import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl, KeyboardAvoidingView, Platform, BackHandler, TouchableOpacity } from 'react-native';
import { Text, Card, Button, IconButton, ActivityIndicator, FAB, Divider, TextInput } from 'react-native-paper';
import { api } from '../services/api';

const COLORS = {
  primary: '#121212',
  accent: '#333333',
  background: '#F4F4F4',
  card: '#FFFFFF',
  text: '#111111',
  subtext: '#666666',
  danger: '#D32F2F',
};

export default function MenuDashboard({ route, navigation }) {
  const { shopId, password } = route.params;

  const [menuData, setMenuData] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // VIEWS STATE
  const [viewMode, setViewMode] = useState('LIST');

  // EXPAND STATE
  const [expandedCategories, setExpandedCategories] = useState({}); 

  // Data Holders
  const [editingCatIndex, setEditingCatIndex] = useState(null);
  const [editingProdCoords, setEditingProdCoords] = useState(null);
  const [tempCatTitle, setTempCatTitle] = useState('');
  const [tempProd, setTempProd] = useState({ name: '', description: '', price: '' });

  // LOAD
  const loadMenu = async () => {
    setLoading(true);
    const data = await api.getMenuData(shopId, password);
    if (data) {
      setMenuData(data.menu || []);
      setSettings(data.settings || {});
    } else {
      Alert.alert("Error", "Could not load menu data");
    }
    setLoading(false);
  };

  useEffect(() => { loadMenu(); }, []);

  // Back Button Handler
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

  // TOGGLE CATEGORY
  const toggleCategory = (index) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // SAVE
  const saveChanges = async (updatedMenu) => {
    setSaving(true);
    const fullData = { menu: updatedMenu, settings: settings };
    const result = await api.saveMenuData(shopId, password, fullData);
    setSaving(false);
    if (result.success) {
      setMenuData(updatedMenu);
      setViewMode('LIST');
    } else {
      Alert.alert("Error", "Failed to save");
    }
  };

  // ACTIONS
  const openCategoryEdit = (index = null) => {
    if (index !== null) {
      setEditingCatIndex(index);
      setTempCatTitle(menuData[index].title);
    } else {
      setEditingCatIndex(null);
      setTempCatTitle('');
    }
    setViewMode('EDIT_CAT');
  };

  const saveCategory = () => {
    if (!tempCatTitle.trim()) { Alert.alert("Error", "Title required"); return; }
    const newMenu = [...menuData];
    if (editingCatIndex !== null) {
      newMenu[editingCatIndex].title = tempCatTitle;
    } else {
      const newId = tempCatTitle.toLowerCase().replace(/ /g, '-') + '-' + Date.now();
      newMenu.push({ id: newId, title: tempCatTitle, items: [] });
    }
    saveChanges(newMenu);
  };

  const handleDeleteCategory = (index) => {
    Alert.alert("Delete Category", "All products will be removed", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: 'destructive', onPress: () => {
          const newMenu = [...menuData];
          newMenu.splice(index, 1);
          saveChanges(newMenu);
      }}
    ]);
  };

  const openProductEdit = (catIndex, prodIndex = null) => {
    if (prodIndex !== null) {
      setEditingProdCoords({ catIndex, prodIndex });
      setTempProd({ ...menuData[catIndex].items[prodIndex] });
    } else {
      setEditingProdCoords({ catIndex, prodIndex: null });
      setTempProd({ name: '', description: '', price: '' });
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
    Alert.alert("Delete Product", "This product will be removed", [
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
        <Text variant="titleMedium" style={{color:'#fff', fontWeight:'bold', letterSpacing:1}}>SHOP: {shopId.toUpperCase()}</Text>
        <IconButton icon="refresh" iconColor="#fff" onPress={loadMenu} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMenu} />}>
        {menuData.length === 0 && <Text style={{textAlign:'center', marginTop: 40, color:'#888'}}>No categories.</Text>}
        
        {menuData.map((category, catIndex) => {
          const isExpanded = expandedCategories[catIndex];

          return (
            <Card key={category.id || catIndex} style={styles.card} mode="elevated">
              
              <View style={styles.catHeader}>
                  <Text variant="titleMedium" style={styles.catTitle}>{category.title.toUpperCase()}</Text>

                  {isExpanded && (
                    <View style={styles.actionButtonsRow}>
                      <Button mode="outlined" compact onPress={() => openCategoryEdit(catIndex)} style={styles.actionBtn} labelStyle={styles.actionBtnLabel}>Edit</Button>
                      <Button mode="outlined" compact onPress={() => openProductEdit(catIndex)} style={styles.actionBtn} labelStyle={styles.actionBtnLabel}>Add</Button>
                      <Button mode="outlined" compact onPress={() => handleDeleteCategory(catIndex)} style={styles.actionBtn} labelStyle={styles.actionBtnLabel}>Delete</Button>
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

              {isExpanded && category.items.map((item, prodIndex) => (
                  <View key={prodIndex} style={styles.productRow}>
                      
                      {/* 1. Clickable Text Area (Για να κάνεις Edit πατάς το κείμενο) */}
                      <TouchableOpacity 
                        style={{flex: 1}} 
                        onPress={() => openProductEdit(catIndex, prodIndex)}
                      >
                          <Text style={styles.prodName}>{item.name}</Text>
                          {item.description ? <Text style={styles.prodDesc} numberOfLines={1}>{item.description}</Text> : null}
                          <Text style={styles.prodPrice}>{item.price}</Text>
                      </TouchableOpacity>

                      {/* 2. Single Delete Button (Όπως το ζήτησες) */}
                      <Button 
                        mode="outlined" 
                        compact 
                        onPress={() => handleDeleteProduct(catIndex, prodIndex)} 
                        style={styles.actionBtn} 
                        labelStyle={styles.actionBtnLabel}
                      >
                        Delete
                      </Button>

                  </View>
              ))}
            </Card>
          );
        })}
        <View style={{height: 100}} />
      </ScrollView>

      <FAB icon="plus" color="white" style={styles.fab} onPress={() => openCategoryEdit(null)} />
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
                    <Button mode="outlined" onPress={() => setViewMode('LIST')} style={{flex:1, marginRight:10}} textColor={COLORS.subtext}>Cancel</Button>
                    <Button mode="contained" onPress={onSave} style={{flex:1}} buttonColor={COLORS.primary} loading={saving}>Save</Button>
                </View>
            </Card>
        </ScrollView>
    </KeyboardAvoidingView>
  );

  // RENDER SWITCH
  if (viewMode === 'EDIT_CAT') {
      return renderForm(
          editingCatIndex !== null ? 'EDIT CATEGORY' : 'NEW CATEGORY',
          <TextInput label="NAME" value={tempCatTitle} onChangeText={setTempCatTitle} mode="outlined" autoFocus style={styles.input} activeOutlineColor={COLORS.primary} />,
          saveCategory
      );
  }

  if (viewMode === 'EDIT_PROD') {
      return renderForm(
          editingProdCoords?.prodIndex !== null ? 'EDIT PRODUCT' : 'NEW PRODUCT',
          <>
            <TextInput label="NAME" value={tempProd.name} onChangeText={(t) => setTempProd({...tempProd, name: t})} mode="outlined" style={styles.input} activeOutlineColor={COLORS.primary} />
            <TextInput label="PRICE" value={tempProd.price} onChangeText={(t) => setTempProd({...tempProd, price: t})} mode="outlined" keyboardType="numbers-and-punctuation" style={styles.input} activeOutlineColor={COLORS.primary} />
            <TextInput label="DESCRIPTION" value={tempProd.description} onChangeText={(t) => setTempProd({...tempProd, description: t})} mode="outlined" multiline numberOfLines={3} style={styles.input} activeOutlineColor={COLORS.primary} />
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
  scrollContent: { padding: 12 },
  card: { marginBottom: 12, backgroundColor: COLORS.card, borderRadius: 4 },
  
  catHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingLeft: 12, paddingRight: 2, paddingVertical: 8, minHeight: 50
  },
  catTitle: { fontWeight: 'bold', fontSize:14, color: COLORS.text, letterSpacing: 0.5, flex: 1 },
  
  // BUTTON STYLES
  actionButtonsRow: { flexDirection: 'row', marginRight: 5, gap: 5 },
  actionBtn: { borderColor: 'black', borderWidth: 1, borderRadius: 4, height: 30, justifyContent: 'center', marginLeft: 4 },
  actionBtnLabel: { fontSize: 10, color: 'black', marginVertical: 2, marginHorizontal: 8 },

  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  prodName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  prodDesc: { fontSize: 12, color: COLORS.subtext },
  prodPrice: { fontSize: 14, color: COLORS.primary, fontWeight: 'bold', marginTop: 2 },
  fab: { position: 'absolute', margin: 20, right: 0, bottom: 0, backgroundColor: COLORS.primary },

  input: { marginBottom: 15, backgroundColor:'#fff' },
  formButtons: { flexDirection: 'row', marginTop: 10 }
});