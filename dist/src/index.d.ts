/**
 * SPEK Template Main Entry Point

 * Main application entry point for the SPEK-driven development template
 * with Claude Flow integration and comprehensive quality gates.
 */
import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    description?: string | undefined;
}, {
    name: string;
    version: string;
    description?: string | undefined;
}>;
type Config = z.infer<typeof ConfigSchema>;
/**
 * Main application class for SPEK template
 */
export declare class SPEKTemplate {
    private config;
    constructor(config: Config);
    /**
     * Get the current configuration
     */
    getConfig(): Config;
    /**
     * Display welcome message
     */
    welcome(): string;
    /**
     * Basic health check
     */
    healthCheck(): {
        status: string;
        timestamp: string;
    };
}
/**
 * Main function
 */
export declare function main(): void;
export default SPEKTemplate;
//# sourceMappingURL=index.d.ts.map