INSERT INTO admin_settings (
  id,
  business_name,
  admin_email,
  whatsapp_template_en,
  whatsapp_template_te
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ChitLedger Admin',
  'admin@chitledger.com',
  'Dear {member_name}, your installment for {month} is due. Total due: {total}.',
  'ప్రియమైన {member_name}, మీ {month} వాయిదా చెల్లించాల్సి ఉంది. మొత్తం: {total}.'
) ON CONFLICT (id) DO NOTHING;
