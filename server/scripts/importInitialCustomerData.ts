import fs from 'fs';
import path from 'path';
import { importCustomersFromXLSX } from '../lib/xlsxCustomerImporter';

async function main() {
  console.log('[Initial Import] Starting customer data import from XLSX...');
  
  // Path to the attached XLSX file
  const xlsxPath = path.join(process.cwd(), 'attached_assets', 'Customer List_Dated 10_01_12 - 10_23_25-3_1761262846661.xlsx');
  
  console.log(`[Initial Import] Reading file: ${xlsxPath}`);
  
  if (!fs.existsSync(xlsxPath)) {
    console.error(`[Initial Import] ❌ File not found: ${xlsxPath}`);
    process.exit(1);
  }
  
  // Read the file into a buffer
  const xlsxBuffer = fs.readFileSync(xlsxPath);
  console.log(`[Initial Import] File size: ${(xlsxBuffer.length / 1024).toFixed(1)} KB`);
  
  try {
    // Import the data
    const result = await importCustomersFromXLSX(xlsxBuffer, 'initial_import');
    
    console.log('\n[Initial Import] ✅ Import completed successfully!');
    console.log(`- Customers imported: ${result.customersImported}`);
    console.log(`- Contacts imported: ${result.contactsImported}`);
    console.log(`- Total revenue: $${(result.totalRevenue / 100).toLocaleString()}`);
    console.log(`- Errors: ${result.errors}`);
    
    process.exit(0);
  } catch (error) {
    console.error('[Initial Import] ❌ Import failed:', error);
    process.exit(1);
  }
}

main();
