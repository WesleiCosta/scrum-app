/**
 * Utilitários para performance e debounce
 */

/**
 * Função de debounce para reduzir frequência de execução
 * @param func Função a ser executada com debounce
 * @param wait Tempo de espera em milliseconds
 * @param immediate Se deve executar imediatamente na primeira chamada
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = window.setTimeout(later, wait);
    
    if (callNow) {
      func(...args);
    }
  };
}

/**
 * Throttle para limitar execução por tempo
 * @param func Função a ser executada
 * @param limit Limite de tempo em milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      window.setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Valida entrada de usuário de forma robusta
 * @param input String de entrada
 * @param type Tipo esperado ('number', 'percentage', 'date')
 */
export function sanitizeUserInput(input: string, type: 'number' | 'percentage' | 'date'): string | null {
  const cleaned = input.trim();
  
  if (cleaned === '') return null;
  
  switch (type) {
    case 'number':
      return /^-?\d*\.?\d*$/.test(cleaned) ? cleaned : null;
    case 'percentage':
      return /^\d{0,3}(\.\d{0,2})?$/.test(cleaned) ? cleaned : null;
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
    default:
      return null;
  }
}

/**
 * Comparação segura de float com tolerância
 */
export const FLOAT_TOLERANCE = 0.001;

export function safeFloatEquals(a: number, b: number, tolerance: number = FLOAT_TOLERANCE): boolean {
  return Math.abs(a - b) < tolerance;
}

/**
 * Validação robusta de data
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && 
         date.getFullYear() >= 1970 && 
         date.getFullYear() <= 2100;
}