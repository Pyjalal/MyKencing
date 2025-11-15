/**
 * Biometric Authentication Service
 * Provides fingerprint and face recognition authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import i18n from './i18n';
import { Platform } from 'react-native';

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACIAL_RECOGNITION = 'facial_recognition',
  IRIS = 'iris',
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
}

/**
 * Check if biometric records are enrolled (e.g., fingerprints saved)
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric enrollment:', error);
    return false;
  }
}

/**
 * Get available biometric types
 */
export async function getSupportedBiometricTypes(): Promise<BiometricType[]> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const biometricTypes: BiometricType[] = [];

    types.forEach((type) => {
      if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) {
        biometricTypes.push(BiometricType.FINGERPRINT);
      } else if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
        biometricTypes.push(BiometricType.FACIAL_RECOGNITION);
      } else if (type === LocalAuthentication.AuthenticationType.IRIS) {
        biometricTypes.push(BiometricType.IRIS);
      }
    });

    return biometricTypes;
  } catch (error) {
    console.error('Error getting biometric types:', error);
    return [];
  }
}

/**
 * Get human-readable name for biometric type
 */
export function getBiometricTypeName(type: BiometricType): string {
  switch (type) {
    case BiometricType.FINGERPRINT:
      return 'Fingerprint';
    case BiometricType.FACIAL_RECOGNITION:
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    case BiometricType.IRIS:
      return 'Iris Scan';
    default:
      return 'Biometric';
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometric(
  promptMessage?: string
): Promise<BiometricAuthResult> {
  try {
    // Check if biometric is available
    const isAvailable = await isBiometricAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: i18n.t('biometric.not_available'),
      };
    }

    // Check if biometric is enrolled
    const isEnrolled = await isBiometricEnrolled();
    if (!isEnrolled) {
      return {
        success: false,
        error: i18n.t('biometric.not_enrolled'),
      };
    }

    // Get biometric types for better error messages
    const types = await getSupportedBiometricTypes();
    const biometricType = types[0];

    // Authenticate
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to access your health data',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return {
        success: true,
        biometricType,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Check if biometric authentication should be used
 * (based on device capability and user preference)
 */
export async function shouldUseBiometric(userEnabled: boolean = true): Promise<boolean> {
  if (!userEnabled) {
    return false;
  }

  const isAvailable = await isBiometricAvailable();
  const isEnrolled = await isBiometricEnrolled();

  return isAvailable && isEnrolled;
}
