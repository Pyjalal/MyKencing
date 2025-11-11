/**
 * PDF Export Service
 * Generates PDF reports for doctors with medication and vitals data
 */

import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import { VitalType } from '../types';
import { getDatabase } from './database';
import { ExportData } from '../types';
import { getMedicineDetails } from './mymedix-api';

/**
 * Generate HTML for PDF report
 */
function generateReportHTML(data: ExportData): string {
  const {
    generatedAt,
    patientName,
    medications,
    adherenceSummaries,
    recentVitals,
    periodStart,
    periodEnd,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyKencing Medical Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #2D9F9F;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 24pt;
      color: #2D9F9F;
      margin-bottom: 10px;
    }

    .header .subtitle {
      font-size: 10pt;
      color: #666;
    }

    .info-section {
      margin-bottom: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .info-section .label {
      font-weight: bold;
      color: #555;
    }

    .section {
      margin-top: 30px;
    }

    .section h2 {
      font-size: 16pt;
      color: #2D9F9F;
      border-bottom: 2px solid #E8F5F5;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    th {
      background: #2D9F9F;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
    }

    td {
      border: 1px solid #ddd;
      padding: 10px;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    .adherence-good {
      color: #16A34A;
      font-weight: bold;
    }

    .adherence-moderate {
      color: #F59E0B;
      font-weight: bold;
    }

    .adherence-poor {
      color: #DC2626;
      font-weight: bold;
    }

    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 15px;
    }

    .vital-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: white;
    }

    .vital-card h3 {
      font-size: 12pt;
      color: #2D9F9F;
      margin-bottom: 10px;
    }

    .vital-value {
      font-size: 18pt;
      font-weight: bold;
      color: #333;
    }

    .vital-unit {
      font-size: 10pt;
      color: #666;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #E8F5F5;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }

    .disclaimer {
      margin-top: 30px;
      padding: 15px;
      background: #FFF4E6;
      border-left: 4px solid #F59E0B;
      font-size: 9pt;
      color: #555;
    }

    @media print {
      body {
        padding: 10px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>MyKencing Medical Report</h1>
    <p class="subtitle">Generated on ${new Date(generatedAt).toLocaleString('en-MY')}</p>
    ${patientName ? `<p class="subtitle">Patient: ${patientName}</p>` : ''}
    <p class="subtitle">Report Period: ${new Date(periodStart).toLocaleDateString('en-MY')} - ${new Date(periodEnd).toLocaleDateString('en-MY')}</p>
  </div>

  <div class="section">
    <h2>Current Medications</h2>
    <table>
      <thead>
        <tr>
          <th>Medication</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Times</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${medications
          .map(
            med => `
          <tr>
            <td><strong>${med.mims.brandName || med.mims.genericName}</strong><br>
                <small style="color: #666">${med.mims.genericName}</small></td>
            <td>${med.userDosage}</td>
            <td>${med.frequency}x daily</td>
            <td>${med.times.join(', ')}</td>
            <td>${med.mims.foodInstructions || 'No specific instructions'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Medication Adherence</h2>
    <table>
      <thead>
        <tr>
          <th>Medication</th>
          <th>Total Doses</th>
          <th>Taken</th>
          <th>Skipped</th>
          <th>Missed</th>
          <th>Adherence Rate</th>
        </tr>
      </thead>
      <tbody>
        ${adherenceSummaries
          .map(summary => {
            let adherenceClass = 'adherence-poor';
            if (summary.adherenceRate >= 80) adherenceClass = 'adherence-good';
            else if (summary.adherenceRate >= 60) adherenceClass = 'adherence-moderate';

            return `
          <tr>
            <td>${summary.medicationName}</td>
            <td>${summary.totalScheduled}</td>
            <td>${summary.totalTaken}</td>
            <td>${summary.totalSkipped}</td>
            <td>${summary.totalMissed}</td>
            <td class="${adherenceClass}">${summary.adherenceRate.toFixed(1)}%</td>
          </tr>
        `;
          })
          .join('')}
      </tbody>
    </table>
  </div>

  ${
    recentVitals.bloodPressure.length > 0
      ? `
  <div class="section">
    <h2>Blood Pressure Readings</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Systolic</th>
          <th>Diastolic</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${recentVitals.bloodPressure
          .slice(0, 10)
          .map(
            bp => `
          <tr>
            <td>${new Date(bp.measuredAt).toLocaleString('en-MY')}</td>
            <td>${bp.systolic} mmHg</td>
            <td>${bp.diastolic} mmHg</td>
            <td>${bp.notes || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  ${
    recentVitals.glucose.length > 0
      ? `
  <div class="section">
    <h2>Glucose Readings</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Value</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${recentVitals.glucose
          .slice(0, 10)
          .map(
            glucose => `
          <tr>
            <td>${new Date(glucose.measuredAt).toLocaleString('en-MY')}</td>
            <td>${glucose.value} ${glucose.unit}</td>
            <td>${glucose.notes || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  ${
    recentVitals.waistCircumference.length > 0
      ? `
  <div class="section">
    <h2>Waist Circumference</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Value</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${recentVitals.waistCircumference
          .slice(0, 10)
          .map(
            waist => `
          <tr>
            <td>${new Date(waist.measuredAt).toLocaleString('en-MY')}</td>
            <td>${waist.value} cm</td>
            <td>${waist.notes || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  ${
    recentVitals.totalCholesterol.length > 0
      ? `
  <div class="section">
    <h2>Total Cholesterol</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Value</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${recentVitals.totalCholesterol
          .slice(0, 10)
          .map(
            chol => `
          <tr>
            <td>${new Date(chol.measuredAt).toLocaleString('en-MY')}</td>
            <td>${chol.value} mmol/L</td>
            <td>${chol.notes || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  ${
    recentVitals.hdlCholesterol.length > 0
      ? `
  <div class="section">
    <h2>HDL Cholesterol</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Value</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${recentVitals.hdlCholesterol
          .slice(0, 10)
          .map(
            chol => `
          <tr>
            <td>${new Date(chol.measuredAt).toLocaleString('en-MY')}</td>
            <td>${chol.value} mmol/L</td>
            <td>${chol.notes || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated from self-reported data entered in the MyKencing app.
    It should be used as a reference only and does not replace professional medical advice.
    Please consult your healthcare provider for medical decisions.
  </div>

  <div class="footer">
    <p>Generated with MyKencing - Personal Medication Management App</p>
    <p>For healthcare professional use only</p>
  </div>
</body>
</html>
  `;
}

/**
 * Gather export data from database
 */
export async function gatherExportData(
  periodDays: number = 30
): Promise<ExportData> {
  const db = getDatabase();
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);

  // Get medications
  const medications = await db.getAllAsync(
    `SELECT m.*
     FROM medications m
     WHERE m.is_active = 1`
  );

  // Fetch medicine details from API for each medication
  const medicationsWithDetails = await Promise.all(
    medications.map(async (med: any) => {
      let mimsData: any = {
        id: med.registration_no,
        genericName: 'Unknown Medicine',
        brandName: 'Medicine details unavailable',
        source: 'PNF',
        lastUpdated: new Date().toISOString(),
        createdAt: med.created_at,
        activeIngredients: [],
      };

      // Try to fetch medicine details from API
      if (med.registration_no) {
        try {
          const medicineDetails = await getMedicineDetails(med.registration_no);
          if (medicineDetails) {
            mimsData = medicineDetails;
          }
        } catch (apiError) {
          console.warn(`Failed to fetch medicine details for ${med.registration_no}:`, apiError);
        }
      }

      return {
        id: med.id,
        registrationNo: med.registration_no,
        userDosage: med.user_dosage,
        frequency: med.frequency,
        times: JSON.parse(med.times),
        withFood: med.with_food,
        startDate: med.start_date,
        endDate: med.end_date,
        refillDate: med.refill_date,
        isActive: med.is_active === 1,
        notes: med.notes,
        createdAt: med.created_at,
        updatedAt: med.updated_at,
        mims: mimsData,
      };
    }));

  // Get adherence summaries
  const adherenceSummaries = await Promise.all(
    medicationsWithDetails.map(async (med: any) => {
      const stats = await db.getFirstAsync(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken,
           SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
           SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
         FROM doses
         WHERE medication_id = ?
         AND scheduled_time >= ?
         AND scheduled_time <= ?`,
        [med.id, periodStart.toISOString(), periodEnd.toISOString()]
      );

      const total = stats?.total || 0;
      const taken = stats?.taken || 0;

      return {
        medicationId: med.id,
        medicationName: med.mims.brandName || med.mims.genericName,
        totalScheduled: total,
        totalTaken: taken,
        totalSkipped: stats?.skipped || 0,
        totalMissed: stats?.missed || 0,
        adherenceRate: total > 0 ? (taken / total) * 100 : 0,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      };
    })
  );

  // Get recent vitals
  const bloodPressure = await db.getAllAsync(
    `SELECT * FROM vitals
     WHERE type = 'blood_pressure'
     AND measured_at >= ?
     ORDER BY measured_at DESC
     LIMIT 30`,
    [periodStart.toISOString()]
  );

  const glucose = await db.getAllAsync(
    `SELECT * FROM vitals
     WHERE type = 'glucose'
     AND measured_at >= ?
     ORDER BY measured_at DESC
     LIMIT 30`,
    [periodStart.toISOString()]
  );

  const weight = await db.getAllAsync(
    `SELECT * FROM vitals
     WHERE type = 'weight'
     AND measured_at >= ?
     ORDER BY measured_at DESC
     LIMIT 30`,
    [periodStart.toISOString()]
  );

  const waistCircumference = await db.getAllAsync(
    `SELECT * FROM vitals
     WHERE type = 'waist_circumference'
     AND measured_at >= ?
     ORDER BY measured_at DESC
     LIMIT 30`,
    [periodStart.toISOString()]
  );

  const totalCholesterol = await db.getAllAsync(
    `SELECT * FROM vitals
     WHERE type = 'total_cholesterol'
     AND measured_at >= ?
     ORDER BY measured_at DESC
     LIMIT 30`,
    [periodStart.toISOString()]
  );

  const hdlCholesterol = await db.getAllAsync(
    `SELECT * FROM vitals
     WHERE type = 'hdl_cholesterol'
     AND measured_at >= ?
     ORDER BY measured_at DESC
     LIMIT 30`,
    [periodStart.toISOString()]
  );

  return {
    generatedAt: new Date().toISOString(),
    medications: medicationsWithDetails as any,
    adherenceSummaries,
    recentVitals: {
      bloodPressure: bloodPressure.map((v: any) => ({
        id: v.id,
        type: VitalType.BloodPressure,
        systolic: v.systolic,
        diastolic: v.diastolic,
        unit: 'mmHg' as const,
        measuredAt: v.measured_at,
        notes: v.notes,
        createdAt: v.created_at,
      })),
      glucose: glucose.map((v: any) => ({
        id: v.id,
        type: VitalType.Glucose,
        value: v.value,
        unit: v.unit as 'mmol/L' | 'mg/dL',
        measuredAt: v.measured_at,
        notes: v.notes,
        createdAt: v.created_at,
      })),
      weight: weight.map((v: any) => ({
        id: v.id,
        type: VitalType.Weight,
        value: v.value,
        unit: v.unit as 'kg' | 'lb',
        measuredAt: v.measured_at,
        notes: v.notes,
        createdAt: v.created_at,
      })),
      waistCircumference: waistCircumference.map((v: any) => ({
        id: v.id,
        type: VitalType.WaistCircumference,
        value: v.value,
        unit: 'cm' as const,
        measuredAt: v.measured_at,
        notes: v.notes,
        createdAt: v.created_at,
      })),
      totalCholesterol: totalCholesterol.map((v: any) => ({
        id: v.id,
        type: VitalType.TotalCholesterol,
        value: v.value,
        unit: 'mmol/L' as const,
        measuredAt: v.measured_at,
        notes: v.notes,
        createdAt: v.created_at,
      })),
      hdlCholesterol: hdlCholesterol.map((v: any) => ({
        id: v.id,
        type: VitalType.HDLCholesterol,
        value: v.value,
        unit: 'mmol/L' as const,
        measuredAt: v.measured_at,
        notes: v.notes,
        createdAt: v.created_at,
      })),
    },
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  };
}

/**
 * Generate and share PDF report
 */
export async function generateAndShareReport(
  periodDays: number = 30
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    // Gather data
    const data = await gatherExportData(periodDays);

    // Generate HTML
    const html = generateReportHTML(data);

    // Save HTML to cache (no permissions needed) and share
    const filename = `MyKencing_Report_${Date.now()}.html`;
    const file = new File(Paths.cache, filename);
    await file.create();
    await file.write(html);
    
    // Share the file - user can choose where to save it
    await Sharing.shareAsync(file.uri, { 
      mimeType: 'text/html',
      dialogTitle: 'Share Medical Report',
      UTI: 'public.html'
    });

    return { success: true };
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report',
    };
  }
}

/**
 * Save report to device storage
 */
export async function saveReportToDevice(
  periodDays: number = 30
): Promise<{ success: boolean; filepath?: string; error?: string }> {
  try {
    const data = await gatherExportData(periodDays);
    const html = generateReportHTML(data);
    const filename = `MyKencing_Report_${Date.now()}.html`;
    const file = new File(Paths.cache, filename);
    await file.create();
    await file.write(html);
    return { success: true, filepath: file.uri };
  } catch (error) {
    console.error('Error saving report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save report',
    };
  }
}
