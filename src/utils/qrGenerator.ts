import QRCode from 'qrcode';

export interface QRDetails {
  name: string;
  patientId: number | string;
  age: number;
}

export async function generatePatientQrDataUrl(details: QRDetails): Promise<string> {
  const qrPayload = JSON.stringify({
    name: details.name,
    patientId: details.patientId,
    age: details.age,
  });

  return await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#1556A3',
      light: '#ffffff',
    },
  });
}
