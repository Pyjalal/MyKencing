import { MIMSSearchResult } from '../../types';

export const parseDosageFromStrength = (strength: string) => {
  const match = strength.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : '';
};

export const parseUnitFromStrength = (strength: string) => {
  const match = strength.match(/(MG|ML|MCG|G|IU)/i);
  if (match) {
    const unitValue = match[1].toLowerCase();
    if (unitValue === 'mg') return 'mg';
    if (unitValue === 'ml') return 'ml';
    if (unitValue === 'mcg') return 'mcg';
    if (unitValue === 'g') return 'g';
    if (unitValue === 'iu') return 'iu';
  }
  return 'tablet';
};

export const parseFormFromDosageForm = (dosageForm: string) => {
  const formValue = dosageForm.toLowerCase();
  if (formValue.includes('tablet')) return 'tablet';
  if (formValue.includes('capsule')) return 'capsule';
  if (formValue.includes('syrup') || formValue.includes('liquid')) return 'syrup';
  if (formValue.includes('injection')) return 'injection';
  if (formValue.includes('cream') || formValue.includes('ointment')) return 'cream';
  if (formValue.includes('drop')) return 'drops';
  if (formValue.includes('inhaler') || formValue.includes('puff')) return 'inhaler';
  return '';
};

export const capitalizeDosageForm = (dosageForm: string) => {
  if (!dosageForm) {
    return '';
  }
  return dosageForm.charAt(0).toUpperCase() + dosageForm.slice(1).toLowerCase();
};

export const getDisplayName = (medicine: MIMSSearchResult) =>
  medicine.brandName || medicine.genericName || '';

