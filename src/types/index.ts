// TypeScript interfaces for the BERRY application
// These interfaces define the data structures for resources, applications, and users

import { User as FirebaseUser } from 'firebase/auth';

// Extended user interface that includes LAUSD-specific fields
export interface User extends FirebaseUser {
  isVerified: boolean;
  role: 'student' | 'teacher' | 'admin';
  // Extension point: Add more user fields as needed
  // department?: string;
  // school?: string;
  // grade_level?: string;
}

// Resource status enum
export type ResourceStatus = 'pending' | 'approved' | 'denied' | 'archived';

// Resource category enum
export type ResourceCategory = 'technology' | 'books' | 'supplies' | 'equipment' | 'other';

// Main resource interface
export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  status: ResourceStatus;
  requestedBy: string; // User ID
  requestedByEmail: string;
  requestedByName: string;
  requestedAt: Date;
  quantity: number;
  priority: 'low' | 'medium' | 'high';
  justification: string; // Why this resource is needed
  estimatedCost?: number;
  supplier?: string;
  approvedBy?: string; // Admin user ID
  approvedAt?: Date;
  deniedBy?: string; // Admin user ID
  deniedAt?: Date;
  denialReason?: string;
  // Extension points for future features:
  // attachments?: string[]; // File URLs
  // department?: string;
  // school?: string;
  // deliveryAddress?: string;
  // notes?: string[];
}

// Application form data interface
export interface ResourceApplicationForm {
  title: string;
  description: string;
  category: ResourceCategory;
  quantity: number;
  priority: 'low' | 'medium' | 'high';
  justification: string;
  estimatedCost?: number;
  supplier?: string;
}

// Admin action interface for approval/denial
export interface AdminAction {
  resourceId: string;
  action: 'approve' | 'deny';
  reason?: string; // Required for denial
  adminId: string;
  adminEmail: string;
  timestamp: Date;
}

// Database interfaces for placeholder implementation
export interface DatabaseService {
  // Resource operations
  createResource(resource: Omit<Resource, 'id'>): Promise<Resource>;
  getResource(id: string): Promise<Resource | null>;
  getAllResources(): Promise<Resource[]>;
  getResourcesByUser(userId: string): Promise<Resource[]>;
  getResourcesByStatus(status: ResourceStatus): Promise<Resource[]>;
  updateResourceStatus(id: string, status: ResourceStatus, adminAction?: AdminAction): Promise<void>;
  
  // User operations
  createUser(user: Partial<User>): Promise<User>;
  getUser(id: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  
  // Extension points for future features:
  // addComment(resourceId: string, comment: Comment): Promise<void>;
  // uploadFile(file: File): Promise<string>; // Returns URL
  // sendNotification(userId: string, notification: Notification): Promise<void>;
}

// Mock data interfaces for development
export interface MockData {
  users: User[];
  resources: Resource[];
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form validation interfaces
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}