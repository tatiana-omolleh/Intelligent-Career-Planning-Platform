import api from "./api";

// Fetch all users
export const getAllUsers = async () => {
  const response = await api.get("admin/users/");
  return response.data;
};

// Toggle user status (active/inactive)
export const toggleUserStatus = async (userId) => {
  const response = await api.patch(`admin/users/${userId}/status/`);
  return response.data;
};

// Update user role
export const updateUserRole = async (userId, newRole) => {
  const response = await api.patch(`admin/users/${userId}/role/`, { role: newRole });
  return response.data;
};

// Get dashboard stats
export const getDashboardStats = async () => {
  const response = await api.get("admin/stats/");
  return response.data;
};

// Get all jobs
export const getAllJobs = async () => {
  const response = await api.get("admin/jobs/");
  return response.data;
};

// Create a new job/internship
export const createJob = async (jobData) => {
  const response = await api.post("admin/jobs/", jobData);
  return response.data;
};

// Update an existing job/internship
export const updateJob = async (jobId, jobData) => {
  const response = await api.patch(`admin/jobs/${jobId}/`, jobData);
  return response.data;
};

// Delete a job/internship
export const deleteJob = async (jobId) => {
  const response = await api.delete(`admin/jobs/${jobId}/`);
  return response.data;
};