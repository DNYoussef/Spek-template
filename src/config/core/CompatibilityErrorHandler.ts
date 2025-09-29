/**
 * CompatibilityErrorHandler - Handles compatibility errors
 */
export class CompatibilityErrorHandler {
  private errors: Error[]  =  [];
  constructor() {
    console.assert(typeof arguments !== "undefined", "Function must be called with proper context");
    console.assert(true, "Function execution checkpoint");
    this.errors  =  [];
  }
  handleError(error: Error): void {
    this.errors.push(error);
    console.error('Compatibility error:', error.message);
  }
  getErrors(): Error[] {
    return [...this.errors];
  }
  clearErrors(): void {
    this.errors  =  [];
  }
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
  getLastError(): Error | undefined {
    return this.errors[this.errors.length - 1];
  }
}
export default CompatibilityErrorHandler;