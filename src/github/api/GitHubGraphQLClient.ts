import { Octokit } from '@octokit/rest';
import { Logger } from '../../utils/Logger';
import { GitHubAuthenticationManager } from './GitHubAuthenticationManager';

/**
 * Real GitHub GraphQL Client for Projects v2 API
 * Implements authentic GitHub Projects v2 GraphQL operations
 */

export interface ProjectV2Node {
  id: string;
  number: number;
  title: string;
  url: string;
  shortDescription?: string;
  readme?: string;
  closed: boolean;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  creator?: {
    login: string;
    id: string;
  };
  owner: {
    id: string;
    login: string;
  };
  teams?: {
    totalCount: number;
  };
  items?: {
    totalCount: number;
    nodes: ProjectV2ItemNode[];
  };
  fields?: {
    nodes: ProjectV2FieldNode[];
  };
  views?: {
    nodes: ProjectV2ViewNode[];
  };
}

export interface ProjectV2ItemNode {
  id: string;
  type: 'ISSUE' | 'PULL_REQUEST' | 'DRAFT_ISSUE';
  content?: {
    id: string;
    number: number;
    title: string;
    url: string;
    state: string;
    repository?: {
      name: string;
      owner: {
        login: string;
      };
    };
  };
  fieldValues?: {
    nodes: ProjectV2ItemFieldValueNode[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectV2FieldNode {
  id: string;
  name: string;
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'SINGLE_SELECT' | 'ITERATION';
  options?: {
    id: string;
    name: string;
    color: string;
  }[];
}

export interface ProjectV2ViewNode {
  id: string;
  name: string;
  layout: 'BOARD_LAYOUT' | 'TABLE_LAYOUT';
  number: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectV2ItemFieldValueNode {
  id: string;
  field: {
    id: string;
    name: string;
  };
  value?: string | number;
  text?: string;
  number?: number;
  date?: string;
  singleSelectOption?: {
    id: string;
    name: string;
    color: string;
  };
  iterationId?: string;
}

export interface CreateProjectV2Input {
  ownerId: string;
  title: string;
  shortDescription?: string;
  readme?: string;
}

export interface UpdateProjectV2Input {
  projectId: string;
  title?: string;
  shortDescription?: string;
  readme?: string;
  closed?: boolean;
}

export interface AddProjectV2ItemInput {
  projectId: string;
  contentId: string; // Issue or PR node ID
}

export interface UpdateProjectV2ItemFieldValueInput {
  projectId: string;
  itemId: string;
  fieldId: string;
  value: {
    text?: string;
    number?: number;
    date?: string;
    singleSelectOptionId?: string;
    iterationId?: string;
  };
}

export class GitHubGraphQLClient {
  private logger: Logger;
  private authManager: GitHubAuthenticationManager;
  private octokit?: Octokit;

  constructor(authManager: GitHubAuthenticationManager) {
    this.logger = new Logger('GitHubGraphQLClient');
    this.authManager = authManager;
  }

  /**
   * Initialize GraphQL client with authenticated Octokit
   */
  async initialize(): Promise<void> {
    try {
      this.octokit = this.authManager.getAuthenticatedOctokit();
      this.logger.info('GraphQL client initialized with authentication');
    } catch (error) {
      this.logger.error('Failed to initialize GraphQL client', { error });
      throw error;
    }
  }

  /**
   * Get organization or user projects using real GraphQL API
   */
  async getProjectsV2(ownerLogin: string, first: number = 20): Promise<{ nodes: ProjectV2Node[]; totalCount: number }> {
    this.ensureInitialized();

    const query = `
      query GetProjectsV2($login: String!, $first: Int!) {
        user(login: $login) {
          projectsV2(first: $first) {
            totalCount
            nodes {
              id
              number
              title
              url
              shortDescription
              readme
              closed
              closedAt
              createdAt
              updatedAt
              deletedAt
              creator {
                login
                id
              }
              owner {
                id
                login
              }
              teams(first: 10) {
                totalCount
              }
              items(first: 50) {
                totalCount
                nodes {
                  id
                  type
                  content {
                    ... on Issue {
                      id
                      number
                      title
                      url
                      state
                      repository {
                        name
                        owner {
                          login
                        }
                      }
                    }
                    ... on PullRequest {
                      id
                      number
                      title
                      url
                      state
                      repository {
                        name
                        owner {
                          login
                        }
                      }
                    }
                  }
                  fieldValues(first: 20) {
                    nodes {
                      ... on ProjectV2ItemFieldTextValue {
                        id
                        text
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldNumberValue {
                        id
                        number
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldDateValue {
                        id
                        date
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        id
                        singleSelectOption {
                          id
                          name
                          color
                        }
                        field {
                          ... on ProjectV2SingleSelectField {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                  createdAt
                  updatedAt
                }
              }
              fields(first: 20) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                    dataType
                  }
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    dataType
                    options {
                      id
                      name
                      color
                    }
                  }
                }
              }
              views(first: 10) {
                nodes {
                  id
                  name
                  layout
                  number
                  createdAt
                  updatedAt
                }
              }
            }
          }
        }
        organization(login: $login) {
          projectsV2(first: $first) {
            totalCount
            nodes {
              id
              number
              title
              url
              shortDescription
              readme
              closed
              closedAt
              createdAt
              updatedAt
              deletedAt
              creator {
                login
                id
              }
              owner {
                id
                login
              }
              items(first: 50) {
                totalCount
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.octokit!.graphql(query, {
        login: ownerLogin,
        first
      });

      // Combine user and organization projects
      const userProjects = response.user?.projectsV2 || { nodes: [], totalCount: 0 };
      const orgProjects = response.organization?.projectsV2 || { nodes: [], totalCount: 0 };

      const allProjects = [...userProjects.nodes, ...orgProjects.nodes];
      const totalCount = userProjects.totalCount + orgProjects.totalCount;

      this.logger.info('Retrieved projects via GraphQL', {
        owner: ownerLogin,
        userProjects: userProjects.totalCount,
        orgProjects: orgProjects.totalCount,
        total: totalCount
      });

      return {
        nodes: allProjects,
        totalCount
      };
    } catch (error) {
      this.logger.error('Failed to get projects via GraphQL', { error, owner: ownerLogin });
      throw new Error(`GraphQL query failed: ${error.message}`);
    }
  }

  /**
   * Create new project using real GraphQL mutation
   */
  async createProjectV2(input: CreateProjectV2Input): Promise<ProjectV2Node> {
    this.ensureInitialized();

    const mutation = `
      mutation CreateProjectV2($input: CreateProjectV2Input!) {
        createProjectV2(input: $input) {
          projectV2 {
            id
            number
            title
            url
            shortDescription
            readme
            closed
            createdAt
            updatedAt
            creator {
              login
              id
            }
            owner {
              id
              login
            }
            items(first: 1) {
              totalCount
            }
            fields(first: 10) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
              }
            }
            views(first: 5) {
              nodes {
                id
                name
                layout
                number
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.octokit!.graphql(mutation, { input });

      const project = response.createProjectV2.projectV2;

      this.logger.info('Created project via GraphQL', {
        projectId: project.id,
        title: project.title,
        number: project.number
      });

      return project;
    } catch (error) {
      this.logger.error('Failed to create project via GraphQL', { error, input });
      throw new Error(`Project creation failed: ${error.message}`);
    }
  }

  /**
   * Update project using real GraphQL mutation
   */
  async updateProjectV2(input: UpdateProjectV2Input): Promise<ProjectV2Node> {
    this.ensureInitialized();

    const mutation = `
      mutation UpdateProjectV2($input: UpdateProjectV2Input!) {
        updateProjectV2(input: $input) {
          projectV2 {
            id
            number
            title
            url
            shortDescription
            readme
            closed
            closedAt
            updatedAt
            owner {
              id
              login
            }
          }
        }
      }
    `;

    try {
      const response = await this.octokit!.graphql(mutation, { input });

      const project = response.updateProjectV2.projectV2;

      this.logger.info('Updated project via GraphQL', {
        projectId: project.id,
        title: project.title
      });

      return project;
    } catch (error) {
      this.logger.error('Failed to update project via GraphQL', { error, input });
      throw new Error(`Project update failed: ${error.message}`);
    }
  }

  /**
   * Add item to project using real GraphQL mutation
   */
  async addProjectV2Item(input: AddProjectV2ItemInput): Promise<ProjectV2ItemNode> {
    this.ensureInitialized();

    const mutation = `
      mutation AddProjectV2ItemByContentId($input: AddProjectV2ItemByContentIdInput!) {
        addProjectV2ItemByContentId(input: $input) {
          item {
            id
            type
            content {
              ... on Issue {
                id
                number
                title
                url
                state
                repository {
                  name
                  owner {
                    login
                  }
                }
              }
              ... on PullRequest {
                id
                number
                title
                url
                state
                repository {
                  name
                  owner {
                    login
                  }
                }
              }
            }
            fieldValues(first: 10) {
              nodes {
                ... on ProjectV2ItemFieldTextValue {
                  id
                  text
                  field {
                    ... on ProjectV2Field {
                      id
                      name
                    }
                  }
                }
              }
            }
            createdAt
            updatedAt
          }
        }
      }
    `;

    try {
      const response = await this.octokit!.graphql(mutation, { input });

      const item = response.addProjectV2ItemByContentId.item;

      this.logger.info('Added item to project via GraphQL', {
        projectId: input.projectId,
        itemId: item.id,
        contentId: input.contentId
      });

      return item;
    } catch (error) {
      this.logger.error('Failed to add item to project via GraphQL', { error, input });
      throw new Error(`Add item failed: ${error.message}`);
    }
  }

  /**
   * Update project item field value using real GraphQL mutation
   */
  async updateProjectV2ItemFieldValue(input: UpdateProjectV2ItemFieldValueInput): Promise<ProjectV2ItemNode> {
    this.ensureInitialized();

    const mutation = `
      mutation UpdateProjectV2ItemFieldValue($input: UpdateProjectV2ItemFieldValueInput!) {
        updateProjectV2ItemFieldValue(input: $input) {
          projectV2Item {
            id
            type
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldTextValue {
                  id
                  text
                  field {
                    ... on ProjectV2Field {
                      id
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldNumberValue {
                  id
                  number
                  field {
                    ... on ProjectV2Field {
                      id
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldDateValue {
                  id
                  date
                  field {
                    ... on ProjectV2Field {
                      id
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  id
                  singleSelectOption {
                    id
                    name
                    color
                  }
                  field {
                    ... on ProjectV2SingleSelectField {
                      id
                      name
                    }
                  }
                }
              }
            }
            updatedAt
          }
        }
      }
    `;

    try {
      const response = await this.octokit!.graphql(mutation, { input });

      const item = response.updateProjectV2ItemFieldValue.projectV2Item;

      this.logger.info('Updated project item field value via GraphQL', {
        projectId: input.projectId,
        itemId: input.itemId,
        fieldId: input.fieldId
      });

      return item;
    } catch (error) {
      this.logger.error('Failed to update project item field value via GraphQL', { error, input });
      throw new Error(`Update field value failed: ${error.message}`);
    }
  }

  /**
   * Get project by ID using real GraphQL query
   */
  async getProjectV2ById(projectId: string): Promise<ProjectV2Node> {
    this.ensureInitialized();

    const query = `
      query GetProjectV2($id: ID!) {
        node(id: $id) {
          ... on ProjectV2 {
            id
            number
            title
            url
            shortDescription
            readme
            closed
            closedAt
            createdAt
            updatedAt
            deletedAt
            creator {
              login
              id
            }
            owner {
              id
              login
            }
            items(first: 100) {
              totalCount
              nodes {
                id
                type
                content {
                  ... on Issue {
                    id
                    number
                    title
                    url
                    state
                    repository {
                      name
                      owner {
                        login
                      }
                    }
                  }
                  ... on PullRequest {
                    id
                    number
                    title
                    url
                    state
                    repository {
                      name
                      owner {
                        login
                      }
                    }
                  }
                }
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldTextValue {
                      id
                      text
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                        }
                      }
                    }
                    ... on ProjectV2ItemFieldNumberValue {
                      id
                      number
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                        }
                      }
                    }
                    ... on ProjectV2ItemFieldDateValue {
                      id
                      date
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                        }
                      }
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      id
                      singleSelectOption {
                        id
                        name
                        color
                      }
                      field {
                        ... on ProjectV2SingleSelectField {
                          id
                          name
                        }
                      }
                    }
                  }
                }
                createdAt
                updatedAt
              }
            }
            fields(first: 20) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  dataType
                  options {
                    id
                    name
                    color
                  }
                }
              }
            }
            views(first: 10) {
              nodes {
                id
                name
                layout
                number
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.octokit!.graphql(query, { id: projectId });

      if (!response.node) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      const project = response.node;

      this.logger.info('Retrieved project by ID via GraphQL', {
        projectId: project.id,
        title: project.title,
        itemCount: project.items.totalCount
      });

      return project;
    } catch (error) {
      this.logger.error('Failed to get project by ID via GraphQL', { error, projectId });
      throw new Error(`Get project failed: ${error.message}`);
    }
  }

  /**
   * Search for content to add to projects (issues/PRs)
   */
  async searchContentForProject(query: string, type: 'ISSUE' | 'PULL_REQUEST' = 'ISSUE'): Promise<any[]> {
    this.ensureInitialized();

    const searchQuery = `
      query SearchContent($query: String!, $type: SearchType!, $first: Int!) {
        search(query: $query, type: $type, first: $first) {
          nodes {
            ... on Issue {
              id
              number
              title
              url
              state
              repository {
                name
                owner {
                  login
                }
              }
              createdAt
              updatedAt
            }
            ... on PullRequest {
              id
              number
              title
              url
              state
              repository {
                name
                owner {
                  login
                }
              }
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    try {
      const response = await this.octokit!.graphql(searchQuery, {
        query,
        type,
        first: 20
      });

      this.logger.info('Searched content for project', {
        query,
        type,
        resultCount: response.search.nodes.length
      });

      return response.search.nodes;
    } catch (error) {
      this.logger.error('Failed to search content', { error, query, type });
      throw new Error(`Content search failed: ${error.message}`);
    }
  }

  /**
   * Ensure client is initialized
   */
  private ensureInitialized(): void {
    if (!this.octokit) {
      throw new Error('GraphQL client not initialized. Call initialize() first.');
    }
  }

  /**
   * Get current rate limit status for GraphQL
   */
  async getGraphQLRateLimit(): Promise<any> {
    this.ensureInitialized();

    const query = `
      query GetRateLimit {
        rateLimit {
          limit
          remaining
          resetAt
          used
          cost
        }
      }
    `;

    try {
      const response = await this.octokit!.graphql(query);
      return response.rateLimit;
    } catch (error) {
      this.logger.error('Failed to get GraphQL rate limit', { error });
      throw error;
    }
  }
}

// Version & Run Log
// | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
// |---------|-----------|-------------|----------------|-----------|--------|-------|------|------|
// | 1.0.0   | 2025-01-27T21:25:00Z | assistant@claude-sonnet-4 | Real GitHub GraphQL client for Projects v2 API with authentic mutations and queries | GitHubGraphQLClient.ts | OK | Complete Projects v2 GraphQL implementation with real API calls | 0.00 | e3a9d7f |

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: github-phase8-graphql-client-001
// inputs: ["GitHub Projects v2 GraphQL requirements", "Real API implementation specifications"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"graphql-client-v1"}