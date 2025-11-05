/**
 * Scan Prescription Screen
 * Allows users to scan paper prescriptions using camera
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { scanPrescription, isOcrAvailable } from '../services/ocr';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function ScanPrescriptionScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const cameraRef = useRef<CameraView | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);


  const takePicture = async () => {
    if (!cameraRef.current) return;

    if (!isOcrAvailable()) {
      Alert.alert(
        t('scan.scan_prescription_title'),
        t('scan.ocr_unavailable_alert_message')
      );
      return;
    }

    try {
      setIsProcessing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setCapturedImage(photo.uri);

      const extracted = await scanPrescription(photo.uri);

      if (extracted.length === 0) {
        Alert.alert(
          t('scan.scan_prescription_title'),
          t('scan.no_medications_detected_alert_message'),
          [
            { text: t('add_vital.cancel'), style: 'cancel' },
            {
              text: t('scan.manual_entry'),
              onPress: () => navigation.navigate('AddMedicine'),
            },
          ]
        );
        setIsProcessing(false);
        return;
      }

      navigation.navigate('AddMedicine', { scannedData: extracted });
      setIsProcessing(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(t('analytics.error'), t('scan.failed_to_process_prescription_alert_message'));
      setIsProcessing(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setIsProcessing(false);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.message}>{t('add_vital.loading')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          {t('scan.camera_permission_required')}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            await requestPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>{t('scan.grant_permission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={styles.processingText}>{t('scan.processing_prescription')}</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.retakeButton} onPress={retake}>
              <Text style={styles.retakeButtonText}>{t('scan.retake')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <View style={styles.guidebox} />
          <Text style={styles.instruction}>
            {t('scan.position_prescription_within_frame')}
          </Text>
        </View>
      </CameraView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
          disabled={isProcessing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => navigation.navigate('AddMedicine')}
        >
          <Text style={styles.manualButtonText}>
            {t('scan.manual_entry')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  guidebox: {
    width: '90%',
    height: '60%',
    borderWidth: 2,
    borderColor: Colors.primary.main,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  instruction: {
    marginTop: Spacing.xl,
    fontSize: Typography.fontSize.base,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary.main,
  },
  manualButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  manualButtonText: {
    fontSize: Typography.fontSize.base,
    color: 'white',
    fontWeight: Typography.fontWeight.semibold,
  },
  preview: {
    flex: 1,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.lg,
    color: 'white',
    fontWeight: Typography.fontWeight.semibold,
  },
  actions: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  retakeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.primary.main,
  },
  retakeButtonText: {
    fontSize: Typography.fontSize.base,
    color: 'white',
    fontWeight: Typography.fontWeight.semibold,
  },
  message: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  permissionButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.primary.main,
  },
  permissionButtonText: {
    fontSize: Typography.fontSize.base,
    color: 'white',
    fontWeight: Typography.fontWeight.semibold,
  },
});