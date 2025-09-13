// Resource application form page
// Allows teachers to submit new resource requests

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Button, Input, Textarea, Card, Select } from '@/components/ui';
import { db } from '@/lib/database';
import type { ResourceCategory } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Send, AlertCircle, CheckCircle } from 'lucide-react';

// Form validation schema
const resourceApplicationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['technology', 'books', 'supplies', 'equipment', 'other'] as const),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  priority: z.enum(['low', 'medium', 'high'] as const),
  justification: z.string().min(20, 'Justification must be at least 20 characters'),
  estimatedCost: z.number().optional(),
  supplier: z.string().optional(),
});

type FormData = z.infer<typeof resourceApplicationSchema>;

export default function ApplyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(resourceApplicationSchema),
    defaultValues: {
      priority: 'medium',
      category: 'supplies',
      quantity: 1,
    },
  });

  const watchedCategory = watch('category');
  const watchedPriority = watch('priority');

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setSubmitError('You must be logged in to submit a resource request');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await db.createResource({
        title: data.title,
        description: data.description,
        category: data.category,
        status: 'pending',
        requestedBy: user.uid,
        requestedByEmail: user.email || '',
        requestedByName: user.displayName || user.email || '',
        requestedAt: new Date(),
        quantity: data.quantity,
        priority: data.priority,
        justification: data.justification,
        estimatedCost: data.estimatedCost,
        supplier: data.supplier,
      });

      setSubmitSuccess(true);
      reset();
    } catch (error) {
      console.error('Failed to submit resource request:', error);
      setSubmitError('Failed to submit resource request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'books', label: 'Books' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const getCategoryDescription = (category: ResourceCategory) => {
    switch (category) {
      case 'technology':
        return 'Computers, tablets, software, and other tech equipment';
      case 'books':
        return 'Textbooks, reference materials, and educational literature';
      case 'supplies':
        return 'Classroom materials, stationery, and consumables';
      case 'equipment':
        return 'Lab equipment, tools, and reusable classroom items';
      case 'other':
        return 'Items that don\'t fit in other categories';
      default:
        return '';
    }
  };

  const getPriorityDescription = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Critical need - required immediately for ongoing classes';
      case 'medium':
        return 'Important need - would significantly improve teaching';
      case 'low':
        return 'Nice to have - would be helpful but not urgent';
      default:
        return '';
    }
  };

  if (!user) {
    return null; // Will redirect via auth
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Resource Request Submitted!
            </h1>
            <p className="text-gray-600 mb-8">
              Your resource request has been submitted successfully and is now pending admin review. 
              You will be notified via email when a decision is made.
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => {
                  setSubmitSuccess(false);
                  reset();
                }}
                className="w-full sm:w-auto"
              >
                Submit Another Request
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/resources')}
                className="w-full sm:w-auto sm:ml-4"
              >
                View All Resources
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <PlusCircle className="h-8 w-8 mr-3 text-blue-600" />
            Apply for Resources
          </h1>
          <p className="mt-2 text-gray-600">
            Submit a request for educational resources needed for your classroom or program.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <Input
                label="Resource Title *"
                {...register('title')}
                error={errors.title?.message}
                placeholder="e.g., Classroom iPads, Lab Microscopes, Art Supplies"
                helperText="Be specific and descriptive"
              />

              <Textarea
                label="Description *"
                {...register('description')}
                error={errors.description?.message}
                placeholder="Provide a detailed description of what you need and how it will be used..."
                rows={4}
                helperText="Include model numbers, specifications, or other relevant details"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Category *"
                    {...register('category')}
                    options={categoryOptions}
                    error={errors.category?.message}
                  />
                  {watchedCategory && (
                    <p className="text-sm text-gray-500 mt-1">
                      {getCategoryDescription(watchedCategory)}
                    </p>
                  )}
                </div>

                <Input
                  label="Quantity *"
                  type="number"
                  min="1"
                  {...register('quantity', { valueAsNumber: true })}
                  error={errors.quantity?.message}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Priority and Justification */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Priority and Justification</h3>
              
              <div>
                <Select
                  label="Priority Level *"
                  {...register('priority')}
                  options={priorityOptions}
                  error={errors.priority?.message}
                />
                {watchedPriority && (
                  <p className="text-sm text-gray-500 mt-1">
                    {getPriorityDescription(watchedPriority)}
                  </p>
                )}
              </div>

              <Textarea
                label="Justification *"
                {...register('justification')}
                error={errors.justification?.message}
                placeholder="Explain why this resource is needed, how it will be used, and the educational benefit it will provide..."
                rows={5}
                helperText="Provide a compelling case for why this resource should be approved"
              />
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Estimated Cost"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('estimatedCost', { valueAsNumber: true })}
                  error={errors.estimatedCost?.message}
                  placeholder="0.00"
                  helperText="Total estimated cost (optional)"
                />

                <Input
                  label="Preferred Supplier"
                  {...register('supplier')}
                  error={errors.supplier?.message}
                  placeholder="e.g., Amazon Business, Apple Education"
                  helperText="If you have a preference (optional)"
                />
              </div>
            </div>

            {/* Application Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">Application Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All requests are subject to budget approval and availability</li>
                <li>• High-priority requests are processed first</li>
                <li>• Include detailed justification to improve approval chances</li>
                <li>• Approved resources typically take 2-4 weeks for procurement</li>
                <li>• You will be notified via email of the approval decision</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <Button
                type="submit"
                loading={isSubmitting}
                icon={Send}
                className="w-full sm:w-auto"
                size="lg"
              >
                Submit Resource Request
              </Button>
            </div>
          </form>
        </Card>

        {/* Extension points for future features */}
        {/* 
          Additional features that can be added:
          - File upload for supporting documents
          - Save as draft functionality
          - Resource templates for common requests
          - Collaboration with other teachers
          - Budget estimation calculator
          - Approval workflow preview
        */}
      </div>
    </div>
  );
}