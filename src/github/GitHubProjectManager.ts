/**
 * GitHub Projects v2 Manager
 * Real GraphQL integration for GitHub Projects v2 API
 */

import { GitHubAPIClient } from './GitHubAPIClient';
import {
  GitHubProject,
  GitHubProjectItem,
  GitHubProjectField,
  GitHubProjectStatus
} from '../types/github-types';

export class GitHubProjectManager {
  private apiClient: GitHubAPIClient;
  private projectCache = new Map<string, GitHubProject>();

  constructor(apiClient: GitHubAPIClient) {
    this.apiClient = apiClient;
  }

  async initialize(): Promise<void> {
    console.log('GitHub Project Manager initialized');
  }

  /**
   * Get project by ID using GraphQL
   */
  async getProject(projectId: string): Promise<GitHubProject> {
    if (this.projectCache.has(projectId)) {
      return this.projectCache.get(projectId)!;
    }

    const query = `
      query GetProject($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            id
            title
            shortDescription
            readme
            url
            closed
            createdAt
            updatedAt
            owner {
              ... on User {
                login
              }
              ... on Organization {
                login
              }
            }
            fields(first: 50) {
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
                ... on ProjectV2IterationField {
                  id
                  name
                  dataType
                  configuration {
                    iterations {
                      id
                      title
                      startDate
                      duration
                    }
                  }
                }
              }
            }
            items(first: 100) {
              nodes {
                id
                type
                fieldValues(first: 50) {
                  nodes {
                    ... on ProjectV2ItemFieldTextValue {
                      text
                      field {
                        ... on ProjectV2Field {
                          name
                        }
                      }
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                        }
                      }
                    }
                  }
                }
                content {
                  ... on Issue {
                    id
                    number
                    title
                    state
                    url
                  }
                  ... on PullRequest {
                    id
                    number
                    title
                    state
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.graphql<{
      node: GitHubProject;
    }>(query, { projectId });

    const project = response.node;
    this.projectCache.set(projectId, project);
    return project;
  }

  /**
   * Create new project
   */
  async createProject(owner: string, options: {
    title: string;
    description?: string;
    template?: string;
  }): Promise<GitHubProject> {
    const mutation = `
      mutation CreateProject($ownerId: ID!, $title: String!, $description: String) {
        createProjectV2(input: {
          ownerId: $ownerId
          title: $title
          shortDescription: $description
        }) {
          projectV2 {
            id
            title
            shortDescription
            url
          }
        }
      }
    `;

    // First get owner ID
    const ownerQuery = `
      query GetOwner($login: String!) {
        user(login: $login) {
          id
        }
        organization(login: $login) {
          id
        }
      }
    `;

    const ownerResponse = await this.apiClient.graphql<{
      user?: { id: string };
      organization?: { id: string };
    }>(ownerQuery, { login: owner });

    const ownerId = ownerResponse.user?.id || ownerResponse.organization?.id;
    if (!ownerId) {
      throw new Error(`Owner '${owner}' not found`);
    }

    const response = await this.apiClient.graphql<{
      createProjectV2: { projectV2: GitHubProject };
    }>(mutation, {
      ownerId,
      title: options.title,
      description: options.description
    });

    return response.createProjectV2.projectV2;
  }

  /**
   * Add item to project
   */
  async addItemToProject(projectId: string, contentId: string): Promise<GitHubProjectItem> {
    const mutation = `
      mutation AddItemToProject($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {
          projectId: $projectId
          contentId: $contentId
        }) {
          item {
            id
            type
            content {
              ... on Issue {
                id
                number
                title
                url
              }
              ... on PullRequest {
                id
                number
                title
                url
              }
            }
          }
        }
      }
    `;

    const response = await this.apiClient.graphql<{
      addProjectV2ItemById: { item: GitHubProjectItem };
    }>(mutation, { projectId, contentId });

    return response.addProjectV2ItemById.item;
  }

  /**
   * Update project item field
   */
  async updateProjectItemField(
    projectId: string,
    itemId: string,
    fieldId: string,
    value: string | number
  ): Promise<void> {
    const mutation = `
      mutation UpdateProjectItemField($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: $value
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;

    await this.apiClient.graphql(mutation, {
      projectId,
      itemId,
      fieldId,
      value: { text: String(value) }
    });
  }

