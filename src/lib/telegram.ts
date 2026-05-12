/**
 * Robust Telegram API Client
 */

export async function callTelegram(token: string, method: string, body: any = null) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  
  try {
    const options: RequestInit = {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : null,
      // We use a longer timeout for general calls
      signal: AbortSignal.timeout(15000),
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.description || `Telegram error ${response.status}`,
        code: response.status
      };
    }

    return { ok: true, result: data.result };
  } catch (error: any) {
    console.error(`[Telegram] Error calling ${method}:`, error);
    return {
      ok: false,
      error: `Connection error: ${error.message}`,
      isNetworkError: true
    };
  }
}
