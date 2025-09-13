// Admin page for approving/denying resource requests
// Only accessible to users with admin role

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Button, Card, Badge, LoadingSpinner, Modal, Textarea } from '@/components/ui';
import { db, getDatabaseStats } from '@/lib/database';
import type { Resource, AdminAction } from '@/types';
import { Shield, Check, X, Eye, Calendar, User, DollarSign, TrendingUp } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, denied: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'deny'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resourcesData, statsData] = await Promise.all([
        filter === 'all' ? db.getAllResources() : db.getResourcesByStatus(filter),
        getDatabaseStats(),
      ]);
      
      setResources(resourcesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user, loadData]);

  useEffect(() => {
    loadData();
  }, [filter, loadData]);

  const openActionModal = (resource: Resource, action: 'approve' | 'deny') => {
    setSelectedResource(resource);
    setActionType(action);
    setActionReason('');
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setSelectedResource(null);
    setShowActionModal(false);
    setActionReason('');
  };

  const handleAction = async () => {
    if (!selectedResource || !user) return;

    // Validate reason for denial
    if (actionType === 'deny' && !actionReason.trim()) {
      alert('Please provide a reason for denial');
      return;
    }

    setActionLoading(true);

    try {
      const adminAction: AdminAction = {
        resourceId: selectedResource.id,
        action: actionType,
        reason: actionType === 'deny' ? actionReason : undefined,
        adminId: user.uid,
        adminEmail: user.email || '',
        timestamp: new Date(),
      };

      await db.updateResourceStatus(selectedResource.id, actionType === 'approve' ? 'approved' : 'denied', adminAction);
      
      // Refresh data
      await loadData();
      closeActionModal();
    } catch (error) {
      console.error('Failed to update resource status:', error);
      alert('Failed to update resource status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
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

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-2 text-gray-600">
              You need administrator privileges to access this page.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage resource requests and monitor system activity
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <X className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Denied</p>
                <p className="text-2xl font-bold text-gray-900">{stats.denied}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'all', label: 'All', count: stats.total },
              { key: 'approved', label: 'Approved', count: stats.approved },
              { key: 'denied', label: 'Denied', count: stats.denied },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as 'all' | 'pending' | 'approved' | 'denied')}
                className={`${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-900 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Resources List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : resources.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400">
              <Shield className="mx-auto h-12 w-12" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No resources found</h3>
            <p className="mt-2 text-gray-600">
              {filter === 'pending' 
                ? 'No pending requests at this time.' 
                : `No ${filter} resources found.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {resources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {resource.category} • Quantity: {resource.quantity}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusBadgeVariant(resource.status)}>
                          {resource.status}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(resource.priority)}>
                          {resource.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 line-clamp-2">
                      {resource.description}
                    </p>

                    {/* Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="truncate">{resource.requestedByName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(resource.requestedAt)}</span>
                      </div>
                      {resource.estimatedCost && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(resource.estimatedCost)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row lg:flex-col gap-2">
                    {resource.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => openActionModal(resource, 'approve')}
                          icon={Check}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => openActionModal(resource, 'deny')}
                          icon={X}
                        >
                          Deny
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedResource(resource);
                        // You could open a detail modal here
                      }}
                      icon={Eye}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Action Modal */}
        <Modal
          isOpen={showActionModal}
          onClose={closeActionModal}
          title={`${actionType === 'approve' ? 'Approve' : 'Deny'} Resource Request`}
        >
          {selectedResource && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900">{selectedResource.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Requested by {selectedResource.requestedByName}
                </p>
              </div>

              {actionType === 'deny' && (
                <Textarea
                  label="Reason for Denial *"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Please provide a clear reason for denying this request..."
                  rows={4}
                  helperText="This reason will be shared with the requester"
                />
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAction}
                  loading={actionLoading}
                  className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                  variant={actionType === 'deny' ? 'danger' : 'primary'}
                >
                  {actionType === 'approve' ? 'Approve Request' : 'Deny Request'}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeActionModal}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}