  /**
   * Move item to status column
   */
  async moveItemToStatus(
    projectId: string,
    itemId: string,
    status: GitHubProjectStatus
  ): Promise<void> {
    const project = await this.getProject(projectId);
    const statusField = project.fields.nodes.find(
      field => field.name.toLowerCase() === 'status'
    );

    if (!statusField) {
      throw new Error('Status field not found in project');
    }

    const statusOption = (statusField as any).options?.find(
      (option: any) => option.name.toLowerCase() === status.toLowerCase()
    );

    if (!statusOption) {
      throw new Error(`Status '${status}' not found in project`);
    }

    const mutation = `
      mutation UpdateProjectItemStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;

    await this.apiClient.graphql(mutation, {
      projectId,
      itemId,
      fieldId: statusField.id,
      optionId: statusOption.id
    });
  }

  /**
   * Sync issues to project
   */
  async syncIssues(owner: string, repo: string, projectId: string): Promise<number> {
    let syncedCount = 0;
    let page = 1;
    const perPage = 100;

    while (true) {
      const issues = await this.apiClient.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: perPage,
        page
      });

      if (issues.data.length === 0) break;

      for (const issue of issues.data) {
        if (!issue.pull_request) {
          try {
            await this.addItemToProject(projectId, issue.node_id);
            syncedCount++;
          } catch (error) {
            console.warn(`Failed to add issue #${issue.number} to project:`, error);
          }
        }
      }

      if (issues.data.length < perPage) break;
      page++;
    }

    return syncedCount;
  }

  /**
   * Create project field
   */
  async createProjectField(
    projectId: string,
    name: string,
    dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'SINGLE_SELECT'
  ): Promise<GitHubProjectField> {
    const mutation = `
      mutation CreateProjectField($projectId: ID!, $name: String!, $dataType: ProjectV2FieldType!) {
        createProjectV2Field(input: {
          projectId: $projectId
          name: $name
          dataType: $dataType
        }) {
          projectV2Field {
            id
            name
            dataType
          }
        }
      }
    `;

    const response = await this.apiClient.graphql<{
      createProjectV2Field: { projectV2Field: GitHubProjectField };
    }>(mutation, { projectId, name, dataType });

    return response.createProjectV2Field.projectV2Field;
  }

  /**
   * Enable automatic project sync
   */
  async enableAutomaticSync(owner: string, repo: string): Promise<void> {
    console.log(`Enabling automatic project sync for ${owner}/${repo}`);
    // This would typically involve setting up webhooks
    // Implementation depends on specific automation requirements
  }

  /**
   * Get project analytics
   */
  async getProjectAnalytics(projectId: string): Promise<{
    totalItems: number;
    itemsByStatus: Record<string, number>;
    recentActivity: any[];
  }> {
    const project = await this.getProject(projectId);
    const totalItems = project.items.nodes.length;

    const itemsByStatus: Record<string, number> = {};
    for (const item of project.items.nodes) {
      const statusValue = item.fieldValues.nodes.find(
        fv => (fv as any).field?.name?.toLowerCase() === 'status'
      ) as any;

      const status = statusValue?.name || 'No Status';
      itemsByStatus[status] = (itemsByStatus[status] || 0) + 1;
    }

    return {
      totalItems,
      itemsByStatus,
      recentActivity: [] // Would implement activity tracking
    };
  }

  /**
   * Clear project cache
   */
  clearCache(): void {
    this.projectCache.clear();
  }
}

export default GitHubProjectManager;