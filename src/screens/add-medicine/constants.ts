import { MEDICATION_TIMING } from '../../constants/clinical';

export const FREQUENCY_OPTIONS = [
  { label: 'Once daily', value: 'once', times: 1, defaultTimes: MEDICATION_TIMING.onceDailyMorning },
  { label: 'Twice daily', value: 'twice', times: 2, defaultTimes: MEDICATION_TIMING.twiceDaily },
  { label: 'Three times daily', value: 'three', times: 3, defaultTimes: MEDICATION_TIMING.threeTimesDaily },
  { label: 'Every 8 hours', value: 'every_8h', times: 3, defaultTimes: MEDICATION_TIMING.threeTimesDaily },
  { label: 'Every 6 hours', value: 'every_6h', times: 4, defaultTimes: MEDICATION_TIMING.fourTimesDaily },
  { label: 'Four times daily', value: 'four', times: 4, defaultTimes: MEDICATION_TIMING.fourTimesDaily },
] as const;

export const FORM_OPTIONS = [
  { label: 'Tablet', value: 'tablet' },
  { label: 'Capsule', value: 'capsule' },
  { label: 'Syrup', value: 'syrup' },
  { label: 'Injection', value: 'injection' },
  { label: 'Drops', value: 'drops' },
  { label: 'Inhaler', value: 'inhaler' },
  { label: 'Cream', value: 'cream' },
  { label: 'Ointment', value: 'ointment' },
] as const;

export const UNIT_OPTIONS = [
  { label: 'tablet', value: 'tablet' },
  { label: 'capsule', value: 'capsule' },
  { label: 'mg', value: 'mg' },
  { label: 'ml', value: 'ml' },
  { label: 'drops', value: 'drops' },
  { label: 'puff', value: 'puff' },
] as const;

