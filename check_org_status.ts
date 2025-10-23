import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrgStatus() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, org_name, user_id, approved, verification_status')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Organization Status:')
  console.table(data)

  // Fix organizations where approved=true but verification_status != 'approved'
  const needsFix = data?.filter(org => org.approved && org.verification_status !== 'approved')

  if (needsFix && needsFix.length > 0) {
    console.log('\n⚠️  Found organizations that need fixing:')
    console.table(needsFix)

    console.log('\nFixing...')
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ verification_status: 'approved' })
      .eq('approved', true)
      .neq('verification_status', 'approved')

    if (updateError) {
      console.error('Error updating:', updateError)
    } else {
      console.log('✅ Fixed! Organizations with approved=true now have verification_status=approved')

      // Verify the fix
      const { data: fixed } = await supabase
        .from('organizations')
        .select('id, org_name, approved, verification_status')
        .eq('approved', true)

      console.log('\nUpdated organizations:')
      console.table(fixed)
    }
  } else {
    console.log('\n✅ All organizations are correctly configured!')
  }
}

checkOrgStatus()