'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' }
]

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

const CATEGORIES = [
  { value: 'stem_innovation', label: 'STEM & Innovation' },
  { value: 'arts_design', label: 'Art & Design' },
  { value: 'humanities_social_sciences', label: 'Humanities & Social Sciences' },
  { value: 'civic_engagement_leadership', label: 'Civic Engagement & Leadership' },
  { value: 'health_sports_sustainability', label: 'Health, Sports & Sustainability' },
  { value: 'business_entrepreneurship', label: 'Business & Entrepreneurship' },
  { value: 'trades_technical', label: 'Trade & Technical Careers' }
]

const OPPORTUNITY_TYPES = [
  { value: 'program', label: 'Program' },
  { value: 'summer_opportunity', label: 'Summer Opportunity' },
  { value: 'internship', label: 'Internship' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'volunteering', label: 'Volunteering' }
]

const LOCATION_TYPES = [
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'In-Person' },
  { value: 'hybrid', label: 'Hybrid' }
]

export default function EditOpportunityPage() {
  const router = useRouter()
  const params = useParams()
  const opportunityId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    opportunityName: '',
    category: '',
    opportunityType: '',
    startDate: '',
    endDate: '',
    locationType: '',
    locationAddress: '',
    locationState: '',
    minGpa: '',
    minAge: '',
    maxAge: '',
    gradeLevels: [] as string[],
    requirementsOther: '',
    cost: '0',
    hasStipend: false,
    applicationDeadline: '',
    briefDescription: '',
    applicationUrl: '',
    contactInfo: ''
  })

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunity()
    }
  }, [opportunityId])

  const fetchOpportunity = async () => {
    try {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth?mode=signin')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .eq('created_by', session.user.id)
        .single()

      if (fetchError || !data) {
        throw new Error('Opportunity not found or you do not have permission to edit it')
      }

      setFormData({
        opportunityName: data.opportunity_name || '',
        category: data.category || '',
        opportunityType: data.opportunity_type || '',
        startDate: data.start_date || '',
        endDate: data.end_date || '',
        locationType: data.location_type || '',
        locationAddress: data.location_address || '',
        locationState: data.location_state || '',
        minGpa: data.min_gpa?.toString() || '',
        minAge: data.min_age?.toString() || '',
        maxAge: data.max_age?.toString() || '',
        gradeLevels: data.grade_levels || [],
        requirementsOther: data.requirements_other || '',
        cost: data.cost?.toString() || '0',
        hasStipend: data.has_stipend || false,
        applicationDeadline: data.application_deadline || '',
        briefDescription: data.brief_description || '',
        applicationUrl: data.application_url || '',
        contactInfo: data.contact_info || ''
      })

      setLoading(false)
    } catch (err) {
      console.error('Error fetching opportunity:', err)
      setError(err instanceof Error ? err.message : 'Failed to load opportunity')
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleGradeLevelToggle = (grade: string) => {
    setFormData(prev => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(grade)
        ? prev.gradeLevels.filter(g => g !== grade)
        : [...prev.gradeLevels, grade]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('You must be signed in to edit opportunities')
      }

      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          opportunity_name: formData.opportunityName.trim(),
          brief_description: formData.briefDescription.trim(),
          category: formData.category,
          opportunity_type: formData.opportunityType,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          location_type: formData.locationType,
          location_address: formData.locationAddress?.trim() || null,
          location_state: formData.locationState || null,
          min_gpa: formData.minGpa ? parseFloat(formData.minGpa) : null,
          min_age: formData.minAge ? parseInt(formData.minAge) : null,
          max_age: formData.maxAge ? parseInt(formData.maxAge) : null,
          grade_levels: formData.gradeLevels.length > 0 ? formData.gradeLevels : null,
          requirements_other: formData.requirementsOther?.trim() || null,
          cost: parseFloat(formData.cost || '0'),
          has_stipend: formData.hasStipend,
          application_deadline: formData.applicationDeadline,
          application_url: formData.applicationUrl.trim(),
          contact_info: formData.contactInfo.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId)
        .eq('created_by', session.user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      router.push('/dashboard/org/my-opportunities')
    } catch (err) {
      console.error('Error updating opportunity:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while updating the opportunity')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--berry-blue)' }} />
      </div>
    )
  }

  if (error && !formData.opportunityName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Opportunity</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/org/my-opportunities')}
            className="button"
            style={{ background: '#ef4444' }}
          >
            Back to My Opportunities
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8"
      style={{ background: '#f3f4ff' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-1">
              Opportunities
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Edit Opportunity
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Update the details for this opportunity. Changes will be visible to students right away.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/org/my-opportunities')}
            className="button ghost"
          >
            Back to List
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form (same fields as before) */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8 space-y-8">
          <div>
            <label htmlFor="opportunityName" className="block text-sm font-medium text-gray-700 mb-2">
              Opportunity Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="opportunityName"
              name="opportunityName"
              required
              value={formData.opportunityName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="opportunityType" className="block text-sm font-medium text-gray-700 mb-2">
              Type of Enrichment Opportunity <span className="text-red-500">*</span>
            </label>
            <select
              id="opportunityType"
              name="opportunityType"
              required
              value={formData.opportunityType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select opportunity type</option>
              {OPPORTUNITY_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-2">
              Location Type <span className="text-red-500">*</span>
            </label>
            <select
              id="locationType"
              name="locationType"
              required
              value={formData.locationType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select location type</option>
              {LOCATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {(formData.locationType === 'in_person' || formData.locationType === 'hybrid') && (
            <>
              <div>
                <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Physical Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="locationAddress"
                  name="locationAddress"
                  required={formData.locationType === 'in_person' || formData.locationType === 'hybrid'}
                  value={formData.locationAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="locationState" className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  id="locationState"
                  name="locationState"
                  value={formData.locationState}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a state (optional)</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>{state.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Requirements (Optional)</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="minGpa" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum GPA
                </label>
                <input
                  type="number"
                  id="minGpa"
                  name="minGpa"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.minGpa}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="minAge" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Age
                  </label>
                  <input
                    type="number"
                    id="minAge"
                    name="minAge"
                    min="0"
                    max="100"
                    value={formData.minAge}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="maxAge" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Age
                  </label>
                  <input
                    type="number"
                    id="maxAge"
                    name="maxAge"
                    min="0"
                    max="100"
                    value={formData.maxAge}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Levels
                </label>
                <div className="grid grid-cols-7 sm:grid-cols-13 gap-2">
                  {GRADE_LEVELS.map(grade => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => handleGradeLevelToggle(grade)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        formData.gradeLevels.includes(grade)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="requirementsOther" className="block text-sm font-medium text-gray-700 mb-2">
                  Other Requirements
                </label>
                <textarea
                  id="requirementsOther"
                  name="requirementsOther"
                  rows={3}
                  value={formData.requirementsOther}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
              Cost (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="cost"
              name="cost"
              required
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="hasStipend"
                  checked={formData.hasStipend}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">This opportunity provides a stipend</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
              Application Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="applicationDeadline"
              name="applicationDeadline"
              required
              value={formData.applicationDeadline}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="briefDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Brief Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="briefDescription"
              name="briefDescription"
              required
              rows={5}
              value={formData.briefDescription}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="applicationUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Formal Application Link or Website URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="applicationUrl"
              name="applicationUrl"
              required
              value={formData.applicationUrl}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Information <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contactInfo"
              name="contactInfo"
              required
              value={formData.contactInfo}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/dashboard/org/my-opportunities')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
