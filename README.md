# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.




# MenuAdmin — React Native Mobile App

Το mobile companion app για ιδιοκτήτες/managers. Επιτρέπει login με Shop ID + Password και διαχείριση μενού απευθείας από κινητό.

## Tech Stack

- **React Native 0.81** με Expo SDK 54
- **React Navigation** (Stack navigator)
- **React Native Paper** (MD3 Dark Theme)
- **Expo Splash Screen** για custom intro animation
- **Axios** για HTTP requests

## Δομή του Project

```
/
├── App.js                    # Root component, splash screen animation, navigation setup
├── app.json                  # Expo configuration
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js    # Shop ID + Password login form
│   │   └── MenuDashboard.js  # Full menu management UI
│   └── services/
│       └── api.js            # API client (login, getMenuData, saveMenuData)
├── constants/
│   └── theme.ts              # Colors + platform-specific fonts
└── hooks/
    ├── use-color-scheme.ts
    └── use-theme-color.ts
```

## Screens

### LoginScreen
- Πεδία: Shop ID, Password
- Validation + error alerts
- `KeyboardAvoidingView` για iOS/Android compatibility
- Navigates to `MenuDashboard` on success, passing `{ shopId, password }`

### MenuDashboard
Λειτουργεί σε 3 view modes που εναλλάσσονται χωρίς navigation:

| Mode | Περιγραφή |
|------|-----------|
| `LIST` | Κύρια λίστα κατηγοριών με accordion expand |
| `EDIT_CAT` | Form για create/edit κατηγορίας |
| `EDIT_PROD` | Form για create/edit προϊόντος (όνομα, τιμή, περιγραφή, station) |

**Βασικές λειτουργίες:**
- Accordion expand/collapse κατηγοριών
- Inline delete κατηγορίας & προϊόντος με Alert confirmation
- Station selector: BAR / KITCHEN (toggle buttons)
- Pull-to-refresh με `RefreshControl`
- Android hardware back button handler (επιστρέφει στο LIST)
- FAB (+) για νέα κατηγορία
- Logout μέσω dropdown menu (reset navigation stack)

### Smart Save
Κατά την αποθήκευση, διατηρείται **ολόκληρο το `fullShopData` object** (μαζί με `features`, `settings`, `theme`) — αντικαθίσταται μόνο το `menu` array. Αυτό αποτρέπει απώλεια δεδομένων από άλλα πεδία του DynamoDB item.

## Splash Screen

Custom 3-δευτερόλεπτη intro animation:
1. Native splash screen κρύβεται αμέσως (`SplashScreen.hideAsync()`)
2. Εμφανίζεται custom `Animated.View` με τίτλο "MENU / ADMINISTRATOR"
3. Μετά από 3s ξεκινά `Animated.timing` fade out (1s)
4. Μετά το fade, το overlay αφαιρείται από το tree (`splashAnimationFinished: true`)

## API Client (`src/services/api.js`)

```
BASE_URL: https://jqh5mcshzzlag7z26d76elkf6u0vtgzw.lambda-url.eu-central-1.on.aws
```

| Method | Endpoint | Περιγραφή |
|--------|----------|-----------|
| POST | `/login` | `{ shopId, password }` → `{ success }` |
| POST | `/get-full-data` | `{ shopId, password }` → full shop object |
| POST | `/save-menu` | `{ shopId, password, data: fullShopData }` |

**Smart fix για legacy data**: Αν το `data.menu` είναι object με nested `.menu` array (παλιό format), γίνεται unwrap αυτόματα.

## Theme

Dark theme (`#121212` background) με Material Design 3:

```javascript
const theme = {
  ...MD3DarkTheme,
  colors: {
    primary: '#ffffff',
    background: '#121212',
  }
}
```

## App Configuration (app.json)

- **Bundle ID (iOS)**: `com.theristis.menuadmin`
- **Package (Android)**: `com.theristis.menuadmin`
- **EAS Project ID**: `06d6a291-a47a-4eb5-a0da-3ff9d3f06eb0`
- **Orientation**: Portrait only
- **New Architecture**: Enabled
- **React Compiler**: Enabled (experimental)

## Setup & Run

```bash
npm install
npx expo start

# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Build (EAS)

```bash
npx eas build --platform android
npx eas build --platform ios
```

## Σχέση με το QRMenu Ecosystem

Αυτό το app χρησιμοποιεί το **legacy password-based auth** (`shopId` + `password`) σε αντίθεση με το Admin Portal που χρησιμοποιεί JWT. Είναι ο παλαιότερος τρόπος πρόσβασης που προορίζεται για γρήγορες αλλαγές μενού από κινητό.
