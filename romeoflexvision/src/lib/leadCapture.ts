export interface LeadCapturePayload {
  name: string;
  company: string;
  email: string;
  message: string;
  language: 'en' | 'he';
  pageUrl: string;
  source: string;
  website?: string;
}

const LEAD_CAPTURE_URL = import.meta.env.VITE_LEAD_CAPTURE_URL?.trim();

export function isLeadCaptureConfigured(): boolean {
  return Boolean(LEAD_CAPTURE_URL);
}

export async function submitLeadCapture(payload: LeadCapturePayload): Promise<void> {
  if (!LEAD_CAPTURE_URL) {
    throw new Error('Lead capture endpoint is not configured.');
  }

  const response = await fetch(LEAD_CAPTURE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return;
  }

  let errorMessage = 'Lead capture failed.';
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) {
      errorMessage = data.error;
    }
  } catch {
    // Keep the default message when the response is not JSON.
  }

  throw new Error(errorMessage);
}
