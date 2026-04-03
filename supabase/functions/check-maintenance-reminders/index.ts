import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Get notification settings
    const { data: settings } = await supabase.from('app_settings').select('*')
    const settingsMap: Record<string, string> = {}
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value })

    const notificationEmail = settingsMap['notification_email']
    const notificationPhone = settingsMap['notification_phone']

    if (!notificationEmail && !notificationPhone) {
      return new Response(JSON.stringify({ message: 'No notification recipients configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Get all machines
    const { data: machines } = await supabase.from('machines').select('*')
    const { data: clients } = await supabase.from('clients').select('*')
    const { data: interventions } = await supabase
      .from('interventions')
      .select('*')
      .eq('status', 'terminee')
      .order('date', { ascending: false })

    const today = new Date()
    const overdueMachines: Array<{
      machineName: string
      model: string
      clientName: string
      clientPhone: string
      daysOverdue: number
      lastMaintenance: string
    }> = []

    for (const machine of machines || []) {
      const machineInterventions = (interventions || []).filter(
        (i: any) => i.machine_id === machine.id || (i.machine_ids && i.machine_ids.includes(machine.id))
      )
      const lastDate = machineInterventions[0]?.date ?? machine.install_date
      const intervalDays = machine.maintenance_interval_days ?? 365

      if (!lastDate) continue

      const dueDate = new Date(lastDate)
      dueDate.setDate(dueDate.getDate() + intervalDays)

      if (today > dueDate) {
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        const client = (clients || []).find((c: any) => c.id === machine.client_id)

        overdueMachines.push({
          machineName: machine.name,
          model: machine.model || '',
          clientName: client?.name || 'Client inconnu',
          clientPhone: client?.phone || '',
          daysOverdue,
          lastMaintenance: lastDate,
        })
      }
    }

    if (overdueMachines.length === 0) {
      return new Response(JSON.stringify({ message: 'No overdue machines' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Sort by most overdue
    overdueMachines.sort((a, b) => b.daysOverdue - a.daysOverdue)

    const results: string[] = []

    // Send email notification
    if (notificationEmail) {
      const machineList = overdueMachines
        .map(m => `• ${m.machineName} (${m.model}) — ${m.clientName} — +${m.daysOverdue} jours (dernière: ${m.lastMaintenance})`)
        .join('\n')

      const htmlList = overdueMachines
        .map(m => `<li><strong>${m.machineName}</strong> (${m.model}) — ${m.clientName} — <span style="color:red">+${m.daysOverdue} jours</span> (dernière: ${m.lastMaintenance})</li>`)
        .join('')

      const html = `
        <h2>⚠️ Rappel Maintenance — ${overdueMachines.length} machine(s) en retard</h2>
        <ul>${htmlList}</ul>
        <p>Connectez-vous à l'application pour plus de détails.</p>
      `

      // Use Lovable AI to send email via edge function invoke
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-maintenance-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            to: notificationEmail,
            subject: `⚠️ ${overdueMachines.length} machine(s) en retard de maintenance`,
            html,
          }),
        })
        results.push(`Email: ${emailResponse.ok ? 'sent' : 'failed'}`)
      } catch (e) {
        results.push(`Email: error - ${e.message}`)
      }
    }

    // Send SMS notification via Twilio (if configured)
    if (notificationPhone) {
      const twilioApiKey = Deno.env.get('TWILIO_API_KEY')
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

      if (twilioApiKey && lovableApiKey) {
        const smsBody = `⚠️ Rappel Maintenance: ${overdueMachines.length} machine(s) en retard. ` +
          overdueMachines.slice(0, 3).map(m => `${m.machineName} (${m.clientName}, +${m.daysOverdue}j)`).join(', ') +
          (overdueMachines.length > 3 ? ` et ${overdueMachines.length - 3} autre(s)` : '')

        try {
          const smsResponse = await fetch('https://connector-gateway.lovable.dev/twilio/Messages.json', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'X-Connection-Api-Key': twilioApiKey,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: notificationPhone,
              From: Deno.env.get('TWILIO_FROM_NUMBER') || '',
              Body: smsBody,
            }),
          })
          results.push(`SMS: ${smsResponse.ok ? 'sent' : 'failed'}`)
        } catch (e) {
          results.push(`SMS: error - ${e.message}`)
        }
      } else {
        results.push('SMS: Twilio not configured')
      }
    }

    return new Response(JSON.stringify({
      overdueMachines: overdueMachines.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
