-- Add dual language templates
ALTER TABLE admin_settings 
  ADD COLUMN whatsapp_template_en text NOT NULL DEFAULT 'Dear {member_name}, your installment for {month} is due. Total due: {total}.',
  ADD COLUMN whatsapp_template_te text NOT NULL DEFAULT 'ప్రియమైన {member_name}, మీ {month} వాయిదా చెల్లించాల్సి ఉంది. మొత్తం: {total}.';

ALTER TABLE admin_settings DROP COLUMN whatsapp_template;

ALTER TABLE admin_settings 
  ALTER COLUMN whatsapp_template_en DROP DEFAULT,
  ALTER COLUMN whatsapp_template_te DROP DEFAULT;
