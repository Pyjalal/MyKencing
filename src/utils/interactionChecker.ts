import { Alert } from 'react-native';
import { useMedicationStore } from '../stores/medicationStore';
import { useInteractionStore } from '../stores/interactionStore';
import { isHighRiskInteraction, isMedicationInvolvedInInteraction } from './interactionFilters';
import type { ApiInteraction } from '../services/api-client';

/**
 * Checks for high-risk interactions after adding a new medication
 * Shows an alert if there are unacknowledged high-risk interactions
 * @param medicationId - The ID of the newly added medication
 * @param navigation - Navigation object to navigate to detail page
 * @returns Promise<boolean> - Returns true if should navigate back, false if navigating to detail page
 */
export async function checkHighRiskInteractionsAfterAdd(
  medicationId: string,
  navigation: any
): Promise<boolean> {
  try {
    console.log('[interactionChecker] Checking high-risk interactions for new medication:', medicationId);
    
    // Get the newly added medication
    const medication = useMedicationStore.getState().getMedicationById(medicationId);
    
    if (!medication) {
      console.log('[interactionChecker] Medication not found');
      return true; // Navigate back
    }

    // Get all active medications
    const allActiveMeds = useMedicationStore.getState().medications.filter(m => m.isActive);
    
    // If this is the only medication, no interactions to check
    if (allActiveMeds.length <= 1) {
      console.log('[interactionChecker] Only one medication, no interactions to check');
      return true; // Navigate back
    }

    // Get registration numbers for all active medications
    const medIds = allActiveMeds.map(m => m.registrationNo).filter(Boolean) as string[];
    console.log('[interactionChecker] Checking interactions for medications:', medIds);

    // Check interactions using the interaction store
    const result = await useInteractionStore.getState().getInteractions(medIds);
    
    if (!result.hasInteractions) {
      console.log('[interactionChecker] No interactions found');
      return true; // Navigate back
    }

    // Get the medication's active ingredients
    const activeIngredients = medication.mims.activeIngredients || [];
    console.log('[interactionChecker] Medication active ingredients:', activeIngredients);

    // Filter to high-risk interactions involving this medication
    const relevantHighRiskInteractions = result.interactions.filter((interaction: ApiInteraction) => {
      return isHighRiskInteraction(interaction) && 
             isMedicationInvolvedInInteraction(activeIngredients, interaction);
    });

    console.log('[interactionChecker] Found', relevantHighRiskInteractions.length, 'relevant high-risk interactions');

    if (relevantHighRiskInteractions.length === 0) {
      console.log('[interactionChecker] No high-risk interactions found');
      return true; // Navigate back
    }

    // Get unacknowledged interactions
    const acknowledgedIds = medication.acknowledgedInteractionIds || [];
    const unacknowledgedInteractions = relevantHighRiskInteractions.filter(
      (interaction: ApiInteraction) => !acknowledgedIds.includes(interaction.interactionId)
    );

    console.log('[interactionChecker] Found', unacknowledgedInteractions.length, 'unacknowledged high-risk interactions');

    // Show alert if there are unacknowledged high-risk interactions
    if (unacknowledgedInteractions.length > 0) {
      const medicationName = medication.mims.brandName || medication.mims.genericName;
      const interactionCount = unacknowledgedInteractions.length;
      const interactionWord = interactionCount === 1 ? 'interaction' : 'interactions';
      
      // Build a summary of interactions
      const interactionSummary = unacknowledgedInteractions
        .slice(0, 2) // Show first 2 interactions
        .map((i: ApiInteraction) => `• ${i.firstReactant} + ${i.secondReactant}`)
        .join('\n');
      
      const moreText = unacknowledgedInteractions.length > 2 
        ? `\n...and ${unacknowledgedInteractions.length - 2} more`
        : '';

      return new Promise<boolean>((resolve) => {
        Alert.alert(
          '️High-Risk Drug Interactions Detected',
          `${medicationName} has ${interactionCount} unacknowledged high-risk ${interactionWord} with your existing medications:\n\n${interactionSummary}${moreText}\n\nPlease review the details and acknowledge that you understand the risks.`,
          [
            {
              text: 'View Details',
              onPress: () => {
                // Navigate to the medicine detail page
                navigation.navigate('MedicineDetail', { medicationId });
                resolve(false); // Don't navigate back - we're navigating to detail page
              },
            },
            {
              text: 'Later',
              style: 'destructive',
              onPress: () => {
                resolve(true); // Navigate back
              },
            },
          ]
        );
      });
    }

    return true; // Navigate back
  } catch (error) {
    console.error('[interactionChecker] Error checking interactions:', error);
    // Don't show error to user - this is a background check
    return true; // Navigate back on error
  }
}

