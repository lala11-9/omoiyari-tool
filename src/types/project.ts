// src/types/project.ts

export interface Project {
  id: string;
  name: string;
  owner: string;
  tags: string[];
  decisions: Decision[];
  links: Link[];
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  content: string;
  createdAt: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface Memo {
  id: string;
  content: string;
  tags: string[];
  links: string[];
  projectId?: string;
  createdAt: string;
}