import * as cheerio from 'cheerio';
import type { Medicine } from '../types.js';
import { ScrapingError } from '../types.js';

export class QuestScraper {
  private readonly searchUrl = 'https://quest3plus.bpfk.gov.my/pmo2/content.php';
  private readonly detailUrl = 'https://quest3plus.bpfk.gov.my/pmo2/detail.php';

  async searchMedicines(searchTerm: string): Promise<Medicine[]> {
    try {
      const formData = new URLSearchParams({
        'func': 'search',
        'searchBy': '1',
        'searchTxt': searchTerm,
        'cat': '1'
      });
      
      const response = await fetch(this.searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        body: formData.toString()
      });
      
      if (!response.ok) {
        throw new ScrapingError(`Search failed with status ${response.status}`, 'quest');
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      return this.parseSearchResults($);
    } catch (error) {
      if (error instanceof ScrapingError) throw error;
      throw new ScrapingError(`Failed to search: ${error instanceof Error ? error.message : 'Unknown error'}`, 'quest');
    }
  }

  async getMedicineDetails(registrationNo: string): Promise<Medicine | null> {
    try {
      const url = `${this.detailUrl}?type=product&id=${registrationNo}`;
      const response = await fetch(url);
      
      if (!response.ok) return null;

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const medicineName = $('td:contains("Product Name :")').find('b').first().text().trim();
      const activeIngredients = this.extractActiveIngredients($);
      
      if (medicineName) {
        return { id: registrationNo, name: medicineName, activeIngredients };
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private parseSearchResults($: cheerio.CheerioAPI): Medicine[] {
    const medicines: Medicine[] = [];

    $('#searchTable tbody tr').each((_: number, element: any) => {
      const cells = $(element).find('td');
      if (cells.length >= 3) {
        const id = $(cells[1]).text().trim().replace(/[^\w]/g, '');
        const name = $(cells[2]).text().trim();
        
        if (id && name) {
          medicines.push({ id, name, activeIngredients: [] });
        }
      }
    });

    return medicines;
  }

  private extractActiveIngredients($: cheerio.CheerioAPI): string[] {
    const ingredients: string[] = [];
    
    $('#tab1 tr').each((_: number, row: any) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const num = $(cells[0]).text().trim();
        const ingredient = $(cells[1]).text().trim();
        
        if (num !== 'No' && ingredient && !ingredient.match(/^\d+$/)) {
          ingredients.push(ingredient);
        }
      }
    });
    
    return [...new Set(ingredients)];
  }
}
