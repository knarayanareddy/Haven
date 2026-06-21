# Android Build Readiness Audit & QA Checklist

## Build Configuration Summary

| App | Package | Expo SDK | React Native | EAS Project ID | VAPI SDK |
|---|---|---|---|---|---|
| Elder | `nl.haven.elder` | 56.0.12 | 0.85.3 | `ab5368b2-8eb1-4e7a-bd18-57c8ab1ae6c6` | Yes (`@vapi-ai/react-native@0.3.0`) |
| Carer | `nl.haven.carer` | 56.0.12 | 0.85.3 | `aefc3f5f-f659-4c48-8c28-b50fbd851b22` | No |
| Grandchild | `nl.haven.grandchild` | 56.0.12 | 0.85.3 | `b9cef469-3078-4162-81d5-5a53bb6abcbe` | No |

## Issues Found & Fixes Applied

### 1. Missing `google-services.json` (all 3 apps)

**Impact:** Push notifications (`expo-notifications`) will crash on Android without Firebase config.

**Fix:** For hackathon, either:
- Create a Firebase project and download `google-services.json` to each `apps/*/android/app/`
- Or disable push notifications in the demo (they'll work but FCM token registration will fail silently)

**Status:** Not fixable without Firebase project access. Document for manual setup.

### 2. Grandchild app missing `expo-notifications` plugin

**Impact:** Grandchild app has no notification support configured.

**Fix:** Not needed for hackathon — grandchild sends messages, doesn't receive push notifications.

### 3. Carer app missing `version` in app.json

**Impact:** `version` field exists in carer but not elder/grandchild. EAS handles this via `appVersionSource: "remote"` for elder/grandchild.

**Status:** No action needed — EAS manages versions.

### 4. Grandchild app.json minimal config

**Impact:** Missing `adaptiveIcon`, `splash`, `icon` config compared to carer.

**Fix:** Add minimal Android config for consistent branding (applied in this PR).

### 5. VAPI native dependencies (elder only)

**Status:** Already configured:
- `@vapi-ai/react-native@0.3.0`
- `@daily-co/react-native-webrtc@118.0.3-daily.4`
- `@daily-co/react-native-daily-js@^0.78.0`

These require native build (not Expo Go). EAS preview build will include them.

## Environment Variables Required

### Elder App
```
EXPO_PUBLIC_SUPABASE_URL=https://vaarqsmufctmjwnblynj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_LOCALE=en-GB
EXPO_PUBLIC_TZ=Europe/Amsterdam
EXPO_PUBLIC_VAPI_API_KEY=<vapi-key>
EXPO_PUBLIC_VAPI_ASSISTANT_ID=<nl-assistant-id>
EXPO_PUBLIC_VAPI_ASSISTANT_ID_NL=<nl-assistant-id>
EXPO_PUBLIC_VAPI_ASSISTANT_ID_EN=<en-assistant-id>
```

### Carer App
```
EXPO_PUBLIC_SUPABASE_URL=https://vaarqsmufctmjwnblynj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_HAVEN_ENV=development
EXPO_PUBLIC_LOCALE=nl-NL
EXPO_PUBLIC_CARER_ELDER_IDS=<comma-separated-elder-uuids>
```

### Grandchild App
```
EXPO_PUBLIC_SUPABASE_URL=https://vaarqsmufctmjwnblynj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_HAVEN_ENV=development
EXPO_PUBLIC_LOCALE=nl-NL
EXPO_PUBLIC_FAMILY_ACCESS_TOKEN=<family-token>
EXPO_PUBLIC_FAMILY_MEMBER_ID=<uuid>
EXPO_PUBLIC_ELDER_ID=<uuid>
EXPO_PUBLIC_VAPI_API_KEY=<vapi-key>
EXPO_PUBLIC_VAPI_ASSISTANT_ID_NL=<nl-assistant-id>
EXPO_PUBLIC_VAPI_ASSISTANT_ID_EN=<en-assistant-id>
EXPO_PUBLIC_VAPI_ASSISTANT_ID=<nl-assistant-id>
```

## APK Build Commands

### Local Development APK (debug)
```bash
# Elder
cd apps/elder && npx expo prebuild --platform android && cd android && ./gradlew assembleDebug

# Carer
cd apps/carer && npx expo prebuild --platform android && cd android && ./gradlew assembleDebug

# Grandchild
cd apps/grandchild && npx expo prebuild --platform android && cd android && ./gradlew assembleDebug
```

### EAS Preview APK (recommended for hackathon)
```bash
# Elder (includes VAPI native modules)
cd apps/elder && npx eas build --platform android --profile preview --local

# Carer
cd apps/carer && npx eas build --platform android --profile preview --local

# Grandchild
cd apps/grandchild && npx eas build --platform android --profile preview --local
```

### EAS Cloud Build (if local build fails)
```bash
cd apps/elder && npx eas build --platform android --profile preview
cd apps/carer && npx eas build --platform android --profile preview
cd apps/grandchild && npx eas build --platform android --profile preview
```

## Android Permissions Audit

### Elder (most permissions — safety features)
| Permission | Purpose | Required |
|---|---|---|
| `CAMERA` | Medication label scanning | Yes |
| `RECORD_AUDIO` | VAPI voice conversations | Yes |
| `ACCESS_FINE_LOCATION` | Fall detection, safe zones | Yes |
| `ACCESS_BACKGROUND_LOCATION` | Continuous safety monitoring | Optional |
| `FOREGROUND_SERVICE` | Background location | Yes |
| `POST_NOTIFICATIONS` | Medication reminders, alerts | Yes |
| `READ/WRITE_CALENDAR` | Medical appointment sync | Optional |
| `SCHEDULE_EXACT_ALARM` | Precise medication reminders | Yes |
| `MODIFY_AUDIO_SETTINGS` | VAPI WebRTC audio | Yes |

### Carer (minimal permissions)
| Permission | Purpose | Required |
|---|---|---|
| `INTERNET` | API calls | Yes (auto-granted) |
| None else | Carer app is data-only | - |

### Grandchild (audio permissions)
| Permission | Purpose | Required |
|---|---|---|
| `RECORD_AUDIO` | Familiar Voice recording | Yes |
| `INTERNET` | API calls | Yes (auto-granted) |

## Physical Device QA Checklist

### Pre-flight
- [ ] Install APK via `adb install <apk-path>` or file manager
- [ ] Verify app launches without crash
- [ ] Grant all requested permissions

### Elder App
- [ ] **Auth**: Sign up / sign in with email+password
- [ ] **Today screen**: Vitals display, task list renders
- [ ] **Pills screen**: Medication list loads, tap to confirm works
- [ ] **Shield screen**: Scam event cards render, risk scores visible
- [ ] **Family screen**: Messages display, send message works
- [ ] **VAPI Voice**: Tap voice orb, verify SDK initializes
- [ ] **VAPI Voice**: Speak "Hallo" and verify response (requires mic permission)
- [ ] **VAPI Voice**: Verify conversation ends cleanly on hangup
- [ ] **Kompas screen**: Safe zone display renders
- [ ] **Buurt screen**: Neighbourhood matches display
- [ ] **Settings**: Consent toggles render and respond
- [ ] **Offline mode**: Toggle airplane mode, verify offline queue works
- [ ] **Language toggle**: Switch EN/NL, verify all text updates

### Carer App
- [ ] **Auth**: Sign in with carer credentials
- [ ] **Vandaag tab**: Today's tasks and medications render
- [ ] **MAR tab**: Medication administration recording works
- [ ] **Visits tab**: Visit history renders
- [ ] **Safeguarding tab**: Meldcode steps display
- [ ] **Handover tab**: Create handover note, verify submission
- [ ] **Offline handover**: Queue handover while offline, sync when back

### Grandchild App
- [ ] **Overview tab**: Daily status, med adherence, device health render
- [ ] **Send heart**: Tap heart button, verify "Sending..." then "Sent!"
- [ ] **Send check-in**: Verify loading state and success/failure display
- [ ] **Medications tab**: Elder's medication schedule renders
- [ ] **Alerts tab**: Scam events render
- [ ] **Voice tab**: Record familiar voice, verify upload
- [ ] **Voice tab**: Listen to test clip
- [ ] **Privacy tab**: Consent status displays

### Cross-App Integration
- [ ] **Elder receives grandchild message**: Send heart from grandchild, verify elder notification
- [ ] **VAPI webhook**: Start elder voice call, verify `fn-vapi-webhook` receives tool calls
- [ ] **Medication confirmation**: Confirm med in elder, verify carer MAR updates

## Known Limitations

1. **No `google-services.json`**: Push notifications won't register FCM tokens. Notifications will work in-app but not when app is backgrounded.
2. **VAPI requires real device**: Emulator audio is simulated; real voice conversations need a physical Android device with microphone.
3. **Background location**: Requires Android 12+ explicit permission grant via settings.
4. **Expo Go incompatible**: Elder app uses native VAPI/WebRTC modules — must use EAS build or local prebuild, not Expo Go.
