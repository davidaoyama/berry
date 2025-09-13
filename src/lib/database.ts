// Placeholder database service implementation
// This file provides a mock database layer that can be easily replaced
// with a real database (Firebase Firestore, Supabase, etc.) later

import { v4 as uuidv4 } from 'uuid';
import type { 
  Resource, 
  User, 
  ResourceStatus, 
  AdminAction, 
  DatabaseService,
  ResourceCategory
} from '@/types';

// In-memory storage for development
// TODO: Replace with actual database implementation
// eslint-disable-next-line prefer-const
let mockResources: Resource[] = [
  {
    id: '1',
    title: 'Classroom Tablets',
    description: 'iPad tablets for student learning activities',
    category: 'technology' as ResourceCategory,
    status: 'approved' as ResourceStatus,
    requestedBy: 'teacher1',
    requestedByEmail: 'john.doe@lausd.net',
    requestedByName: 'John Doe',
    requestedAt: new Date('2024-01-15'),
    quantity: 30,
    priority: 'high',
    justification: 'Need tablets for interactive math lessons and digital literacy',
    estimatedCost: 15000,
    supplier: 'Apple Education',
    approvedBy: 'admin1',
    approvedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    title: 'Science Lab Equipment',
    description: 'Microscopes and lab supplies for biology class',
    category: 'equipment' as ResourceCategory,
    status: 'pending' as ResourceStatus,
    requestedBy: 'teacher2',
    requestedByEmail: 'jane.smith@lausd.net',
    requestedByName: 'Jane Smith',
    requestedAt: new Date('2024-02-01'),
    quantity: 15,
    priority: 'medium',
    justification: 'Current microscopes are outdated and some are broken',
    estimatedCost: 8000,
    supplier: 'Educational Supplies Inc',
  },
  {
    id: '3',
    title: 'Art Supplies',
    description: 'Paint, brushes, and canvases for art class',
    category: 'supplies' as ResourceCategory,
    status: 'denied' as ResourceStatus,
    requestedBy: 'teacher3',
    requestedByEmail: 'mike.johnson@lausd.net',
    requestedByName: 'Mike Johnson',
    requestedAt: new Date('2024-01-25'),
    quantity: 1,
    priority: 'low',
    justification: 'Students need fresh supplies for upcoming art projects',
    estimatedCost: 500,
    deniedBy: 'admin1',
    deniedAt: new Date('2024-01-30'),
    denialReason: 'Similar request approved recently, please coordinate with other teachers',
  }
];

// eslint-disable-next-line prefer-const
let mockUsers: User[] = [];

// Placeholder database service implementation
export class PlaceholderDatabaseService implements DatabaseService {
  
  // Resource operations
  async createResource(resource: Omit<Resource, 'id'>): Promise<Resource> {
    const newResource: Resource = {
      ...resource,
      id: uuidv4(),
    };
    
    mockResources.push(newResource);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return newResource;
  }

  async getResource(id: string): Promise<Resource | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockResources.find(resource => resource.id === id) || null;
  }

  async getAllResources(): Promise<Resource[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockResources];
  }

  async getResourcesByUser(userId: string): Promise<Resource[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockResources.filter(resource => resource.requestedBy === userId);
  }

  async getResourcesByStatus(status: ResourceStatus): Promise<Resource[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockResources.filter(resource => resource.status === status);
  }

  async updateResourceStatus(
    id: string, 
    status: ResourceStatus, 
    adminAction?: AdminAction
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const resourceIndex = mockResources.findIndex(resource => resource.id === id);
    if (resourceIndex === -1) {
      throw new Error(`Resource with id ${id} not found`);
    }

    const resource = mockResources[resourceIndex];
    
    // Update the resource with new status
    mockResources[resourceIndex] = {
      ...resource,
      status,
      ...(status === 'approved' && adminAction && {
        approvedBy: adminAction.adminId,
        approvedAt: adminAction.timestamp,
      }),
      ...(status === 'denied' && adminAction && {
        deniedBy: adminAction.adminId,
        deniedAt: adminAction.timestamp,
        denialReason: adminAction.reason,
      }),
    };
  }

  // User operations
  async createUser(user: Partial<User>): Promise<User> {
    const newUser = {
      ...user,
      uid: user.uid || uuidv4(),
      isVerified: user.isVerified || false,
      role: user.role || ('teacher' as const),
    } as User;
    
    mockUsers.push(newUser);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    return newUser;
  }

  async getUser(id: string): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockUsers.find(user => user.uid === id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const userIndex = mockUsers.findIndex(user => user.uid === id);
    if (userIndex === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
  }
}

// Singleton instance
export const db = new PlaceholderDatabaseService();

// Utility functions for database operations
export const getDatabaseStats = async () => {
  const resources = await db.getAllResources();
  const stats = {
    total: resources.length,
    pending: resources.filter(r => r.status === 'pending').length,
    approved: resources.filter(r => r.status === 'approved').length,
    denied: resources.filter(r => r.status === 'denied').length,
  };
  
  return stats;
};

// Extension points for future database implementations:
// - Replace with Firebase Firestore: import { db } from '@/lib/firebase';
// - Replace with Supabase: import { supabase } from '@/lib/supabase';
// - Replace with Prisma: import { prisma } from '@/lib/prisma';
// - Add caching layer with Redis
// - Add search functionality with Elasticsearch
// - Add real-time updates with WebSockets