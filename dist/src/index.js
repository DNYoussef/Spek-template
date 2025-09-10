/**
 * SPEK Template Main Entry Point
 *
 * Main application entry point for the SPEK-driven development template
 * with Claude Flow integration and comprehensive quality gates.
 */
import { z } from 'zod';
// Basic schema validation for SPEK template
const ConfigSchema = z.object({
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
});
/**
 * Main application class for SPEK template
 */
export class SPEKTemplate {
    config;
    constructor(config) {
        this.config = ConfigSchema.parse(config);
    }
    /**
     * Get the current configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Display welcome message
     */
    welcome() {
        return `Welcome to ${this.config.name} v${this.config.version}`;
    }
    /**
     * Basic health check
     */
    healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
        };
    }
}
/**
 * Default configuration
 */
const defaultConfig = {
    name: 'SPEK Template',
    version: '1.0.0',
    description: 'SPEK-driven development template with quality gates',
};
/**
 * Main function
 */
export function main() {
    const app = new SPEKTemplate(defaultConfig);
    console.log(app.welcome());
    console.log('Health check:', app.healthCheck());
}
// Auto-run if this is the main module
if (require.main === module) {
    main();
}
export default SPEKTemplate;
//# sourceMappingURL=index.js.map