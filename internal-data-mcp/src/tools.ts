import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  searchEmployees,
  getProjectsByStatus,
  getProjectMembers,
} from "./db.js";

export function registerTools(server: McpServer) {
  // Tool 1: Search the employee directory
  server.tool(
    "search_employees",
    `Search the internal employee directory by name, email, or role.
     Returns matching employees with their department and reporting structure.
     Use this when the user asks about people, teams, or org structure.`,
    {
      query: z
        .string()
        .describe("Search term: employee name, email, or role title"),
      department: z
        .string()
        .optional()
        .describe(
          "Filter by department name (e.g., 'Engineering', 'Marketing')"
        ),
    },
    async ({ query, department }) => {
      const employees = await searchEmployees(query, department);

      if (employees.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No employees found matching "\({query}"\){department ? ` in ${department}` : ""}.`,
            },
          ],
        };
      }

      const formatted = employees
        .map(
          (e) =>
            `- **\({e.name}** (\){e.email})\n  Role: \({e.role} | Dept: \){e.department} | Since: ${e.start_date}`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found \({employees.length} employee(s):\n\n\){formatted}`,
          },
        ],
      };
    }
  );

  // Tool 2: List projects by status
  server.tool(
    "list_projects",
    `List internal projects filtered by status.
     Returns project name, lead, department, and deadline.
     Use this when the user asks about ongoing work, project status, or deadlines.`,
    {
      status: z
        .enum(["active", "completed", "on_hold"])
        .describe("Project status to filter by"),
    },
    async ({ status }) => {
      const projects = await getProjectsByStatus(status);

      if (projects.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No ${status} projects found.`,
            },
          ],
        };
      }

      const formatted = projects
        .map(
          (p) =>
            `- **\({p.name}** [\){p.status}]\n  Lead: \({p.lead_id} | Dept: \){p.department} | Deadline: ${p.deadline ?? "None"}`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `\({projects.length} \){status} project(s):\n\n${formatted}`,
          },
        ],
      };
    }
  );

  // Tool 3: Get team members for a project
  server.tool(
    "get_project_team",
    `Get all team members assigned to a specific project.
     Returns employee details for each member.
     Use this when the user asks who is working on a project.`,
    {
      project_id: z
        .string()
        .uuid()
        .describe("The UUID of the project to look up"),
    },
    async ({ project_id }) => {
      const members = await getProjectMembers(project_id);

      if (members.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No team members found for this project.",
            },
          ],
        };
      }

      const formatted = members
        .map((m) => `- \({m.name} (\){m.role}, ${m.department})`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Project team (\({members.length} members):\n\n\){formatted}`,
          },
        ],
      };
    }
  );
}