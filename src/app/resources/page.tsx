// Resources list page with filtering and search
// Shows all resources with status badges and detailed view modal

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Button, Input, Card, Badge, LoadingSpinner, Modal, Select } from '@/components/ui';
import { db } from '@/lib/database';
import type { Resource, ResourceStatus, ResourceCategory } from '@/types';
import { Search, Eye, Calendar, User, DollarSign, Package } from 'lucide-react';

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all');
  const [showMyResources, setShowMyResources] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await db.getAllResources();
      setResources(data);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...resources];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.requestedByName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(resource => resource.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(resource => resource.category === categoryFilter);
    }

    // My resources filter
    if (showMyResources && user) {
      filtered = filtered.filter(resource => resource.requestedBy === user.uid);
    }

    setFilteredResources(filtered);
  }, [resources, searchTerm, statusFilter, categoryFilter, showMyResources, user]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const openDetailModal = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedResource(null);
    setShowDetailModal(false);
  };

  const getStatusBadgeVariant = (status: ResourceStatus) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'denied':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'gray';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'gray';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!user) {
    return null; // Will redirect via auth
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
          <p className="mt-2 text-gray-600">
            Browse and manage educational resources for LAUSD
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ResourceStatus | 'all')}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'denied', label: 'Denied' },
                ]}
                className="min-w-40"
              />
              
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as ResourceCategory | 'all')}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'technology', label: 'Technology' },
                  { value: 'books', label: 'Books' },
                  { value: 'supplies', label: 'Supplies' },
                  { value: 'equipment', label: 'Equipment' },
                  { value: 'other', label: 'Other' },
                ]}
                className="min-w-40"
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMyResources}
                  onChange={(e) => setShowMyResources(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show only my resources</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Resources List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredResources.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No resources found</h3>
            <p className="mt-2 text-gray-600">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || showMyResources
                ? 'Try adjusting your filters to see more resources.'
                : 'No resources have been submitted yet.'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {resource.category}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={getStatusBadgeVariant(resource.status)}>
                        {resource.status}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(resource.priority)}>
                        {resource.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {resource.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{resource.requestedByName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Requested {formatDate(resource.requestedAt)}</span>
                    </div>
                    {resource.estimatedCost && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(resource.estimatedCost)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailModal(resource)}
                      icon={Eye}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={closeDetailModal}
          title={selectedResource?.title}
          size="lg"
        >
          {selectedResource && (
            <div className="space-y-6">
              {/* Status and Priority */}
              <div className="flex space-x-4">
                <Badge variant={getStatusBadgeVariant(selectedResource.status)} size="md">
                  Status: {selectedResource.status}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(selectedResource.priority)} size="md">
                  Priority: {selectedResource.priority}
                </Badge>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Category</h4>
                  <p className="text-gray-600 capitalize">{selectedResource.category}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Quantity</h4>
                  <p className="text-gray-600">{selectedResource.quantity}</p>
                </div>
                {selectedResource.estimatedCost && (
                  <div>
                    <h4 className="font-medium text-gray-900">Estimated Cost</h4>
                    <p className="text-gray-600">{formatCurrency(selectedResource.estimatedCost)}</p>
                  </div>
                )}
                {selectedResource.supplier && (
                  <div>
                    <h4 className="font-medium text-gray-900">Supplier</h4>
                    <p className="text-gray-600">{selectedResource.supplier}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedResource.description}</p>
              </div>

              {/* Justification */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Justification</h4>
                <p className="text-gray-600">{selectedResource.justification}</p>
              </div>

              {/* Requester Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Requested By</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium">{selectedResource.requestedByName}</p>
                  <p className="text-sm text-gray-600">{selectedResource.requestedByEmail}</p>
                  <p className="text-sm text-gray-600">
                    Submitted on {formatDate(selectedResource.requestedAt)}
                  </p>
                </div>
              </div>

              {/* Admin Actions Result */}
              {selectedResource.status === 'approved' && selectedResource.approvedAt && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Approval Information</h4>
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-700">
                      Approved on {formatDate(selectedResource.approvedAt)}
                      {selectedResource.approvedBy && ` by ${selectedResource.approvedBy}`}
                    </p>
                  </div>
                </div>
              )}

              {selectedResource.status === 'denied' && selectedResource.deniedAt && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Denial Information</h4>
                  <div className="bg-red-50 p-3 rounded-md">
                    <p className="text-sm text-red-700">
                      Denied on {formatDate(selectedResource.deniedAt)}
                      {selectedResource.deniedBy && ` by ${selectedResource.deniedBy}`}
                    </p>
                    {selectedResource.denialReason && (
                      <p className="text-sm text-red-700 mt-1">
                        Reason: {selectedResource.denialReason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}