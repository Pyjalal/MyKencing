# Android Release Build Signing Setup

This guide explains how to generate and configure Android signing for release builds in GitHub Actions.

## Step 1: Generate Keystore (Run Locally ONCE)

Run this command on your local machine to generate a keystore file:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore mykencing-release.keystore \
  -alias mykencing-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**When prompted, provide:**
- Keystore password (save this securely!)
- Key password (can be same as keystore password)
- Your name and organization details (CN, OU, O, L, ST, C)

**IMPORTANT:**
- Save the keystore file securely (e.g., password manager, secure vault)
- NEVER commit the keystore file to git
- Save the passwords securely - you cannot recover them if lost
- Back up the keystore - losing it means you cannot update your app in the Play Store

## Step 2: Convert Keystore to Base64

After generating the keystore, convert it to Base64 for GitHub Secrets:

### On Windows (PowerShell):
```powershell
# IMPORTANT: Use -NoNewline to prevent line breaks!
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\mykencing-release.keystore")) | Out-File -NoNewline -FilePath keystore-base64.txt
```

### On Linux/Mac:
```bash
# IMPORTANT: Use -w 0 to prevent line wrapping!
base64 -w 0 mykencing-release.keystore > keystore-base64.txt
```

**Critical:** The `-NoNewline` (PowerShell) and `-w 0` (Linux/Mac) flags prevent newlines in the base64 string, which would corrupt the keystore during decode.

## Step 3: Configure GitHub Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add the following:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Contents of `keystore-base64.txt` | Base64-encoded keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Your keystore password | Password you entered when creating keystore |
| `ANDROID_KEY_ALIAS` | `mykencing-key-alias` | The alias from keytool command |
| `ANDROID_KEY_PASSWORD` | Your key password | Usually same as keystore password |

## Step 4: Verify Secrets Are Set

After adding all secrets, verify they appear in your repository's secrets list:
- ✓ ANDROID_KEYSTORE_BASE64
- ✓ ANDROID_KEYSTORE_PASSWORD
- ✓ ANDROID_KEY_ALIAS
- ✓ ANDROID_KEY_PASSWORD

## Security Best Practices

1. **Never share keystore passwords** via email, Slack, or other insecure channels
2. **Back up the keystore file** in multiple secure locations
3. **Use strong passwords** (minimum 12 characters)
4. **Rotate secrets** if compromised
5. **Limit access** to repository secrets to trusted maintainers only

## Troubleshooting

### "Keystore was tampered with" error
- The keystore password is incorrect
- The keystore file was corrupted during base64 conversion

### "Cannot recover key" error
- The key password is incorrect
- The key alias doesn't match

### Build fails with signing error
- Check all 4 GitHub secrets are set correctly
- Verify base64 encoding didn't add extra characters
- Ensure no trailing spaces in secret values

## What Happens in CI/CD

The GitHub Actions workflow will:
1. Decode the base64 keystore to a file
2. Create signing configuration in gradle.properties
3. Configure app/build.gradle to use the signing config
4. Build a signed release APK
5. Upload the signed APK as an artifact

## After First Successful Build

Once you have a signed release APK:
1. Test it on a physical device
2. Use this same keystore for ALL future releases
3. When ready, upload to Google Play Console
4. Keep the keystore backed up indefinitely
