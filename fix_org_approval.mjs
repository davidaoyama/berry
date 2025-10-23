import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixOrgApproval() {
  console.log('Checking organization status...\n')

  // First, check current status
  const { data: orgs, error: fetchError } = await supabase
    .from('organizations')
    .select('id, org_name, user_id, approved, verification_status')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('Error fetching organizations:', fetchError)
    return
  }

  console.log('Current Organization Status:')
  console.table(orgs)

  // Find organizations that need fixing
  const needsFix = orgs?.filter(org => org.approved === true && org.verification_status !== 'approved')

  if (needsFix && needsFix.length > 0) {
    console.log('\n⚠️  Found', needsFix.length, 'organization(s) that need fixing:')
    needsFix.forEach(org => {
      console.log(`  - ${org.org_name}: approved=${org.approved}, verification_status=${org.verification_status}`)
    })

    console.log('\n🔧 Fixing verification_status...')

    const { data: updated, error: updateError } = await supabase
      .from('organizations')
      .update({ verification_status: 'approved' })
      .eq('approved', true)
      .neq('verification_status', 'approved')
      .select()

    if (updateError) {
      console.error('❌ Error updating:', updateError)
      return
    }

    console.log('✅ Fixed', updated?.length || 0, 'organization(s)!')

    // Verify the fix
    const { data: verified } = await supabase
      .from('organizations')
      .select('id, org_name, approved, verification_status')
      .eq('approved', true)

    console.log('\n✅ Updated organizations (approved=true):')
    console.table(verified)

    console.log('\n🎉 Done! You can now post opportunities.')
  } else {
    console.log('\n✅ All organizations are correctly configured!')
    console.log('   Organizations with approved=true already have verification_status=approved')
  }
}

fixOrgApproval().catch(console.error)