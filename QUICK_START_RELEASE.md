# Quick Start: Android Release Build Setup

## TL;DR - 3-Minute Setup

### 1. Generate Keystore (Windows)
```powershell
cd scripts
.\generate-keystore.bat
```

### 2. Convert to Base64 (Windows PowerShell)
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\mykencing-release.keystore")) | Out-File keystore-base64.txt
```

### 3. Add 4 GitHub Secrets

Go to: **Settings → Secrets → Actions → New secret**

| Secret Name | Value Source |
|-------------|--------------|
| `ANDROID_KEYSTORE_BASE64` | Copy ALL from `keystore-base64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | Password from step 1 |
| `ANDROID_KEY_ALIAS` | `mykencing-key-alias` |
| `ANDROID_KEY_PASSWORD` | Password from step 1 |

### 4. Push to GitHub
```bash
git add .
git commit -m "Configure release build"
git push
```

### 5. Download APK

- Go to **Actions** tab
- Click latest workflow run
- Download **android-release-apk** artifact
- Install on device and test!

## What Changed?


```yaml
- name: Decode Keystore
  run: echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/mykencing-release.keystore

- name: Configure Gradle settings and signing
  run: |
    echo "MYAPP_UPLOAD_STORE_FILE=mykencing-release.keystore" >> gradle.properties
    # ... signing configuration

- name: Build Release APK
  run: ./gradlew assembleRelease
```
- ✅ Release APK bundles JavaScript
- ✅ Works standalone (offline)
- ✅ ProGuard optimized
- ✅ Properly signed for distribution

## Files Created

| File | Purpose |
|------|---------|
| `ANDROID_SIGNING_SETUP.md` | Detailed keystore setup guide |
| `RELEASE_BUILD_CHECKLIST.md` | Step-by-step checklist |
| `scripts/generate-keystore.bat` | Windows keystore generator |
| `scripts/generate-keystore.sh` | Linux/Mac keystore generator |
| `QUICK_START_RELEASE.md` | This file - quick reference |

## Workflow Changes

### Modified: `.github/workflows/android.yml`

**New Steps Added:**
1. **Decode Keystore** (line 57-59)
   - Decodes base64 keystore from GitHub Secrets
   - Saves to `android/app/mykencing-release.keystore`

2. **Configure Gradle settings and signing** (line 61-76)
   - Adds release signing properties to gradle.properties
   - Uses GitHub Secrets for credentials

3. **Configure app build.gradle for signing** (line 78-96)
   - Injects `signingConfigs.release` block
   - Configures release build type to use signing config

**Modified Steps:**
- ~~Build Debug APK~~ → **Build Release APK** (line 102-104)
  - Changed from `assembleDebug` to `assembleRelease`
- ~~android-debug-apk~~ → **android-release-apk** (line 109)
  - Updated artifact name and path

## Verification

### How to verify it's working:

1. **Check workflow log** - Look for:
   ```
   ✓ Decode Keystore
   ✓ Configure Gradle settings and signing
   ✓ Configure app build.gradle for signing
   ✓ Build Release APK
   ```

2. **Download APK** from artifacts named `android-release-apk`

3. **Install on device** (no USB debugging needed)

4. **Test offline** - Turn off WiFi, APK should still work!

## Troubleshooting One-Liners

| Problem | Quick Fix |
|---------|-----------|
| Build fails: "Cannot find keystore" | Check `ANDROID_KEYSTORE_BASE64` secret is set |
| Build fails: "Keystore tampered" | Wrong `ANDROID_KEYSTORE_PASSWORD` |
| Build fails: "Cannot recover key" | Wrong `ANDROID_KEY_PASSWORD` or `ANDROID_KEY_ALIAS` |
| APK still shows "Unable to load script" | Downloaded wrong artifact - get `android-release-apk` |
| Secrets not working | Ensure no trailing spaces in secret values |

## Security Checklist

- ✅ `.gitignore` includes `*.keystore` (line 72)
- ✅ `.gitignore` includes `keystore-base64.txt` (line 74)
- ✅ Keystore only in GitHub Secrets (encrypted)
- ✅ Passwords only in GitHub Secrets (encrypted)
- ❌ NEVER commit keystore files
- ❌ NEVER share passwords in plain text

## Next Steps

1. **Complete setup** using checklist above
2. **Test APK** on multiple devices
3. **Prepare Play Store listing**
4. **Upload to Google Play Console**
5. **Submit for review**

## Support

- **Detailed Guide:** See `ANDROID_SIGNING_SETUP.md`
- **Full Checklist:** See `RELEASE_BUILD_CHECKLIST.md`
- **Workflow File:** `.github/workflows/android.yml`

---

**Status:** ✅ Release build configured
**Action Required:** Add GitHub Secrets (see step 3 above)
**Estimated Time:** 3-5 minutes
