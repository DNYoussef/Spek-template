/**
 * ResultAggregator - NASA POT10 Compliant
 *
 * Result aggregation methods extracted from UnifiedConnascenceAnalyzer
 * Following NASA Rule 4: Functions <60 lines
 * Following NASA Rule 5: 2+ assertions per function
 * Following NASA Rule 6: Minimal scope
 */

interface ViolationSummary {
    type: string;
    count: number;
    totalWeight: number;
    avgWeight: number;
    severity: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
}

interface AggregatedResult {
    success: boolean;
    violations: any[];
    summary: {
        totalViolations: number;
        totalWeight: number;
        byType: Map<string, ViolationSummary>;
        bySeverity: Map<string, number>;
    };
    errors: string[];
}

export class ResultAggregator {
    private readonly maxViolations = 10000; // NASA Rule 2: Fixed bound

    constructor() {
        // NASA Rule 5: State assertions
        console.assert(this.maxViolations > 0, 'maxViolations must be positive');
    }

    /**
     * Aggregate all analysis results
     * NASA Rule 4: <60 lines
     */
    aggregateResults(violations: any[]): AggregatedResult {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(violations), 'violations must be array');

        const result: AggregatedResult = {
            success: false,
            violations: [],
            summary: {
                totalViolations: 0,
                totalWeight: 0,
                byType: new Map(),
                bySeverity: new Map()
            },
            errors: []
        };

        try {
            // Validate input size
            if (violations.length > this.maxViolations) {
                result.errors.push(`Too many violations: ${violations.length} (max: ${this.maxViolations})`);
                return result;
            }

            // Filter and validate violations
            const validViolations = this.filterValidViolations(violations);
            if (validViolations.errors.length > 0) {
                result.errors = validViolations.errors;
            }

            // Generate type summary
            const typeSummary = this.generateTypeSummary(validViolations.violations);
            if (!typeSummary.success) {
                result.errors.push('Type summary generation failed');
                return result;
            }

            // Generate severity summary
            const severitySummary = this.generateSeveritySummary(validViolations.violations);
            if (!severitySummary.success) {
                result.errors.push('Severity summary generation failed');
                return result;
            }

            // Build final result
            result.violations = validViolations.violations;
            result.summary.totalViolations = validViolations.violations.length;
            result.summary.totalWeight = this.calculateTotalWeight(validViolations.violations);
            result.summary.byType = typeSummary.summary;
            result.summary.bySeverity = severitySummary.summary;
            result.success = true;

        } catch (error) {
            result.errors.push(`Aggregation failed: ${error}`);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Filter and validate violations
     * NASA Rule 4: <60 lines
     */
    private filterValidViolations(violations: any[]): { violations: any[]; errors: string[] } {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(violations), 'violations must be array');

        const result = { violations: [] as any[], errors: [] as string[] };
        let validCount = 0;

        // NASA Rule 2: Fixed upper bound
        for (let i = 0; i < violations.length && i < this.maxViolations; i++) {
            const violation = violations[i];

            // Validate violation structure
            if (!this.isValidViolation(violation)) {
                result.errors.push(`Invalid violation at index ${i}`);
                continue;
            }

            result.violations.push(violation);
            validCount++;
        }

        // NASA Rule 5: Output assertions
        console.assert(Array.isArray(result.violations), 'violations must be array');
        console.assert(validCount >= 0, 'validCount must be non-negative');
        return result;
    }

    /**
     * Validate individual violation
     * NASA Rule 4: <60 lines
     */
    private isValidViolation(violation: any): boolean {
        // NASA Rule 5: Input assertion
        console.assert(violation != null, 'violation cannot be null');

        try {
            // Check required fields
            const hasType = typeof violation.type === 'string' && violation.type.length > 0;
            const hasSeverity = typeof violation.severity === 'string';
            const hasLine = typeof violation.line === 'number' && violation.line >= 0;
            const hasWeight = typeof violation.weight === 'number' && violation.weight >= 0;

            const isValid = hasType && hasSeverity && hasLine && hasWeight;

            // NASA Rule 5: Output assertion
            console.assert(typeof isValid === 'boolean', 'result must be boolean');
            return isValid;

        } catch (error) {
            console.error('Violation validation error:', error);
            return false;
        }
    }

    /**
     * Generate summary by violation type
     * NASA Rule 4: <60 lines
     */
    private generateTypeSummary(violations: any[]): { success: boolean; summary: Map<string, ViolationSummary> } {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(violations), 'violations must be array');

        const result = { success: false, summary: new Map<string, ViolationSummary>() };

