#!/bin/bash
# Android Keystore Generation Script for MyKencing
# Run this ONCE to generate your release keystore

echo "========================================"
echo "MyKencing Android Keystore Generator"
echo "========================================"
echo ""
echo "This script will generate a release keystore for signing your Android app."
echo ""
echo "IMPORTANT:"
echo "- You only need to run this ONCE"
echo "- Save the passwords you enter securely"
echo "- Back up the generated keystore file"
echo "- NEVER commit the keystore to git"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "Generating keystore..."
echo ""

keytool -genkeypair -v -storetype PKCS12 -J-Dkeystore.pkcs12.legacy=true \
  -keystore mykencing-release.keystore \
  -alias mykencing-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Keystore generation failed!"
    echo "Make sure Java/JDK is installed and keytool is in your PATH."
    exit 1
fi

echo ""
echo "========================================"
echo "SUCCESS! Keystore generated."
echo "========================================"
echo ""
echo "File created: mykencing-release.keystore"
echo ""
echo "NEXT STEPS:"
echo "1. Convert to base64 (IMPORTANT: Include -w 0!):"
echo "   base64 -w 0 mykencing-release.keystore > keystore-base64.txt"
echo ""
echo "2. Add the following GitHub Secrets:"
echo "   - ANDROID_KEYSTORE_BASE64 (contents of keystore-base64.txt)"
echo "   - ANDROID_KEYSTORE_PASSWORD (the keystore password you entered)"
echo "   - ANDROID_KEY_ALIAS (use: mykencing-key-alias)"
echo "   - ANDROID_KEY_PASSWORD (the key password you entered)"
echo ""
echo "3. BACKUP the keystore file and passwords securely!"
echo ""
