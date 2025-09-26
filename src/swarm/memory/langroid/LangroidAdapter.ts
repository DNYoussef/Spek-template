/**
 * Langroid Adapter for SPEK Integration
 * Aligns with actual Langroid architecture from 2025 research
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { PrincessDomain } from '../hierarchy/types';

export interface LangroidAgentConfig {
  name: string;
  systemMessage: string;
  llmProvider: 'openai' | 'anthropic' | 'gemini';
  vectorStore: VectorStoreConfig;
  tools: string[];
  maxTokens?: number;
}

export interface VectorStoreConfig {
  type: 'lancedb' | 'chroma' | 'qdrant';
  collectionName: string;
  storagePath: string;
  embeddingProvider: 'openai' | 'huggingface';
  maxMemoryMB: number;
}

export interface MessageTransformer {
  llmResponse(message: string): Promise<string>;
  agentResponse(message: string): Promise<string>;
  userResponse(message: string): Promise<string>;
}

export interface LangroidTask {
  name: string;
  agent: LangroidAgentConfig;
  instructions: string;
  subTasks?: LangroidTask[];
  parentTask?: string;
}

export class LangroidAdapter extends EventEmitter {
  private logger: Logger;
  private agents: Map<string, LangroidAgentConfig>;
  private tasks: Map<string, LangroidTask>;
  private vectorStores: Map<string, VectorStoreConfig>;

  constructor() {
    super();
    this.logger = new Logger('LangroidAdapter');
    this.agents = new Map();
    this.tasks = new Map();
    this.vectorStores = new Map();
  }

  /**
   * Create Langroid agent with isolated vector memory
   * Based on real Langroid architecture: Agent = LLM + Vector Store + Tools
   */
  createAgent(
    agentId: string,
    domain: PrincessDomain,
    config: Partial<LangroidAgentConfig>
  ): LangroidAgentConfig {
    const vectorStoreConfig: VectorStoreConfig = {
      type: 'lancedb', // Default as per Langroid research
      collectionName: `${domain.toLowerCase()}_${agentId}`,
      storagePath: `./vector_stores/${domain.toLowerCase()}/${agentId}`,
      embeddingProvider: 'openai',
      maxMemoryMB: 10, // 10MB limit per Princess
      ...config.vectorStore
    };

    const agentConfig: LangroidAgentConfig = {
      name: config.name || `${domain}Agent`,
      systemMessage: config.systemMessage || this.getDefaultSystemMessage(domain),
      llmProvider: config.llmProvider || 'openai',
      vectorStore: vectorStoreConfig,
      tools: config.tools || this.getDefaultTools(domain),
      maxTokens: config.maxTokens || 4000,
      ...config
    };

    this.agents.set(agentId, agentConfig);
    this.vectorStores.set(agentId, vectorStoreConfig);

    this.logger.info(`Created Langroid agent ${agentId} for ${domain} with isolated vector memory`);
    this.emit('agent-created', { agentId, domain, config: agentConfig });

    return agentConfig;
  }

  /**
   * Create Langroid task wrapping agent
   * Tasks orchestrate agent execution and delegation
   */
  createTask(
    taskId: string,
    agentId: string,
    instructions: string,
    parentTaskId?: string
  ): LangroidTask {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const task: LangroidTask = {
      name: taskId,
      agent,
      instructions,
      subTasks: [],
      parentTask: parentTaskId
    };

    this.tasks.set(taskId, task);

    // Add as subtask if parent exists
    if (parentTaskId) {
      const parentTask = this.tasks.get(parentTaskId);
      if (parentTask) {
        parentTask.subTasks = parentTask.subTasks || [];
        parentTask.subTasks.push(task);
      }
    }

    this.logger.info(`Created Langroid task ${taskId} with agent ${agentId}`);
    this.emit('task-created', { taskId, agentId, instructions });

    return task;
  }

  /**
   * Execute task with Langroid pattern
   * Simulates actual Langroid task execution
   */
  async executeTask(taskId: string, message: string): Promise<string> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    this.logger.info(`Executing Langroid task ${taskId}: ${message}`);

    try {
      // Simulate Langroid's 3 responder pattern
      const messageTransformer = this.createMessageTransformer(task.agent);

      // Try LLM responder first
      let response = await messageTransformer.llmResponse(message);

      // If LLM can't handle, try agent responder (tools)
      if (!response || response.includes('I cannot')) {
        response = await messageTransformer.agentResponse(message);
      }

      // Store interaction in vector memory
      await this.storeInVectorMemory(task.agent.name, message, response);

      // Handle subtask delegation if needed
      if (task.subTasks && task.subTasks.length > 0) {
        const subResults = await this.delegateToSubTasks(task.subTasks, message);
        response += `\n\nSubtask results:\n${subResults.join('\n')}`;
      }

      this.emit('task-completed', { taskId, message, response });
      return response;

    } catch (error) {
      this.logger.error(`Task execution failed for ${taskId}:`, error);
      this.emit('task-failed', { taskId, error });
      throw error;
    }
  }

  /**
   * Create message transformer implementing Langroid's responder pattern
   */
  private createMessageTransformer(agent: LangroidAgentConfig): MessageTransformer {
    return {
      async llmResponse(message: string): Promise<string> {
        // Simulate LLM call with system message and vector context
        const context = await this.getVectorContext(agent.name, message);
        const prompt = `${agent.systemMessage}\n\nContext: ${context}\n\nUser: ${message}`;

        // Simulate LLM processing
        return `LLM Response from ${agent.name}: Processed "${message}" with context`;
      },

      async agentResponse(message: string): Promise<string> {
        // Handle tool calls and function execution
        if (message.includes('tool:') || message.includes('function:')) {
          return `Tool executed by ${agent.name}: ${message}`;
        }
        return '';
      },

      async userResponse(message: string): Promise<string> {
        // Human-in-the-loop placeholder
        return `User interaction needed for ${agent.name}: ${message}`;
      }
    };
  }

  /**
   * Store interaction in agent's vector memory
   */
  private async storeInVectorMemory(
    agentName: string,
    input: string,
    output: string
  ): Promise<void> {
    const interaction = `Input: ${input}\nOutput: ${output}`;

    // Simulate vector embedding and storage
    this.logger.debug(`Storing in ${agentName} vector memory: ${interaction.substring(0, 100)}...`);

    // In real implementation, this would:
    // 1. Generate embedding for interaction
    // 2. Store in LanceDB collection
    // 3. Manage memory size limits
  }

  /**
   * Get relevant context from vector memory
   */
  private async getVectorContext(agentName: string, query: string): Promise<string> {
    // Simulate vector similarity search
    return `Relevant context for ${agentName} query: "${query}"`;
  }

  /**
   * Delegate to sub-tasks (Langroid hierarchical pattern)
   */
  private async delegateToSubTasks(subTasks: LangroidTask[], message: string): Promise<string[]> {
    const results: string[] = [];

    for (const subTask of subTasks) {
      try {
        const result = await this.executeTask(subTask.name, message);
        results.push(`${subTask.name}: ${result}`);
      } catch (error) {
        results.push(`${subTask.name}: Error - ${error}`);
      }
    }

    return results;
  }

  /**
   * Get default system message for domain
   */
  private getDefaultSystemMessage(domain: PrincessDomain): string {
    const messages = {
      [PrincessDomain.DEVELOPMENT]: 'You are a development specialist. Transform code requests into working implementations.',
      [PrincessDomain.QUALITY]: 'You are a quality assurance specialist. Transform quality requests into test strategies and validations.',
      [PrincessDomain.INFRASTRUCTURE]: 'You are an infrastructure specialist. Transform deployment requests into configuration solutions.',
      [PrincessDomain.RESEARCH]: 'You are a research specialist. Transform research requests into comprehensive analyses.',
      [PrincessDomain.DEPLOYMENT]: 'You are a deployment specialist. Transform deployment requests into release strategies.',
      [PrincessDomain.SECURITY]: 'You are a security specialist. Transform security requests into compliance solutions.'
    };

    return messages[domain];
  }

  /**
   * Get default tools for domain
   */
  private getDefaultTools(domain: PrincessDomain): string[] {
    const tools = {
      [PrincessDomain.DEVELOPMENT]: ['code_editor', 'compiler', 'debugger', 'git'],
      [PrincessDomain.QUALITY]: ['test_runner', 'coverage_analyzer', 'lint_checker', 'theater_detector'],
      [PrincessDomain.INFRASTRUCTURE]: ['docker', 'kubernetes', 'terraform', 'ansible'],
      [PrincessDomain.RESEARCH]: ['web_search', 'document_analyzer', 'citation_manager'],
      [PrincessDomain.DEPLOYMENT]: ['ci_cd', 'monitoring', 'rollback', 'health_checker'],
      [PrincessDomain.SECURITY]: ['vulnerability_scanner', 'audit_tools', 'compliance_checker']
    };

    return tools[domain];
  }

  /**
   * Get agent configuration
   */
  getAgent(agentId: string): LangroidAgentConfig | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get task configuration
   */
  getTask(taskId: string): LangroidTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get vector store statistics
   */
  getVectorStoreStats(agentId: string): any {
    const vectorStore = this.vectorStores.get(agentId);
    if (!vectorStore) {
      return null;
    }

    return {
      type: vectorStore.type,
      collection: vectorStore.collectionName,
      maxMemory: `${vectorStore.maxMemoryMB}MB`,
      path: vectorStore.storagePath,
      embeddingProvider: vectorStore.embeddingProvider
    };
  }

  /**
   * List all active agents
   */
  listAgents(): { agentId: string; domain: string; memoryMB: number }[] {
    const agents: { agentId: string; domain: string; memoryMB: number }[] = [];

    this.agents.forEach((config, agentId) => {
      const vectorStore = this.vectorStores.get(agentId);
      agents.push({
        agentId,
        domain: config.name.replace('Agent', ''),
        memoryMB: vectorStore?.maxMemoryMB || 0
      });
    });

    return agents;
  }

  /**
   * Cleanup agent and vector store
   */
  removeAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.vectorStores.delete(agentId);

    // Remove associated tasks
    const tasksToRemove: string[] = [];
    this.tasks.forEach((task, taskId) => {
      if (task.agent.name.includes(agentId)) {
        tasksToRemove.push(taskId);
      }
    });

    tasksToRemove.forEach(taskId => {
      this.tasks.delete(taskId);
    });

    this.logger.info(`Removed Langroid agent ${agentId} and associated resources`);
  }

  /**
   * Get adapter statistics
   */
  getStats(): any {
    return {
      totalAgents: this.agents.size,
      totalTasks: this.tasks.size,
      totalVectorStores: this.vectorStores.size,
      memoryUsage: Array.from(this.vectorStores.values())
        .reduce((sum, vs) => sum + vs.maxMemoryMB, 0)
    };
  }
}

export default LangroidAdapter;