// Universal Range FSM Template
// Adaptable to any file size range for god object elimination

export interface UniversalRangeState {
    name: 'initial' | 'analyzing' | 'decomposing' | 'validating' | 'completed' | 'error';
    type: 'processing' | 'validation' | 'completion' | 'error';
    data?: any;
    range?: string;
    originalLines?: number;
    targetComponents?: number;
}

export enum UniversalRangeEvents {
    START = 'START',
    ANALYZE = 'ANALYZE',
    DECOMPOSE = 'DECOMPOSE',
    VALIDATE = 'VALIDATE',
    COMPLETE = 'COMPLETE',
    ERROR = 'ERROR',
    RESET = 'RESET'
}

export interface RangeConfig {
    minLines: number;
    maxLines: number;
    rangeName: string;
    targetComponents: number;
    priorityWeights: {
        complexity: number;
        size: number;
        pattern: number;
    };
}

export class UniversalRangeFSM {
    private currentState: UniversalRangeState;
    private config: RangeConfig;
    private transitions: Map<string, Map<UniversalRangeEvents, string>>;

    constructor(config: RangeConfig) {
        this.config = config;
        this.currentState = {
            name: 'initial',
            type: 'processing',
            range: config.rangeName
        };
        this.initializeTransitions();
    }

    private initializeTransitions(): void {
        this.transitions = new Map([
            ['initial', new Map([
                [UniversalRangeEvents.START, 'analyzing']
            ])],
            ['analyzing', new Map([
                [UniversalRangeEvents.ANALYZE, 'analyzing'],
                [UniversalRangeEvents.DECOMPOSE, 'decomposing'],
                [UniversalRangeEvents.ERROR, 'error']
            ])],
            ['decomposing', new Map([
                [UniversalRangeEvents.VALIDATE, 'validating'],
                [UniversalRangeEvents.ERROR, 'error']
            ])],
            ['validating', new Map([
                [UniversalRangeEvents.COMPLETE, 'completed'],
                [UniversalRangeEvents.ERROR, 'error']
            ])],
            ['error', new Map([
                [UniversalRangeEvents.RESET, 'initial']
            ])],
            ['completed', new Map([
                [UniversalRangeEvents.RESET, 'initial']
            ])]
        ]);
    }

    transition(event: UniversalRangeEvents, data?: any): boolean {
        const currentTransitions = this.transitions.get(this.currentState.name);

        if (!currentTransitions || !currentTransitions.has(event)) {
            console.warn(`Invalid transition: ${this.currentState.name} + ${event}`);
            return false;
        }

        const nextStateName = currentTransitions.get(event) as any;

        this.currentState = {
            name: nextStateName,
            type: this.getStateType(nextStateName),
            data,
            range: this.config.rangeName,
            originalLines: this.currentState.originalLines,
            targetComponents: this.config.targetComponents
        };

        return true;
    }

    private getStateType(stateName: string): UniversalRangeState['type'] {
        switch (stateName) {
            case 'analyzing':
            case 'decomposing':
                return 'processing';
            case 'validating':
                return 'validation';
            case 'completed':
                return 'completion';
            case 'error':
                return 'error';
            default:
                return 'processing';
        }
    }

    getCurrentState(): UniversalRangeState {
        return { ...this.currentState };
    }

    isInState(stateName: string): boolean {
        return this.currentState.name === stateName;
    }

    canTransition(event: UniversalRangeEvents): boolean {
        const currentTransitions = this.transitions.get(this.currentState.name);
        return currentTransitions ? currentTransitions.has(event) : false;
    }

    getConfig(): RangeConfig {
        return { ...this.config };
    }

    // State-specific behavior methods
    onAnalyzing(): void {
        // Override in specific implementations
    }

    onDecomposing(): void {
        // Override in specific implementations
    }

    onValidating(): void {
        // Override in specific implementations
    }

    onCompleted(): void {
        // Override in specific implementations
    }

    onError(): void {
        // Override in specific implementations
    }
}

export abstract class RangeEliminatorBase {
    protected fsm: UniversalRangeFSM;
    protected eliminatedCount: number = 0;
    protected errors: string[] = [];

    constructor(config: RangeConfig) {
        this.fsm = new UniversalRangeFSM(config);
    }

    abstract analyzeFiles(): Promise<any[]>;
    abstract decomposeFile(fileInfo: any): Promise<boolean>;
    abstract validateDecomposition(fileInfo: any): Promise<boolean>;

    async eliminateRange(): Promise<{
        success: boolean;
        eliminatedCount: number;
        errors: string[];
        finalState: UniversalRangeState;
    }> {
        try {
            // Start the process
            if (!this.fsm.transition(UniversalRangeEvents.START)) {
                throw new Error('Failed to start elimination process');
            }

            // Analyze phase
            const files = await this.analyzeFiles();
            if (!this.fsm.transition(UniversalRangeEvents.ANALYZE, { files })) {
                throw new Error('Failed to transition to analysis');
            }

            // Decompose phase
            for (const fileInfo of files) {
                if (!this.fsm.transition(UniversalRangeEvents.DECOMPOSE, fileInfo)) {
                    continue;
                }

                const decomposed = await this.decomposeFile(fileInfo);
                if (decomposed) {
                    this.eliminatedCount++;
                } else {
                    this.errors.push(`Failed to decompose ${fileInfo.path}`);
                }
            }

            // Validation phase
            if (!this.fsm.transition(UniversalRangeEvents.VALIDATE)) {
                throw new Error('Failed to transition to validation');
            }

            // Complete
            if (!this.fsm.transition(UniversalRangeEvents.COMPLETE)) {
                throw new Error('Failed to complete process');
            }

            return {
                success: true,
                eliminatedCount: this.eliminatedCount,
                errors: this.errors,
                finalState: this.fsm.getCurrentState()
            };

        } catch (error) {
            this.fsm.transition(UniversalRangeEvents.ERROR, { error });
            this.errors.push(error instanceof Error ? error.message : String(error));

            return {
                success: false,
                eliminatedCount: this.eliminatedCount,
                errors: this.errors,
                finalState: this.fsm.getCurrentState()
            };
        }
    }

