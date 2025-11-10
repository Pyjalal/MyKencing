import type { ApiInteraction } from '../services/api-client';

/**
 * Checks if a medication's active ingredients are involved in an interaction
 * @param activeIngredients - Array of active ingredient names from the medication
 * @param interaction - The interaction to check
 * @returns true if any active ingredient is involved in the interaction
 */
export function isMedicationInvolvedInInteraction(
  activeIngredients: string[],
  interaction: ApiInteraction
): boolean {
  return activeIngredients.some(ingredient => {
    const ingredientLower = ingredient.toLowerCase();
    const firstReactantLower = interaction.firstReactant.toLowerCase();
    const secondReactantLower = interaction.secondReactant.toLowerCase();
    
    return firstReactantLower.includes(ingredientLower) || 
           ingredientLower.includes(firstReactantLower) ||
           secondReactantLower.includes(ingredientLower) ||
           ingredientLower.includes(secondReactantLower);
  });
}

/**
 * Checks if an interaction is considered high-risk
 * @param interaction - The interaction to check
 * @returns true if the interaction is high-risk (severe/high severity)
 */
export function isHighRiskInteraction(interaction: ApiInteraction): boolean {
  const severity = interaction.severityRating?.rating || interaction.severity || '';
  return severity.toLowerCase().includes('severe') || severity.toLowerCase().includes('high');
}

