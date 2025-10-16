'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' }
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

export default function PostOpportunityPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Form state
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
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('You must be signed in to post opportunities')
      }

      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit opportunity')
      }

      // Show success modal
      setShowSuccessModal(true)
    } catch (err) {
      console.error('Error submitting opportunity:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while submitting the opportunity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    router.push('/dashboard/org') // Redirect to org dashboard
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a New Opportunity</h1>
          <p className="mt-2 text-gray-600">
            Answer the following for the opportunity you would like to post.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8 space-y-8">
          {/* Opportunity Name */}
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
              placeholder="e.g., Summer Research Internship"
            />
          </div>

          {/* Category */}
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

          {/* Type of Enrichment Opportunity */}
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

          {/* Duration */}
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

          {/* Location Type */}
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

          {/* Conditional Location Fields */}
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
                  placeholder="e.g., 123 Main St, Los Angeles, CA 90001"
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

          {/* Requirements Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Requirements (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              These fields help students filter opportunities that match their qualifications. Leave blank if not applicable.
            </p>

            <div className="space-y-6">
              {/* GPA */}
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
                  placeholder="e.g., 3.5"
                />
              </div>

              {/* Age Range */}
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
                    placeholder="e.g., 16"
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
                    placeholder="e.g., 18"
                  />
                </div>
              </div>

              {/* Grade Levels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Levels
                </label>
                <p className="text-xs text-gray-500 mb-3">Select all that apply</p>
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

              {/* Other Requirements */}
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
                  placeholder="e.g., Must be a California resident, specific skills required, etc."
                />
              </div>
            </div>
          </div>

          {/* Cost */}
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
              placeholder="0 for free opportunities"
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

          {/* Application Deadline */}
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

          {/* Brief Description */}
          <div>
            <label htmlFor="briefDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Brief Description <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">This will be displayed to students when browsing opportunities</p>
            <textarea
              id="briefDescription"
              name="briefDescription"
              required
              rows={5}
              value={formData.briefDescription}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Describe the opportunity, what students will learn, and what makes it unique..."
            />
          </div>

          {/* Application URL */}
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
              placeholder="https://example.com/apply"
            />
          </div>

          {/* Contact Info */}
          <div>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Information <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Where students can direct questions</p>
            <input
              type="text"
              id="contactInfo"
              name="contactInfo"
              required
              value={formData.contactInfo}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., contact@organization.org or (555) 123-4567"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Opportunity'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Submission Received!</h3>
              <p className="text-sm text-gray-600 mb-6">
                Your opportunity is now live on our app. Students can discover and apply to your opportunity right away.
              </p>
              <button
                onClick={handleSuccessClose}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}