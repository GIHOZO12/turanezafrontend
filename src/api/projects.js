import { apiRequest } from './client';
import { toQueryString } from './utils';

const PROJECTS_ROOT = '/api/v1/projects';

export const fetchProjects = (params = {}) =>
  apiRequest(`${PROJECTS_ROOT}/projects/${toQueryString(params)}`, {
    method: 'GET',
  });

export const fetchProjectById = (projectId) =>
  apiRequest(`${PROJECTS_ROOT}/projects/${projectId}/`, {
    method: 'GET',
  });

export const fetchProjectDesignAssets = (projectId) =>
  apiRequest(`${PROJECTS_ROOT}/designs/?project=${projectId}`, {
    method: 'GET',
  });

export const createProjectDesignAsset = (formData) =>
  apiRequest(`${PROJECTS_ROOT}/designs/`, {
    method: 'POST',
    body: formData,
  });

export const deleteProjectDesignAsset = (assetId) =>
  apiRequest(`${PROJECTS_ROOT}/designs/${assetId}/`, {
    method: 'DELETE',
  });

export const fetchProjectMilestones = (projectId) =>
  apiRequest(`${PROJECTS_ROOT}/milestones/${toQueryString({ project: projectId })}`, {
    method: 'GET',
  });

export const fetchProjectNews = (projectId) =>
  apiRequest(`${PROJECTS_ROOT}/news/${toQueryString({ project: projectId })}`, {
    method: 'GET',
  });

export const fetchProjectFiles = (projectId) =>
  apiRequest(`${PROJECTS_ROOT}/files/${toQueryString({ project: projectId })}`, {
    method: 'GET',
  });

export const fetchProjectIncomeRecords = (projectId) =>
  apiRequest(`${PROJECTS_ROOT}/income-records/${toQueryString({ project: projectId })}`, {
    method: 'GET',
  });

export const fetchPropertyListings = (params = {}) =>
  apiRequest(`${PROJECTS_ROOT}/properties/${toQueryString(params)}`, {
    method: 'GET',
  });

export const fetchPropertyById = (projectId) =>
  apiRequest(`${PROJECTS_ROOT}/properties/${projectId}/`, {
    method: 'GET',
  });
