import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Handle error and show snackbar message
 */
export function handleError(
  error: any,
  snackBar: MatSnackBar,
  defaultMessage: string,
  logMessage?: string
): void {
  if (logMessage) {
    console.error(logMessage, error);
  }
  const errorMsg = error?.error?.message || defaultMessage;
  snackBar.open(errorMsg, 'Close', { duration: 5000 });
}

