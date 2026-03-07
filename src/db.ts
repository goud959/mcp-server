import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.INTERNAL_DB_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  manager_id: string | null;
  start_date: string;
}

export interface Project {
  id: string;
  name: string;
  status: "active" | "completed" | "on_hold";
  lead_id: string;
  department: string;
  deadline: string | null;
}

export async function searchEmployees(
  query: string,
  department?: string
): Promise<Employee[]> {
  const conditions = ["(name ILIKE \(1 OR email ILIKE \)1 OR role ILIKE $1)"];
  const params: string[] = [`%${query}%`];

  if (department) {
    conditions.push(`department = $${params.length + 1}`);
    params.push(department);
  }

  const result = await pool.query<Employee>(
    `SELECT id, name, email, department, role, manager_id, start_date
     FROM employees
     WHERE ${conditions.join(" AND ")}
     ORDER BY name
     LIMIT 25`,
    params
  );

  return result.rows;
}

export async function getProjectsByStatus(
  status: string
): Promise<Project[]> {
  const result = await pool.query<Project>(
    `SELECT id, name, status, lead_id, department, deadline
     FROM projects
     WHERE status = $1
     ORDER BY deadline ASC NULLS LAST`,
    [status]
  );

  return result.rows;
}

export async function getProjectMembers(
  projectId: string
): Promise<Employee[]> {
  const result = await pool.query<Employee>(
    `SELECT e.id, e.name, e.email, e.department, e.role,
            e.manager_id, e.start_date
     FROM employees e
     JOIN project_members pm ON pm.employee_id = e.id
     WHERE pm.project_id = $1
     ORDER BY e.name`,
    [projectId]
  );

  return result.rows;
}