import { Patient } from '../types';

export function getLetterPadHtml(patient: Patient, qrDataUrl: string): string {
  const patientIdFormatted = String(patient.patientId).padStart(3, '0');
  const dateFormatted = patient.created
    ? new Date(patient.created).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  // Prevent displaying raw UUID in case it wasn't mapped prior
  const isDeptUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    patient.department || ''
  );
  const displayDepartment = isDeptUuid
    ? 'General Medicine & OPD'
    : patient.department || 'General OPD';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Pragati Foundation - OPD Case Paper #${patientIdFormatted}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .print-wrapper { border: none !important; box-shadow: none !important; }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .print-bar {
      width: 100%;
      max-width: 800px;
      margin-bottom: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn-print {
      background: #1556A3;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-print:hover {
      background: #0d3e78;
    }
    .print-wrapper {
      width: 100%;
      max-width: 800px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #1556A3;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .org-title {
      font-size: 26px;
      font-weight: 800;
      color: #1556A3;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .org-sub {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .tagline {
      display: inline-block;
      margin-top: 6px;
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .qr-box {
      text-align: center;
    }
    .qr-img {
      width: 110px;
      height: 110px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 3px;
    }
    .patient-id-badge {
      font-size: 12px;
      font-weight: 800;
      color: #1556A3;
      margin-top: 4px;
    }
    .patient-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background: #f1f5f9;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .info-item {
      display: flex;
    }
    .info-label {
      width: 130px;
      color: #475569;
      font-weight: 600;
    }
    .info-val {
      color: #0f172a;
      font-weight: 700;
    }
    .full-row {
      grid-column: span 2;
    }
    .workflow-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .card-box {
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 14px;
      background: #fafafa;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: #1556A3;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .vitals-checklist {
      font-size: 12px;
      line-height: 1.8;
      color: #334155;
    }
    .counter-checkpoints {
      font-size: 12px;
      line-height: 1.8;
      color: #334155;
    }
    .rx-section {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      min-height: 220px;
      position: relative;
    }
    .rx-symbol {
      font-size: 26px;
      font-weight: bold;
      font-family: Georgia, serif;
      color: #1556A3;
      margin-bottom: 8px;
    }
    .rx-placeholder {
      color: #94a3b8;
      font-size: 12px;
      text-align: center;
      margin-top: 60px;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #64748b;
    }
    .doc-sign {
      width: 180px;
      text-align: center;
      border-top: 1px solid #94a3b8;
      padding-top: 4px;
      font-size: 12px;
      color: #334155;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <button class="btn-print" onclick="window.print()">
      &#128438; Print / Save as PDF
    </button>
  </div>

  <div class="print-wrapper">
    <div class="header">
      <div>
        <div class="org-title">Pragati Foundation</div>
        <div class="org-sub">Comprehensive Healthcare & Free Community Camp Outreach</div>
        <div class="tagline">OUTPATIENT DEPARTMENT (OPD) CASE SLIP</div>
      </div>
      <div class="qr-box">
        <img src="${qrDataUrl}" alt="Patient QR Code" class="qr-img" />
        <div class="patient-id-badge">PATIENT ID: #${patientIdFormatted}</div>
      </div>
    </div>

    <div class="patient-info-grid">
      <div class="info-item"><span class="info-label">Patient ID:</span><span class="info-val">#${patientIdFormatted}</span></div>
      <div class="info-item"><span class="info-label">Date:</span><span class="info-val">${dateFormatted}</span></div>
      <div class="info-item"><span class="info-label">Patient Name:</span><span class="info-val">${patient.name}</span></div>
      <div class="info-item"><span class="info-label">Age / Gender:</span><span class="info-val">${patient.age} Yrs / ${patient.gender}</span></div>
      <div class="info-item"><span class="info-label">Mobile:</span><span class="info-val">${patient.mobile}</span></div>
      <div class="info-item"><span class="info-label">Department:</span><span class="info-val">${displayDepartment}</span></div>
      <div class="info-item full-row"><span class="info-label">Complaint:</span><span class="info-val">${patient.complaint}</span></div>
      ${patient.address ? `<div class="info-item full-row"><span class="info-label">Address:</span><span class="info-val">${patient.address}</span></div>` : ''}
    </div>

    <div class="workflow-grid">
      <div class="card-box">
        <div class="card-title">Vitals Station Checklist</div>
        <div class="vitals-checklist">
          <div>BP: &nbsp;________________ mmHg</div>
          <div>Pulse: ________________ bpm</div>
          <div>Temp: ________________ &deg;F</div>
          <div>SpO2: ________________ %</div>
          <div>Weight: _____________ kg &nbsp;|&nbsp; Height: _________ cm</div>
        </div>
      </div>

      <div class="card-box">
        <div class="card-title">Camp Counter Checkpoints</div>
        <div class="counter-checkpoints">
          <div>[&nbsp;&nbsp;] 1. Registration Desk (Completed)</div>
          <div>[&nbsp;&nbsp;] 2. Vitals Triage</div>
          <div>[&nbsp;&nbsp;] 3. Doctor Consultation (Dr. ID: _______)</div>
          <div>[&nbsp;&nbsp;] 4. Diagnostic Tests Counter</div>
          <div>[&nbsp;&nbsp;] 5. Referral Counter</div>
          <div>[&nbsp;&nbsp;] 6. Pharmacy Counter</div>
        </div>
      </div>
    </div>

    <div class="rx-section">
      <div class="rx-symbol">&#8478; Doctor's Prescription & Clinical Advice</div>
      <div class="rx-placeholder">
        (Doctor's examination notes, diagnoses, and medication prescriptions)
      </div>
    </div>

    <div class="footer">
      <div>
        <strong>Emergency Helpline:</strong> 1800-XXX-XXXX<br />
        <strong>Official Portal:</strong> https://pragatifoundation.com
      </div>
      <div class="doc-sign">
        Consultant Doctor Signature
      </div>
    </div>
  </div>

  <script>
    // Trigger print dialog automatically when document is ready
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;
}

export function openLetterPadInNewTab(patient: Patient, qrDataUrl: string): void {
  const html = getLetterPadHtml(patient, qrDataUrl);
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.open();
    newWindow.document.write(html);
    newWindow.document.close();
  }
}
