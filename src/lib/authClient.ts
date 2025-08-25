// Client-side authentication utilities
// This file can be safely imported in client-side components

export function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
  
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  
  return null;
}

export function clearTokenCookie(): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/clear-token', { method: 'POST' });
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    clearTokenCookie();
  }
}
