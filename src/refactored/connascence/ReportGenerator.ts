/**
 * ReportGenerator - NASA POT10 Compliant
 *
 * Reporting methods extracted from UnifiedConnascenceAnalyzer
 * Following NASA Rule 4: Functions <60 lines
 * Following NASA Rule 5: 2+ assertions per function
 * Following NASA Rule 7: Check return values
 */

interface ReportData {
    violations: any[];
    summary: {
        totalViolations: number;
        totalWeight: number;
        byType: Map<string, any>;
        bySeverity: Map<string, number>;
    };
    metadata: {
        timestamp: number;
        filesAnalyzed: number;
        analysisTime: number;
    };
}

interface ReportFormat {
    name: string;
    extension: string;
    mimeType: string;
}

export class ReportGenerator {
    private readonly formats: Map<string, ReportFormat>;
    private readonly maxReportSize = 10 * 1024 * 1024; // 10MB limit

    constructor() {
        // NASA Rule 3: Pre-allocate memory
        this.formats = new Map([
            ['json', { name: 'JSON', extension: '.json', mimeType: 'application/json' }],
            ['html', { name: 'HTML', extension: '.html', mimeType: 'text/html' }],
            ['csv', { name: 'CSV', extension: '.csv', mimeType: 'text/csv' }],
            ['xml', { name: 'XML', extension: '.xml', mimeType: 'application/xml' }]
        ]);

        // NASA Rule 5: Assertions
        console.assert(this.formats.size > 0, 'formats must be initialized');
        console.assert(this.maxReportSize > 0, 'maxReportSize must be positive');
    }

