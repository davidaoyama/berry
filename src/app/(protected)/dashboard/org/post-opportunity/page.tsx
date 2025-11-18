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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
    router.push('/dashboard/org')
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at top, rgba(82,178,191,0.12), transparent 55%), radial-gradient(circle at bottom, rgba(247,127,190,0.12), transparent 55%), var(--background)'
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Top heading */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Organization • Post Opportunity
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-gray-900">
            Post a new <span style={{ color: 'var(--berry-blue)' }}>opportunity</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl">
            Share an enrichment opportunity with LAUSD students. Clear details help the right students
            discover and apply.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 flex gap-3">
            <span className="mt-0.5">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>{error}</span>
          </div>
        )}

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm rounded-2xl px-4 py-6 sm:px-8 sm:py-8 space-y-8"
        >
          {/* Section: Basics */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Basics</h2>
              <p className="text-xs text-gray-500">
                Required details students see first.
              </p>
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="opportunityName" className="block text-sm font-medium text-gray-800 mb-1.5">
                  Opportunity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="opportunityName"
                  name="opportunityName"
                  required
                  value={formData.opportunityName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  placeholder="e.g., Summer Research Internship"
                />
              </div>

              {/* Category + Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="opportunityType" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Type of Enrichment Opportunity <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="opportunityType"
                    name="opportunityType"
                    required
                    value={formData.opportunityType}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  >
                    <option value="">Select opportunity type</option>
                    {OPPORTUNITY_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-800 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Location */}
          <section className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Location</h2>
              <p className="text-xs text-gray-500">Tell students where and how they’ll participate.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="locationType" className="block text-sm font-medium text-gray-800 mb-1.5">
                  Location Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="locationType"
                  name="locationType"
                  required
                  value={formData.locationType}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                >
                  <option value="">Select location type</option>
                  {LOCATION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.locationType === 'in_person' || formData.locationType === 'hybrid') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-800 mb-1.5">
                      Physical Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="locationAddress"
                      name="locationAddress"
                      required
                      value={formData.locationAddress}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                      placeholder="e.g., 123 Main St, Los Angeles, CA 90001"
                    />
                  </div>
                  <div>
                    <label htmlFor="locationState" className="block text-sm font-medium text-gray-800 mb-1.5">
                      State
                    </label>
                    <select
                      id="locationState"
                      name="locationState"
                      value={formData.locationState}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                    >
                      <option value="">Select a state (optional)</option>
                      {US_STATES.map(state => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section: Requirements */}
          <section className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
                <p className="text-xs text-gray-500">
                  Optional filters that help students see if they’re a good match.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* GPA */}
              <div className="max-w-xs">
                <label htmlFor="minGpa" className="block text-sm font-medium text-gray-800 mb-1.5">
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  placeholder="e.g., 3.5"
                />
              </div>

              {/* Age range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
                <div>
                  <label htmlFor="minAge" className="block text-sm font-medium text-gray-800 mb-1.5">
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                    placeholder="e.g., 16"
                  />
                </div>
                <div>
                  <label htmlFor="maxAge" className="block text-sm font-medium text-gray-800 mb-1.5">
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                    placeholder="e.g., 18"
                  />
                </div>
              </div>

              {/* Grade levels */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  Grade Levels
                </label>
                <p className="text-[11px] text-gray-500 mb-2">Select all that apply.</p>
                <div className="grid grid-cols-7 sm:grid-cols-13 gap-2 max-w-lg">
                  {GRADE_LEVELS.map(grade => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => handleGradeLevelToggle(grade)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        formData.gradeLevels.includes(grade)
                          ? 'bg-[var(--berry-blue)] text-white border-[var(--berry-blue)]'
                          : 'bg-white text-gray-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other requirements */}
              <div>
                <label htmlFor="requirementsOther" className="block text-sm font-medium text-gray-800 mb-1.5">
                  Other Requirements
                </label>
                <textarea
                  id="requirementsOther"
                  name="requirementsOther"
                  rows={3}
                  value={formData.requirementsOther}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  placeholder="e.g., California resident, specific skills, recommendations, etc."
                />
              </div>
            </div>
          </section>

          {/* Section: Cost & deadline */}
          <section className="space-y-6 border-t border-slate-100 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-800 mb-1.5">
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  placeholder="0 for free opportunities"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="hasStipend"
                    checked={formData.hasStipend}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-slate-300 text-[var(--berry-blue)] focus:ring-[var(--berry-cyan)]"
                  />
                  This opportunity provides a stipend
                </label>
              </div>

              <div>
                <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-800 mb-1.5">
                  Application Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="applicationDeadline"
                  name="applicationDeadline"
                  required
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Section: Description & links */}
          <section className="space-y-6 border-t border-slate-100 pt-6">
            <div>
              <label htmlFor="briefDescription" className="block text-sm font-medium text-gray-800 mb-1.5">
                Brief Description <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-500 mb-2">
                This is what students will read when browsing — keep it concrete and student-friendly.
              </p>
              <textarea
                id="briefDescription"
                name="briefDescription"
                required
                rows={5}
                value={formData.briefDescription}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                placeholder="Describe what students will do, learn, and why this opportunity matters..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="applicationUrl" className="block text-sm font-medium text-gray-800 mb-1.5">
                  Formal Application Link or Website URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="applicationUrl"
                  name="applicationUrl"
                  required
                  value={formData.applicationUrl}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  placeholder="https://example.org/apply"
                />
              </div>

              <div>
                <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-800 mb-1.5">
                  Contact Information <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Where students or families can send questions.
                </p>
                <input
                  type="text"
                  id="contactInfo"
                  name="contactInfo"
                  required
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--berry-cyan)] focus:border-transparent"
                  placeholder="e.g., contact@organization.org or (555) 123-4567"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="button ghost w-full sm:w-auto justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="button w-full sm:w-auto justify-center disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Opportunity'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Submission received!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your opportunity is now available for students to discover and apply.
              </p>
              <button
                onClick={handleSuccessClose}
                className="button w-full justify-center"
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