    getStatus(): {
        currentState: UniversalRangeState;
        eliminatedCount: number;
        errors: string[];
        config: RangeConfig;
    } {
        return {
            currentState: this.fsm.getCurrentState(),
            eliminatedCount: this.eliminatedCount,
            errors: [...this.errors],
            config: this.fsm.getConfig()
        };
    }
}

// Specific Range Eliminators
export class Range800_899Eliminator extends RangeEliminatorBase {
    constructor() {
        super({
            minLines: 800,
            maxLines: 899,
            rangeName: '800-899',
            targetComponents: 4,
            priorityWeights: {
                complexity: 0.4,
                size: 0.3,
                pattern: 0.3
            }
        });
    }

    async analyzeFiles(): Promise<any[]> {
        // Implementation for 800-899 range
        return [];
    }

    async decomposeFile(fileInfo: any): Promise<boolean> {
        // Implementation for 800-899 range
        return true;
    }

    async validateDecomposition(fileInfo: any): Promise<boolean> {
        // Implementation for 800-899 range
        return true;
    }
}

export class Range700_799Eliminator extends RangeEliminatorBase {
    constructor() {
        super({
            minLines: 700,
            maxLines: 799,
            rangeName: '700-799',
            targetComponents: 4,
            priorityWeights: {
                complexity: 0.35,
                size: 0.35,
                pattern: 0.3
            }
        });
    }

    async analyzeFiles(): Promise<any[]> {
        return [];
    }

    async decomposeFile(fileInfo: any): Promise<boolean> {
        return true;
    }

    async validateDecomposition(fileInfo: any): Promise<boolean> {
        return true;
    }
}

export class Range600_699Eliminator extends RangeEliminatorBase {
    constructor() {
        super({
            minLines: 600,
            maxLines: 699,
            rangeName: '600-699',
            targetComponents: 3,
            priorityWeights: {
                complexity: 0.3,
                size: 0.4,
                pattern: 0.3
            }
        });
    }

    async analyzeFiles(): Promise<any[]> {
        return [];
    }

    async decomposeFile(fileInfo: any): Promise<boolean> {
        return true;
    }

    async validateDecomposition(fileInfo: any): Promise<boolean> {
        return true;
    }
}

export class Range500_599Eliminator extends RangeEliminatorBase {
    constructor() {
        super({
            minLines: 500,
            maxLines: 599,
            rangeName: '500-599',
            targetComponents: 3,
            priorityWeights: {
                complexity: 0.25,
                size: 0.45,
                pattern: 0.3
            }
        });
    }

    async analyzeFiles(): Promise<any[]> {
        return [];
    }

    async decomposeFile(fileInfo: any): Promise<boolean> {
        return true;
    }

    async validateDecomposition(fileInfo: any): Promise<boolean> {
        return true;
    }
}

// Factory for creating range eliminators
export class RangeEliminatorFactory {
    static createEliminator(rangeName: string): RangeEliminatorBase {
        switch (rangeName) {
            case '800-899':
                return new Range800_899Eliminator();
            case '700-799':
                return new Range700_799Eliminator();
            case '600-699':
                return new Range600_699Eliminator();
            case '500-599':
                return new Range500_599Eliminator();
            default:
                throw new Error(`Unknown range: ${rangeName}`);
        }
    }

    static getAllRanges(): string[] {
        return ['800-899', '700-799', '600-699', '500-599'];
    }
}

// Batch processor for multiple ranges
export class BatchRangeProcessor {
    private eliminators: Map<string, RangeEliminatorBase> = new Map();
    private results: Map<string, any> = new Map();

    constructor(ranges: string[] = RangeEliminatorFactory.getAllRanges()) {
        for (const range of ranges) {
            this.eliminators.set(range, RangeEliminatorFactory.createEliminator(range));
        }
    }

    async processAllRanges(): Promise<{
        totalEliminated: number;
        rangeResults: Map<string, any>;
        overallSuccess: boolean;
        summary: string;
    }> {
        let totalEliminated = 0;
        let overallSuccess = true;

        for (const [rangeName, eliminator] of this.eliminators) {
            console.log(`Processing range ${rangeName}...`);

            const result = await eliminator.eliminateRange();
            this.results.set(rangeName, result);

            totalEliminated += result.eliminatedCount;
            if (!result.success) {
                overallSuccess = false;
            }

            console.log(`Range ${rangeName}: ${result.eliminatedCount} eliminated, ${result.errors.length} errors`);
        }

        const summary = this.generateSummary(totalEliminated, overallSuccess);

        return {
            totalEliminated,
            rangeResults: this.results,
            overallSuccess,
            summary
        };
    }

    private generateSummary(totalEliminated: number, overallSuccess: boolean): string {
        const lines = [
            `# Range-Based Elimination Summary`,
            ``,
            `**Total Eliminated**: ${totalEliminated} files`,
            `**Overall Success**: ${overallSuccess ? 'Yes' : 'No'}`,
            ``,
            `## Range Breakdown:`
        ];

        for (const [rangeName, result] of this.results) {
            lines.push(`- ${rangeName}: ${result.eliminatedCount} eliminated, ${result.errors.length} errors`);
        }

        return lines.join('\n');
    }

    getResults(): Map<string, any> {
        return new Map(this.results);
    }
}