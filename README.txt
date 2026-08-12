# AutoConnect Karnataka — SPCK FIXED

## Why the old buttons were not working
The old `app.js` used Firebase ES-module imports and also contained placeholder values:
- PASTE_YOUR_API_KEY
- PASTE_YOUR_APP_ID

If the Firebase module/config failed in SPCK Preview, the whole JavaScript file could stop, so even Dashboard/Vehicles/Sensors buttons appeared dead.

## This version fixes it
- Uses Firebase compat SDK, which is easier to run in SPCK Preview.
- Adds a **Demo Mode** button so you can test the complete UI without Firebase login.
- Navigation buttons work.
- Add Vehicle works.
- Refresh Sensors works.
- Logout works.
- Firebase Email/Password login works after you add the real config.
- Firestore profile saving is attempted but won't break account creation if Firestore rules are not ready.

## Firebase setup
Open `app.js` and replace only:
YOUR_API_KEY
YOUR_APP_ID

Use the values shown in:
Firebase Console → Project settings → Your apps → Web app → SDK setup and configuration.

Also enable:
Firebase Console → Authentication → Sign-in method → Email/Password → Enable.

## SPCK
1. Extract/open this project in SPCK.
2. Open `app.js`.
3. Paste your Firebase `apiKey` and `appId`.
4. Save all files.
5. Run/Preview `index.html`.
6. For immediate testing, tap **Open Demo App**.

## Firestore
You already created Cloud Firestore. You can leave it in Production mode while testing login. Later, configure secure Firestore rules for your collections.