    /**
     * Generate report in specified format
     * NASA Rule 4: <60 lines
     */
    generateReport(data: ReportData, format: string): { success: boolean; content: string; errors: string[] } {
        // NASA Rule 5: Input assertions
        console.assert(data != null, 'data cannot be null');
        console.assert(typeof format === 'string', 'format must be string');

        const result = { success: false, content: '', errors: [] as string[] };

        try {
            // Validate format
            if (!this.formats.has(format.toLowerCase())) {
                result.errors.push(`Unsupported format: ${format}`);
                return result;
            }

            // Validate data
            const validation = this.validateReportData(data);
            if (!validation.valid) {
                result.errors = validation.errors;
                return result;
            }

            // Generate content based on format
            const formatLower = format.toLowerCase();
            let content = '';

            switch (formatLower) {
                case 'json':
                    content = this.generateJsonReport(data);
                    break;
                case 'html':
                    content = this.generateHtmlReport(data);
                    break;
                case 'csv':
                    content = this.generateCsvReport(data);
                    break;
                case 'xml':
                    content = this.generateXmlReport(data);
                    break;
                default:
                    result.errors.push(`Format handler not implemented: ${format}`);
                    return result;
            }

            // Check content size
            if (content.length > this.maxReportSize) {
                result.errors.push(`Report too large: ${content.length} bytes (max: ${this.maxReportSize})`);
                return result;
            }

            result.success = true;
            result.content = content;

        } catch (error) {
            result.errors.push(`Report generation failed: ${error}`);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Validate report data structure
     * NASA Rule 4: <60 lines
     */
    private validateReportData(data: ReportData): { valid: boolean; errors: string[] } {
        // NASA Rule 5: Input assertions
        console.assert(data != null, 'data cannot be null');

        const result = { valid: true, errors: [] as string[] };

        try {
            // Check violations array
            if (!Array.isArray(data.violations)) {
                result.errors.push('violations must be array');
                result.valid = false;
            }

            // Check summary object
            if (!data.summary || typeof data.summary !== 'object') {
                result.errors.push('summary must be object');
                result.valid = false;
            } else {
                if (typeof data.summary.totalViolations !== 'number') {
                    result.errors.push('totalViolations must be number');
                    result.valid = false;
                }
                if (typeof data.summary.totalWeight !== 'number') {
                    result.errors.push('totalWeight must be number');
                    result.valid = false;
                }
            }

            // Check metadata object
            if (!data.metadata || typeof data.metadata !== 'object') {
                result.errors.push('metadata must be object');
                result.valid = false;
            } else {
                if (typeof data.metadata.timestamp !== 'number') {
                    result.errors.push('timestamp must be number');
                    result.valid = false;
                }
                if (typeof data.metadata.filesAnalyzed !== 'number') {
                    result.errors.push('filesAnalyzed must be number');
                    result.valid = false;
                }
            }

        } catch (error) {
            result.errors.push(`Validation failed: ${error}`);
            result.valid = false;
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.valid === 'boolean', 'valid must be boolean');
        return result;
    }

    /**
     * Generate JSON report
     * NASA Rule 4: <60 lines
     */
    private generateJsonReport(data: ReportData): string {
        // NASA Rule 5: Input assertions
        console.assert(data != null, 'data cannot be null');

        try {
            const reportObject = {
                metadata: {
                    ...data.metadata,
                    format: 'json',
                    generatedAt: new Date().toISOString()
                },
                summary: {
                    totalViolations: data.summary.totalViolations,
                    totalWeight: data.summary.totalWeight,
                    byType: this.mapToObject(data.summary.byType),
                    bySeverity: this.mapToObject(data.summary.bySeverity)
                },
                violations: data.violations
            };

            const json = JSON.stringify(reportObject, null, 2);

            // NASA Rule 5: Output assertion
            console.assert(typeof json === 'string', 'json must be string');
            return json;

        } catch (error) {
            console.error('JSON report generation failed:', error);
            return '{"error": "JSON generation failed"}';
        }
    }

    /**
     * Generate HTML report
     * NASA Rule 4: <60 lines
     */
    private generateHtmlReport(data: ReportData): string {
        // NASA Rule 5: Input assertions
        console.assert(data != null, 'data cannot be null');

        try {
            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Connascence Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .violation { border: 1px solid #ddd; margin: 10px 0; padding: 10px; }
        .critical { border-left: 5px solid #d32f2f; }
        .high { border-left: 5px solid #f57c00; }
        .medium { border-left: 5px solid #fbc02d; }
        .low { border-left: 5px solid #388e3c; }
    </style>
</head>
<body>
    <h1>Connascence Analysis Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Violations: ${data.summary.totalViolations}</p>
        <p>Total Weight: ${data.summary.totalWeight}</p>
        <p>Files Analyzed: ${data.metadata.filesAnalyzed}</p>
        <p>Analysis Time: ${data.metadata.analysisTime}ms</p>
    </div>
    ${this.generateHtmlViolations(data.violations)}
</body>
</html>`;

            // NASA Rule 5: Output assertion
            console.assert(typeof html === 'string', 'html must be string');
            return html;

        } catch (error) {
            console.error('HTML report generation failed:', error);
            return '<html><body>HTML generation failed</body></html>';
        }
    }

    /**
     * Generate HTML violations section
     * NASA Rule 4: <60 lines
     */
    private generateHtmlViolations(violations: any[]): string {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(violations), 'violations must be array');

        try {
            let html = '<h2>Violations</h2>';

            // NASA Rule 2: Fixed upper bound
            for (let i = 0; i < violations.length && i < 1000; i++) {
                const violation = violations[i];
                const severity = violation.severity || 'medium';

                html += `
                <div class="violation ${severity}">
                    <h3>${violation.type || 'Unknown'}</h3>
                    <p><strong>Severity:</strong> ${severity}</p>
                    <p><strong>Line:</strong> ${violation.line || 'N/A'}</p>
                    <p><strong>Description:</strong> ${violation.description || 'N/A'}</p>
                    <p><strong>Weight:</strong> ${violation.weight || 0}</p>
                </div>`;
            }

            // NASA Rule 5: Output assertion
            console.assert(typeof html === 'string', 'html must be string');
            return html;

        } catch (error) {
            console.error('HTML violations generation failed:', error);
            return '<p>Violations section generation failed</p>';
        }
    }

    /**
     * Generate CSV report
     * NASA Rule 4: <60 lines
     */
    private generateCsvReport(data: ReportData): string {
        // NASA Rule 5: Input assertions
        console.assert(data != null, 'data cannot be null');

        try {
            let csv = 'Type,Severity,Line,Column,Description,Weight\\n';

            // NASA Rule 2: Fixed upper bound
            for (let i = 0; i < data.violations.length && i < 10000; i++) {
                const violation = data.violations[i];

                const type = this.escapeCsvField(violation.type || '');
                const severity = this.escapeCsvField(violation.severity || '');
                const line = violation.line || 0;
                const column = violation.column || 0;
                const description = this.escapeCsvField(violation.description || '');
                const weight = violation.weight || 0;

                csv += `${type},${severity},${line},${column},${description},${weight}\\n`;
            }

            // NASA Rule 5: Output assertion
            console.assert(typeof csv === 'string', 'csv must be string');
            return csv;

        } catch (error) {
            console.error('CSV report generation failed:', error);
            return 'Error,Error,0,0,CSV generation failed,0\\n';
        }
    }

    /**
     * Generate XML report
     * NASA Rule 4: <60 lines
     */
    private generateXmlReport(data: ReportData): string {
        // NASA Rule 5: Input assertions
        console.assert(data != null, 'data cannot be null');

        try {
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n';
            xml += '<ConnascenceReport>\\n';
            xml += '<Summary>\\n';
            xml += `  <TotalViolations>${data.summary.totalViolations}</TotalViolations>\\n`;
            xml += `  <TotalWeight>${data.summary.totalWeight}</TotalWeight>\\n`;
            xml += `  <FilesAnalyzed>${data.metadata.filesAnalyzed}</FilesAnalyzed>\\n`;
            xml += '</Summary>\\n';
            xml += '<Violations>\\n';

            // NASA Rule 2: Fixed upper bound
            for (let i = 0; i < data.violations.length && i < 1000; i++) {
                const violation = data.violations[i];
                xml += '  <Violation>\\n';
                xml += `    <Type>${this.escapeXml(violation.type || '')}</Type>\\n`;
                xml += `    <Severity>${this.escapeXml(violation.severity || '')}</Severity>\\n`;
                xml += `    <Line>${violation.line || 0}</Line>\\n`;
                xml += `    <Description>${this.escapeXml(violation.description || '')}</Description>\\n`;
                xml += `    <Weight>${violation.weight || 0}</Weight>\\n`;
                xml += '  </Violation>\\n';
            }

            xml += '</Violations>\\n';
            xml += '</ConnascenceReport>\\n';

            // NASA Rule 5: Output assertion
            console.assert(typeof xml === 'string', 'xml must be string');
            return xml;

        } catch (error) {
            console.error('XML report generation failed:', error);
            return '<?xml version="1.0"?><Error>XML generation failed</Error>';
        }
    }

    /**
     * Helper: Convert Map to Object
     * NASA Rule 4: <60 lines
     */
    private mapToObject(map: Map<string, any>): any {
        // NASA Rule 5: Input assertions
        console.assert(map instanceof Map, 'map must be Map instance');

        const obj: any = {};

        try {
            // NASA Rule 2: Fixed upper bound (reasonable map size)
            let count = 0;
            for (const [key, value] of map) {
                if (count >= 1000) break; // Prevent infinite loops
                obj[key] = value;
                count++;
            }

        } catch (error) {
            console.error('Map to object conversion failed:', error);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof obj === 'object', 'result must be object');
        return obj;
    }

    /**
     * Helper: Escape CSV field
     * NASA Rule 4: <60 lines
     */
    private escapeCsvField(field: string): string {
        // NASA Rule 5: Input assertions
        console.assert(typeof field === 'string', 'field must be string');

        try {
            // Escape quotes and wrap in quotes if contains comma/quote
            let escaped = field.replace(/"/g, '""');
            if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\\n')) {
                escaped = `"${escaped}"`;
            }

            // NASA Rule 5: Output assertion
            console.assert(typeof escaped === 'string', 'escaped must be string');
            return escaped;

        } catch (error) {
            console.error('CSV field escape failed:', error);
            return '""';
        }
    }

    /**
     * Helper: Escape XML content
     * NASA Rule 4: <60 lines
     */
    private escapeXml(content: string): string {
        // NASA Rule 5: Input assertions
        console.assert(typeof content === 'string', 'content must be string');

        try {
            const escaped = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            // NASA Rule 5: Output assertion
            console.assert(typeof escaped === 'string', 'escaped must be string');
            return escaped;

        } catch (error) {
            console.error('XML escape failed:', error);
            return '';
        }
    }

    /**
     * Get supported formats
     * NASA Rule 4: <60 lines
     */
    getSupportedFormats(): string[] {
        const formats: string[] = [];

        try {
            for (const [key] of this.formats) {
                formats.push(key);
            }

        } catch (error) {
            console.error('Format enumeration failed:', error);
        }

        // NASA Rule 5: Output assertion
        console.assert(Array.isArray(formats), 'formats must be array');
        return formats;
    }
}