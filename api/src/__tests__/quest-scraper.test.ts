import { QuestScraper } from '../services/quest-scraper';
import { ScrapingError } from '../types';

describe('QuestScraper', () => {
  const scraper = new QuestScraper();

  it('should search for Panadol', async () => {
    const results = await scraper.searchMedicines('panadol');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBeDefined();
    expect(results[0].name).toBeDefined();
  });

  it('should find Panadol Extra Caplet', async () => {
    const results = await scraper.searchMedicines('panadol');
    const panadolExtra = results.find(m => 
      m.name.toLowerCase().includes('panadol extra caplet')
    );
    
    expect(panadolExtra).toBeDefined();
  });

  it('should return empty array for invalid search', async () => {
    const results = await scraper.searchMedicines('nonexistentmedicine12345');
    expect(results.length).toBe(0);
  });

  it('should throw ScrapingError for network failures', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(scraper.searchMedicines('panadol')).rejects.toThrow(ScrapingError);
    
    global.fetch = originalFetch;
  });

  it('should get medicine details', async () => {
    const results = await scraper.searchMedicines('panadol');
    const details = await scraper.getMedicineDetails(results[0].id);
    
    expect(details).toBeDefined();
    expect(details?.name).toBeDefined();
    expect(details?.activeIngredients).toBeDefined();
  });

  it('should return null for invalid medicine ID', async () => {
    const details = await scraper.getMedicineDetails('invalid123');
    expect(details).toBeNull();
  });

  it('should parse paracetamol and caffeine from Panadol Extra Caplet', async () => {
    const results = await scraper.searchMedicines('panadol');
    const panadolExtra = results.find(m => 
      m.name.toLowerCase().includes('panadol extra caplet')
    );
    
    if (!panadolExtra) throw new Error('Panadol Extra Caplet not found');
    
    const details = await scraper.getMedicineDetails(panadolExtra.id);
    
    const hasParacetamol = details?.activeIngredients.some(i => 
      i.toLowerCase().includes('paracetamol')
    );
    const hasCaffeine = details?.activeIngredients.some(i => 
      i.toLowerCase().includes('caffeine')
    );
    
    expect(hasParacetamol).toBe(true);
    expect(hasCaffeine).toBe(true);
  });
});