        try {
            // NASA Rule 2: Fixed upper bound
            for (let i = 0; i < violations.length && i < this.maxViolations; i++) {
                const violation = violations[i];
                const type = violation.type;

                if (!result.summary.has(type)) {
                    result.summary.set(type, {
                        type,
                        count: 0,
                        totalWeight: 0,
                        avgWeight: 0,
                        severity: { low: 0, medium: 0, high: 0, critical: 0 }
                    });
                }

                const summary = result.summary.get(type)!;
                summary.count++;
                summary.totalWeight += violation.weight;
                summary.avgWeight = summary.totalWeight / summary.count;

                // Count by severity
                if (violation.severity in summary.severity) {
                    summary.severity[violation.severity as keyof typeof summary.severity]++;
                }
            }

            result.success = true;

        } catch (error) {
            console.error('Type summary generation failed:', error);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Generate summary by severity
     * NASA Rule 4: <60 lines
     */
    private generateSeveritySummary(violations: any[]): { success: boolean; summary: Map<string, number> } {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(violations), 'violations must be array');

        const result = { success: false, summary: new Map<string, number>() };

        try {
            // Initialize severity counts
            const severities = ['low', 'medium', 'high', 'critical'];
            for (const severity of severities) {
                result.summary.set(severity, 0);
            }

            // NASA Rule 2: Fixed upper bound
            for (let i = 0; i < violations.length && i < this.maxViolations; i++) {
                const violation = violations[i];
                const severity = violation.severity;

                if (result.summary.has(severity)) {
                    const currentCount = result.summary.get(severity) || 0;
                    result.summary.set(severity, currentCount + 1);
                }
            }

            result.success = true;

        } catch (error) {
            console.error('Severity summary generation failed:', error);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Calculate total weight of violations
     * NASA Rule 4: <60 lines
     */
    private calculateTotalWeight(violations: any[]): number {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(violations), 'violations must be array');

        let totalWeight = 0;

        try {
            // NASA Rule 2: Fixed upper bound
            for (let i = 0; i < violations.length && i < this.maxViolations; i++) {
                const violation = violations[i];

                if (typeof violation.weight === 'number' && violation.weight >= 0) {
                    totalWeight += violation.weight;
                }
            }

        } catch (error) {
            console.error('Weight calculation failed:', error);
            totalWeight = 0;
        }

        // NASA Rule 5: Output assertion
        console.assert(totalWeight >= 0, 'totalWeight must be non-negative');
        return totalWeight;
    }

    /**
     * Sort violations by priority
     * NASA Rule 4: <60 lines
     */
    sortByPriority(violations: any[]): { success: boolean; sorted: any[]; errors: string[] } {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(violations), 'violations must be array');

        const result = { success: false, sorted: [] as any[], errors: [] as string[] };

        try {
            // Validate input size
            if (violations.length > this.maxViolations) {
                result.errors.push(`Too many violations to sort: ${violations.length}`);
                return result;
            }

            // Create priority map
            const priorityMap = new Map([
                ['critical', 4],
                ['high', 3],
                ['medium', 2],
                ['low', 1]
            ]);

            // Sort by severity then weight
            result.sorted = [...violations].sort((a, b) => {
                const priorityA = priorityMap.get(a.severity) || 0;
                const priorityB = priorityMap.get(b.severity) || 0;

                if (priorityA !== priorityB) {
                    return priorityB - priorityA; // Higher priority first
                }

                return (b.weight || 0) - (a.weight || 0); // Higher weight first
            });

            result.success = true;

        } catch (error) {
            result.errors.push(`Sorting failed: ${error}`);
        }

        // NASA Rule 5: Output assertion
        console.assert(typeof result.success === 'boolean', 'success must be boolean');
        return result;
    }

    /**
     * Generate quality score
     * NASA Rule 4: <60 lines
     */
    calculateQualityScore(violations: any[]): { score: number; grade: string } {
        // NASA Rule 5: Input assertions
        console.assert(Array.isArray(violations), 'violations must be array');

        let score = 100; // Start with perfect score
        const totalWeight = this.calculateTotalWeight(violations);

        try {
            // Deduct points based on violations
            score = Math.max(0, score - (totalWeight * 0.1));

            // Determine grade
            let grade = 'F';
            if (score >= 95) grade = 'A+';
            else if (score >= 90) grade = 'A';
            else if (score >= 85) grade = 'B+';
            else if (score >= 80) grade = 'B';
            else if (score >= 75) grade = 'C+';
            else if (score >= 70) grade = 'C';
            else if (score >= 65) grade = 'D';

            // NASA Rule 5: Output assertions
            console.assert(score >= 0 && score <= 100, 'score must be 0-100');
            console.assert(typeof grade === 'string', 'grade must be string');
            return { score, grade };

        } catch (error) {
            console.error('Quality score calculation failed:', error);
            return { score: 0, grade: 'F' };
        }
    }
}