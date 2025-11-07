export interface Medicine {
  id: string;
  name: string;
  activeIngredients: string[];
  similarity?: number; // Backend-calculated similarity score (0-1)
}

export interface MedicineSearchResponse {
  results: Medicine[];
}

export interface DrugInteraction {
  interactionId: string;
  firstReactant: string;
  secondReactant: string;
  severity: string;
  explanation: string;
  action: string;
  warningCode: string;
  actionRating: {
    rating: string;
    description: string;
  };
  severityRating: {
    rating: string;
    description: string;
  };
  evidenceRating: {
    rating: string;
    description: string;
  };
}

export interface InteractionCheckResponse {
  count: number;
  interactions: DrugInteraction[];
  medicines: Medicine[];
}

export interface StockleyResponse {
  count: number;
  interactions: StockleyInteraction[];
  ontologyData: OntologyData[];
  reactantValidities: ReactantValidity[];
}

export interface StockleyInteraction {
  interactionIdentityNumber: string;
  firstReactant: string;
  firstReactantRoute: string;
  secondReactant: string;
  secondReactantRoute: string;
  explanation: string;
  action: string;
  warningCode: string;
  actionRating: {
    clz: string;
    rating: string;
    description: string;
  };
  severityRating: {
    clz: string;
    rating: string;
    description: string;
  };
  evidenceRating: {
    clz: string;
    rating: string;
    description: string;
  };
  pageLink: {
    clz: string;
    publication: string;
    plainTitle: string;
    id: string;
    title: string;
  };
}

export interface OntologyData {
  clz: string;
  narrowerTerms: string[];
  originalTerm: string;
  synonyms: string[];
  broaderTerms: string[];
  ingredients: string[];
  labels: string[];
}

export interface ReactantValidity {
  isPrep: boolean;
  clz: string;
  ontologyTermValidity: {
    clz: string;
    originalOntologyTerm: string;
    validity: string;
  };
}

export interface MedicineIngredient {
  id: string;
  registration_no: string;
  medicine_name: string;
  active_ingredients: string[];
  created_at: string;
  updated_at: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ScrapingError extends Error {
  constructor(message: string, public source: 'quest' | 'stockley') {
    super(message);
    this.name = 'ScrapingError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
