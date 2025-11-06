# Release Build Setup Checklist

Follow this checklist to set up Android release builds in GitHub Actions.

## Prerequisites
- [ ] Access to repository settings (requires admin/maintainer role)
- [ ] Local machine with Java/keytool installed
- [ ] Text editor for copying base64 strings

## Step-by-Step Setup

### 1. Generate Keystore (Local Machine)

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore mykencing-release.keystore \
  -alias mykencing-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

- [ ] Run command above
- [ ] Save keystore password (you'll need this!)
- [ ] Save key password (usually same as keystore password)
- [ ] Keystore file created: `mykencing-release.keystore`

### 2. Convert to Base64

**Windows PowerShell:**
```powershell
# CRITICAL: Include -NoNewline flag!
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\mykencing-release.keystore")) | Out-File -NoNewline -FilePath keystore-base64.txt
```

**Linux/Mac:**
```bash
# CRITICAL: Include -w 0 flag!
base64 -w 0 mykencing-release.keystore > keystore-base64.txt
```

**Why these flags matter:**
- Without `-NoNewline` or `-w 0`, the base64 string contains newlines
- Newlines corrupt the keystore during decode
- Results in "Tag number over 30 is not supported" error

- [ ] Base64 file created: `keystore-base64.txt`
- [ ] Open `keystore-base64.txt` and copy ALL contents

### 3. Add GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

Add these 4 secrets (click "New repository secret" for each):

#### Secret 1: ANDROID_KEYSTORE_BASE64
- [ ] Name: `ANDROID_KEYSTORE_BASE64`
- [ ] Value: Paste ALL contents from `keystore-base64.txt`
- [ ] Click "Add secret"

#### Secret 2: ANDROID_KEYSTORE_PASSWORD
- [ ] Name: `ANDROID_KEYSTORE_PASSWORD`
- [ ] Value: Your keystore password (from step 1)
- [ ] Click "Add secret"

#### Secret 3: ANDROID_KEY_ALIAS
- [ ] Name: `ANDROID_KEY_ALIAS`
- [ ] Value: `mykencing-key-alias`
- [ ] Click "Add secret"

#### Secret 4: ANDROID_KEY_PASSWORD
- [ ] Name: `ANDROID_KEY_PASSWORD`
- [ ] Value: Your key password (from step 1, usually same as keystore password)
- [ ] Click "Add secret"

### 4. Verify Secrets

Go to: **Repository → Settings → Secrets and variables → Actions**

Verify all 4 secrets are listed:
- [ ] ✓ ANDROID_KEYSTORE_BASE64
- [ ] ✓ ANDROID_KEYSTORE_PASSWORD
- [ ] ✓ ANDROID_KEY_ALIAS
- [ ] ✓ ANDROID_KEY_PASSWORD

### 5. Backup Keystore

**CRITICAL:** Store these files in a secure location:
- [ ] `mykencing-release.keystore` → Password manager or secure vault
- [ ] Keystore password → Password manager
- [ ] Key password → Password manager
- [ ] `keystore-base64.txt` → Secure backup (optional)

**WARNING:** If you lose the keystore or passwords, you cannot update your app on Google Play Store!

### 6. Trigger Build

- [ ] Push to `main` or `master` branch
- [ ] OR manually trigger workflow: Actions → Android CI → Run workflow

### 7. Verify Build Success

Go to: **Repository → Actions → Latest workflow run**

Expected steps should be green ✓:
- [ ] Checkout
- [ ] Setup Node
- [ ] Setup Java
- [ ] Install JS deps
- [ ] Expo Prebuild
- [ ] **Decode Keystore** ← New step
- [ ] **Configure Gradle settings and signing** ← New step
- [ ] **Configure app build.gradle for signing** ← New step
- [ ] Grant gradlew execute
- [ ] **Build Release APK** ← Changed from Debug
- [ ] **Upload Android Release APK** ← Changed artifact name

### 8. Download and Test APK

- [ ] Download APK from workflow artifacts: `android-release-apk`
- [ ] Transfer to Android device
- [ ] Install and test (should work without Metro bundler!)
- [ ] Verify app works offline
- [ ] Check app signature: `adb shell pm list packages -f | grep mykencing`

## Troubleshooting

### Build fails at "Decode Keystore"
- Check `ANDROID_KEYSTORE_BASE64` secret is set
- Verify base64 string has no extra characters/spaces

### Build fails at "Build Release APK" with signing error
- Verify all 4 secrets are set correctly
- Check passwords match what you used in keytool
- Ensure `ANDROID_KEY_ALIAS` is exactly `mykencing-key-alias`

### APK still shows "Unable to load script"
- Check workflow downloaded the `android-release-apk` artifact (NOT debug)
- Verify workflow step says "Build Release APK" succeeded
- Ensure you're testing the newly built APK, not an old one

### "Keystore was tampered with" error
- Keystore password is incorrect
- Keystore file corrupted during base64 conversion - regenerate

## Security Reminders

- ❌ NEVER commit keystore files to git
- ❌ NEVER share keystore passwords in plain text
- ✓ Store keystore in password manager
- ✓ Limit repository access to trusted maintainers
- ✓ Use strong passwords (12+ characters)
- ✓ Keep multiple backups of keystore file

## Next Steps After Successful Build

1. **Test thoroughly** on multiple devices
2. **Prepare for Play Store:**
   - Create Google Play Developer account
   - Prepare app description, screenshots
   - Set up privacy policy
   - Complete app listing
3. **Upload to Play Console:**
   - Use the signed release APK
   - Complete all store listing requirements
   - Submit for review

## Build Differences: Debug vs Release

| Aspect | Debug APK | Release APK ✓ |
|--------|-----------|---------------|
| JS Bundle | Not included (expects Metro) | Bundled in APK |
| ProGuard | Disabled | Enabled |
| Resource Shrinking | Disabled | Enabled |
| Signing | Debug keystore | Release keystore |
| APK Size | Larger | Smaller (optimized) |
| Performance | Slower | Faster |
| Suitable for | Development only | Production/Distribution |

---

**Current Status:** Workflow updated to build Release APK with signing configuration.
**Action Required:** Complete steps 1-6 above to enable release builds.
