-- The pipeline board used to save "Need Analysis" while the rest of the app
-- expects "Needs Analysis". Normalise any existing rows to the single name.
update public.crm_leads set lead_stage = 'Needs Analysis' where lead_stage = 'Need Analysis';
