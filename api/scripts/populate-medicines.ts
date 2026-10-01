import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config.js';
import { parse } from 'csv-parse/sync';

const CSV_URL = 'https://storage.data.gov.my/healthcare/pharmaceutical_products.csv';

interface MalaysianDrug {
  reg_no: string;
  product: string;
  active_ingredient: string;
}

function parseActiveIngredients(raw: string): string[] {
  if (!raw || raw.trim() === '') return [];
  
  // Split by comma outside of brackets
  const ingredients: string[] = [];
  let current = '';
  let bracketDepth = 0;
  
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === '[') {
      bracketDepth++;
    } else if (char === ']') {
      bracketDepth--;
    } else if (char === ',' && bracketDepth === 0) {
      const ingredient = current.trim().split('[')[0].trim();
      if (ingredient) {
        ingredients.push(ingredient);
      }
      current = '';
      continue;
    }
    current += char;
  }
  
  // Add the last ingredient
  if (current.trim()) {
    const ingredient = current.trim().split('[')[0].trim();
    if (ingredient) {
      ingredients.push(ingredient);
    }
  }
  
  // Remove duplicates and normalize
  return [...new Set(ingredients.map(i => i.trim()))].filter(Boolean);
}

async function downloadCSV(): Promise<string> {
  console.log('Downloading CSV from Malaysian government...');
  const response = await fetch(CSV_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`);
  }
  
  const csv = await response.text();
  console.log(`Downloaded ${csv.length} bytes`);
  return csv;
}

async function parseCSV(csvContent: string): Promise<MalaysianDrug[]> {
  console.log('Parsing CSV with csv-parse library...');
  
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    }) as any[];
    
    console.log(`Parsed ${records.length} total records`);
    
    // Deduplicate by reg_no, keeping the first occurrence
    const seenRegNos = new Set<string>();
    const uniqueDrugs: MalaysianDrug[] = [];
    let duplicateCount = 0;
    
    for (const record of records) {
      const regNo = record.reg_no?.trim();
      const product = record.product?.trim();
      
      if (!regNo || !product) continue;
      
      if (seenRegNos.has(regNo)) {
        duplicateCount++;
        console.log(`Skipping duplicate reg_no: ${regNo} (${product})`);
        continue;
      }
      
      seenRegNos.add(regNo);
      uniqueDrugs.push({
        reg_no: regNo,
        product: product,
        active_ingredient: record.active_ingredient?.trim() || '',
      });
    }
    
    console.log(`Found ${uniqueDrugs.length} unique drugs (${duplicateCount} duplicates skipped)`);
    return uniqueDrugs;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
}

async function populateSupabase(drugs: MalaysianDrug[]) {
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  
  console.log('Clearing existing data...');
  const { error: deleteError } = await supabase
    .from('medicine_ingredients')
    .delete()
    .neq('registration_no', ''); // Delete all records
  
  if (deleteError) {
    console.warn('Warning during delete:', deleteError.message);
  }
  
  console.log('Inserting medicines into Supabase...');
  const batchSize = 500;
  let insertedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < drugs.length; i += batchSize) {
    const batch = drugs.slice(i, i + batchSize);
    const records = batch.map(drug => ({
      registration_no: drug.reg_no,
      medicine_name: drug.product,
      active_ingredients: parseActiveIngredients(drug.active_ingredient),
    }));
    
    const { error } = await supabase
      .from('medicine_ingredients')
      .insert(records);
    
    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      errorCount += batch.length;
    } else {
      insertedCount += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${insertedCount} / ${drugs.length} records`);
    }
  }
  
  console.log(`\nComplete! Inserted: ${insertedCount}, Errors: ${errorCount}`);
}

async function main() {
  try {
    const csvContent = await downloadCSV();
    const drugs = await parseCSV(csvContent);
    await populateSupabase(drugs);
    console.log('Successfully populated medicine database!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

