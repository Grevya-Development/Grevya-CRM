-- =====================================================================
-- Grevya CRM — initial database schema
--
-- Rebuilt from how the frontend uses Supabase (no earlier migrations existed).
-- Safe to re-run: tables/indexes use IF NOT EXISTS, constraints/policies are
-- dropped and re-created, seed rows use ON CONFLICT DO NOTHING.
--
-- How to apply: Supabase Dashboard -> SQL Editor -> paste this file -> Run.
-- =====================================================================



-- #####################################################################
-- 1. TABLES
-- #####################################################################

-- CRM core

-- evidence: src/pages/AddContact.tsx (insert/update, 23505 duplicate-name handling),
--   src/pages/ImportContacts.tsx, src/components/contacts/BulkScanModal.tsx,
--   src/pages/Contacts.tsx (embed customer:crm_customers(*), export columns),
--   src/hooks/useGrevya.ts, src/services/campaignService.ts (crm_customers!inner),
--   src/pages/Leads.tsx, src/pages/LeadDetails.tsx, src/components/ai/Ai-Assistant.tsx,
--   src/components/meetings/CreateMeetingForm.tsx, src/pages/AddLeads.tsx
create table if not exists public.crm_customers (
    id                      uuid primary key default gen_random_uuid(),
    name                    text,                       -- "Company"/customer name; code expects uniqueness (23505 -> "Duplicate Name")
    customer_type           text,                       -- 'Prospect' | 'Company' | ...
    profile_image_url       text,
    scanned_card_url        text,
    website_link            text,
    industry                text,
    gst_details             text,
    credit_limit            numeric(14,2),
    payment_terms           text,                       -- free text, not an FK
    is_multi_currency       boolean not null default false,
    linkedin_url            text,
    annual_revenue          numeric(14,2),
    sales_person_id         text,                       -- UI currently writes 'owner1'/'owner2' placeholders -> must stay text, no FK
    lead_source             text,
    priority                text,
    engagement_probability  integer,
    account_status          text default 'active',
    created_at              timestamptz not null default now(),
    updated_at              timestamptz default now(),
    constraint crm_customers_name_key unique (name)
);

-- evidence: src/pages/AddContact.tsx (upsert onConflict 'customer_id'), src/pages/AddLeads.tsx,
--   src/pages/ImportContacts.tsx, src/components/contacts/BulkScanModal.tsx,
--   src/pages/Contacts.tsx (embed addresses:crm_addresses(*) under crm_customers)
create table if not exists public.crm_addresses (
    id                uuid primary key default gen_random_uuid(),
    customer_id       uuid,
    company_address   text,
    company_city      text,
    company_state     text,
    company_country   text,
    company_zip       text,
    billing_address   text,
    billing_city      text,
    billing_state     text,
    billing_country   text,
    billing_zip       text,
    shipping_address  text,
    shipping_city     text,
    shipping_state    text,
    shipping_country  text,
    shipping_zip      text,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz default now(),
    -- REQUIRED: AddContact.tsx does .upsert([...], { onConflict: 'customer_id' })
    constraint crm_addresses_customer_id_key unique (customer_id)
);

-- evidence: src/pages/AddContact.tsx, src/pages/Contacts.tsx (order created_at, embed customer:crm_customers),
--   src/components/contacts/ContactsTable.tsx (delete), src/pages/ImportContacts.tsx,
--   src/components/contacts/BulkScanModal.tsx, src/hooks/useGrevya.ts,
--   src/services/campaignService.ts (.is('deleted_at', null), crm_customers!inner),
--   src/components/ai/Ai-Assistant.tsx
create table if not exists public.crm_contacts (
    id              uuid primary key default gen_random_uuid(),
    customer_id     uuid,
    name            text,
    designation     text,
    mobile_no       text,
    telephone       text,
    email           text,
    preferred_type  text default 'Email',
    address_type    text default 'Billing',
    contact_type    text,                      -- read in Contacts.tsx filters
    is_deleted      boolean default false,     -- typed on Customer type; harmless
    deleted_at      timestamptz,               -- campaignService filters deleted_at IS NULL
    created_at      timestamptz not null default now(),
    updated_at      timestamptz default now()
);

create sequence if not exists public.crm_leads_lead_number_seq;

-- evidence: src/pages/AddLeads.tsx (insert/update payload = full LeadFormData), src/types/index.ts (Lead),
--   src/pages/Leads.tsx (embed crm_customers(name)), src/pages/LeadDetails.tsx (embed customers:crm_customers(*)),
--   src/components/Leads/{LeadCard,LeadsListView,LeadsPipeline}.tsx, src/pages/LeadsReport.tsx (hideColumns list),
--   src/components/dashboard/{Leads,PipelineChart}.tsx, src/pages/Dashboard.tsx, src/hooks/useGrevya.ts,
--   src/components/ai/Ai-Assistant.tsx, src/pages/AddContact.tsx (count by customer_id)
create table if not exists public.crm_leads (
    id                     uuid primary key default gen_random_uuid(),
    lead_number            text default ('LD-' || lpad(nextval('public.crm_leads_lead_number_seq')::text, 5, '0')),
    subject                text,
    lead_name              text,
    customer_id            uuid,
    product_interest       text,
    email                  text,
    phone_number           text,
    lead_source            text,
    lead_priority          text,
    industry               text,
    estimated_deal_value   numeric(14,2),
    created_date           date default current_date,
    lead_score             integer,
    lead_owner_id          uuid,                 -- auth user id (from rpc get_users / auth.getUser)
    lead_assign_to_id      uuid,                 -- auth user id
    user_id                uuid,                 -- listed in LeadsReport hideColumns
    is_decision_maker      boolean default false,
    campaign_name          text,
    expected_close_date    date,
    last_contact_date      date,
    conversion_status      text default 'New',
    lost_reason            text,
    lead_stage             text default 'Qualification',
    note                   text,
    address                text,
    city                   text,
    state                  text,
    country                text,
    zip                    text,
    attachment_url         text,
    attachment_name        text,
    whatsapp_notification  boolean default false, -- listed in LeadsReport hideColumns
    email_notification     boolean default false, -- listed in LeadsReport hideColumns
    is_deleted             boolean not null default false, -- LeadDetails uses .eq('is_deleted', false)
    deleted_at             timestamptz,
    created_at             timestamptz not null default now(),
    updated_at             timestamptz default now()
);

-- evidence: src/components/Leads/LeadsPipeline.tsx (insert), src/components/Leads/Worklog.tsx (select, realtime),
--   src/pages/LeadDetails.tsx (insert), src/components/ai/Ai-Assistant.tsx
create table if not exists public.lead_logs (
    id            uuid primary key default gen_random_uuid(),
    lead_id       uuid,
    action        text,
    details       text,
    performed_by  text,            -- code writes literal strings ('Current User', 'Mitchell Admin'), NOT a uuid
    created_at    timestamptz not null default now()
);

-- evidence: src/components/contacts/ScheduleTask.tsx (insert/update/delete), src/components/contacts/TaskListView.tsx
--   (embed crm_salesperson(name)), src/components/dashboard/TasksList.tsx (embed crm_salesperson(name), eq assigned_to),
--   src/pages/AddContact.tsx (embed + realtime filter customer_id=eq.X), src/pages/LeadDetails.tsx
create table if not exists public.crm_tasks (
    id           uuid primary key default gen_random_uuid(),
    entity_id    uuid,                -- polymorphic: crm_customers.id or crm_leads.id (no FK)
    entity_type  text,                -- 'customer' | 'lead'
    customer_id  uuid,                -- only referenced by a realtime filter in AddContact.tsx; never written by code
    title        text,
    description  text,
    due_date     timestamptz,         -- written as 'YYYY-MM-DDTHH:MM' (no tz)
    assigned_to  uuid,                -- -> crm_salesperson.id (needed for embed crm_salesperson(name))
    status       text default 'pending',
    created_at   timestamptz not null default now(),
    updated_at   timestamptz default now()
);

-- evidence: src/components/meetings/CreateMeetingForm.tsx (insert), src/components/meetings/MeetingsTab.tsx
--   (select/update/delete), src/pages/MeetingSchedule.tsx, src/pages/AddContact.tsx, src/pages/LeadDetails.tsx (counts)
create table if not exists public.crm_meetings (
    id             uuid primary key default gen_random_uuid(),
    entity_id      uuid,              -- polymorphic: crm_customers.id or crm_leads.id (no FK)
    entity_type    text,              -- 'customer' | 'lead'
    subject        text,
    description    text,
    start_time     timestamptz,
    end_time       timestamptz,
    location       text,
    video_url      text,
    duration       text,              -- 'HH:MM' string computed client-side
    outcome        text,
    meeting_notes  text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz default now()
);

-- evidence: src/components/contacts/ScheduleTask.tsx (select id,name), src/components/dashboard/TasksList.tsx (eq user_id)
create table if not exists public.crm_salesperson (
    id          uuid primary key default gen_random_uuid(),
    name        text,
    email       text,
    user_id     uuid,                 -- auth user link (TasksList: .eq('user_id', uid).single())
    created_at  timestamptz not null default now()
);

-- evidence: src/pages/Profile.tsx (select/upsert/update), src/pages/Settings.tsx (select .single(), update),
--   src/components/layout/Header.tsx, src/components/communication/EmailComposer.tsx, src/pages/Leads.tsx,
--   src/pages/LeadsReport.tsx, src/components/admin/RoleManagement.tsx, src/services/salesTeamService.ts
--   (embedded as manager:crm_profile!sales_teams_manager_id_fkey and crm_profile(...) from sales_team_members),
--   src/services/salesTargetService.ts (profile:crm_profile from sales_target_members)
create table if not exists public.crm_profile (
    id              uuid primary key,   -- = auth.users.id (every query does .eq('id', user.id))
    full_name       text,
    display_name    text,
    email           text,
    phone_number    text,
    gender          text,
    dob             text,               -- Profile.tsx upserts dob: '' when empty; a date column would reject ''
    country         text,
    state           text,
    city            text,
    street_address  text,
    language        text,
    timezone        text,
    bio             text,
    avatar_url      text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz default now()
);

-- evidence (legacy "opportunities"): src/pages/AddQuotation.tsx (select *, order lead_name;
--   select '*, contacts(*)' .eq('lead_id', ...)), src/pages/LeadsActivity.tsx, src/pages/LeadsCalendar.tsx,
--   src/pages/LeadsGraph.tsx, src/pages/LeadsPivot.tsx (select *, order created_at; read id, lead_name,
--   lead_stage, estimated_deal_value, created_at)
create table if not exists public.leads (
    id                    uuid primary key default gen_random_uuid(),
    lead_id               uuid not null default gen_random_uuid(),  -- AddQuotation keys on lead_id, other pages on id
    lead_name             text,
    company_name          text,
    contact_id            uuid,              -- needed for embed contacts(*)
    lead_owner            text,              -- used as salesperson display string
    lead_source           text,
    lead_stage            text default 'Qualification',
    estimated_deal_value  numeric(14,2),
    created_at            timestamptz not null default now(),
    updated_at            timestamptz default now(),
    constraint leads_lead_id_key unique (lead_id)
);

-- evidence (legacy): src/components/communication/CommunicationHub.tsx, src/components/layout/GlobalSearch.tsx
--   (select id,name,email,company; ilike), src/pages/AddInvoice.tsx, src/pages/AddQuotation.tsx (order name),
--   embedded by invoices: contacts(name) (InvoicesManagement.tsx) and leads: contacts(*); src/types/index.ts (Contact)
create table if not exists public.contacts (
    id             uuid primary key default gen_random_uuid(),
    name           text,
    email          text,
    phone          text,
    company        text,
    position       text,
    status         text default 'lead',
    notes          text,
    geo_lat        double precision,
    geo_lng        double precision,
    geo_address    text,
    custom_fields  jsonb default '{}'::jsonb,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz default now()
);

-- evidence: src/pages/AddCompanies.tsx (insert/update form values), src/pages/Companies.tsx (order created_at,
--   delete, realtime), embedded from customers as account:companies(name) (GlobalSearch.tsx); src/types/index.ts (Company)
create table if not exists public.companies (
    id             uuid primary key default gen_random_uuid(),
    name           text not null,
    website        text,
    email          text,
    phone          text,
    industry       text,
    size           text,               -- '1-10', '11-50', ... (select)
    revenue        text,               -- revenue *range* strings e.g. '₹10 Lakhs - ₹50 Lakhs'
    contact_count  integer default 0,
    total_value    numeric(14,2) default 0,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz default now()
);

-- evidence (legacy): src/components/layout/GlobalSearch.tsx (select id, first_name, last_name, email,
--   account:companies(name)), src/pages/AddLeads.tsx (select id, first_name, last_name, email, phone)
create table if not exists public.customers (
    id          uuid primary key default gen_random_uuid(),
    first_name  text,
    last_name   text,
    email       text,
    phone       text,
    mobile_no   text,
    job_title   text,
    account_id  uuid,                  -- -> companies.id (needed for embed account:companies(name))
    created_at  timestamptz not null default now(),
    updated_at  timestamptz default now()
);

-- evidence: src/services/userSettings.ts (select settings .eq user_id; upsert onConflict 'user_id'),
--   src/pages/CampaignCreate.tsx (select settings .maybeSingle() with NO filter -> relies on RLS to return 1 row)
create table if not exists public.user_settings (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null,
    settings    jsonb not null default '{}'::jsonb,   -- {contact_columns, column_order, customer_form_fields, lead_form_fields, smtp_config}
    created_at  timestamptz not null default now(),
    updated_at  timestamptz default now(),
    constraint user_settings_user_id_key unique (user_id)
);


-- Products, quotations, invoices, payments

-- evidence: src/pages/AddProduct.tsx, src/pages/Products.tsx, src/pages/Categories.tsx,
--           src/components/categories/{CategoriesList,CategoriesTable,CreateCategories,EditCategoryModal}.tsx,
--           src/components/sales/ProductCatalog.tsx, src/types/index.ts (Category.id: number)
-- Code catches error.code '23505' on insert/update of category_name -> unique constraint.
create table if not exists public.categories (
    id            bigint generated by default as identity primary key,
    category_name text not null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz default now(),
    constraint categories_category_name_key unique (category_name)
);

-- evidence: src/pages/AddProduct.tsx, src/pages/ProductDetails.tsx, src/pages/Products.tsx,
--           src/components/sales/ProductCatalog.tsx, src/components/layout/GlobalSearch.tsx,
--           src/pages/AddQuotation.tsx, src/pages/AddInvoice.tsx, src/types/index.ts (Product.id: number; Number(id) route param)
create table if not exists public.products (
    id                 bigint generated by default as identity primary key,
    name               text not null,
    sku                text,
    description        text,
    category_id        bigint,
    base_price         numeric(14,2) default 0,
    cost               numeric(14,2) default 0,
    sales_price        numeric(14,2),
    status             text not null default 'active',   -- active | inactive | discontinued
    image_url          text,                              -- public URL from storage bucket 'product-images'
    product_type       text,
    can_be_sold        boolean default true,
    can_be_purchased   boolean default true,
    invoicing_policy   text,
    customer_taxes     text,
    internal_reference text,
    barcode            text,
    hsn_sac_code       text,
    product_tags       text[] default '{}',
    company            text,
    internal_notes     text,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz default now()
);

-- evidence: src/components/products/ProductLog.tsx, src/types/index.ts (ProductLog.id: number, product_id: number)
create table if not exists public.product_logs (
    id          bigint generated by default as identity primary key,
    product_id  bigint not null,
    user_id     uuid,                                     -- supabase.auth.getUser().id
    user_name   text,
    action      text not null default 'note',             -- created | updated | status_change | note
    content     text,
    created_at  timestamptz not null default now()
);

-- evidence: src/pages/AddQuotation.tsx (insert/update payload = ...form values), src/components/ai/Ai-Assistant.tsx,
--           src/types/index.ts (Quotation)
-- NOTE: the whole antd form is spread into the payload, so every form field name must exist as a column.
create table if not exists public.quotations (
    id                  uuid primary key default gen_random_uuid(),
    quotation_number    text,                             -- client-generated: QT-YYYYMMDD-NNNN / SO-YYYYMMDD-NNNN
    contact_id          uuid,                             -- -> public.contacts(id)
    opportunity_id      text,                             -- holds leads.lead_id (type owned by other team; kept text, no FK)
    status              text not null default 'draft',    -- draft | sent | sales_order | cancelled
    expiration_date     date,
    payment_terms       text,                             -- stores payment_terms.name (not id)
    gst_treatment       text,                             -- stores gst_treatments.name (not id)
    quotation_template  text,
    salesperson         text,                             -- free text Input (prefilled from leads.lead_owner)
    sales_team          text,                             -- free text Input
    require_signature   boolean not null default false,
    require_payment     boolean not null default false,
    payment_percentage  numeric(5,2) default 100,
    customer_reference  text,
    tags                text[] default '{}',
    delivery_date       date,
    fiscal_position     text,
    source_document     text,
    campaign            text,
    medium              text,
    source              text,
    billing_address     text,
    subtotal            numeric(14,2) default 0,
    total_tax           numeric(14,2) default 0,
    total_amount        numeric(14,2) default 0,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz default now()
);

-- evidence: src/pages/AddQuotation.tsx (delete-all + re-insert lines on every save; select '*, quotation_items(*)')
create table if not exists public.quotation_items (
    id                uuid primary key default gen_random_uuid(),
    quotation_id      uuid not null,
    item_type         text not null default 'product',    -- product | section | note
    product_id        bigint,
    product_name      text,
    description       text,
    quantity          numeric(14,3) default 0,
    unit_price        numeric(14,2) default 0,
    taxes             text,
    discount_percent  numeric(5,2) default 0,
    is_optional       boolean not null default false,
    created_at        timestamptz not null default now()
);

-- evidence: src/pages/AddQuotation.tsx (insert {quotation_id, action, details, performed_by}; realtime INSERT subscription)
create table if not exists public.quotation_logs (
    id            uuid primary key default gen_random_uuid(),
    quotation_id  uuid not null,
    action        text,                                   -- created | status_change | note | invoice_created
    details       text,
    performed_by  text,                                   -- display name string ('Mitchell Admin'), not a uuid
    created_at    timestamptz not null default now()
);

-- evidence: src/pages/AddInvoice.tsx, src/pages/AddQuotation.tsx (handleCreateInvoice insert),
--           src/components/sales/InvoicesManagement.tsx (select '*, contacts(name)'), src/types/index.ts (Invoice)
create table if not exists public.invoices (
    id                 uuid primary key default gen_random_uuid(),
    invoice_number     text,                              -- client-generated: INV/YYYY/NNNNN
    quotation_id       uuid,
    contact_id         uuid,                              -- -> public.contacts(id)  (embedded as contacts(name))
    status             text not null default 'draft',     -- draft | posted | paid | cancelled
    invoice_date       date,
    payment_reference  text,
    payment_terms      text,
    currency           text default 'INR',
    journal            text,
    salesperson        text,
    customer_reference text,
    subtotal           numeric(14,2) default 0,
    total_tax          numeric(14,2) default 0,
    total_amount       numeric(14,2) default 0,
    amount_due         numeric(14,2) default 0,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz default now()
);

-- evidence: src/pages/AddQuotation.tsx (insert), src/pages/AddInvoice.tsx (select '*, invoice_items(*)'), src/types/index.ts (InvoiceItem)
create table if not exists public.invoice_items (
    id                uuid primary key default gen_random_uuid(),
    invoice_id        uuid not null,
    product_id        bigint,
    product_name      text,
    description       text,
    quantity          numeric(14,3) default 1,
    unit_price        numeric(14,2) default 0,
    taxes             text,
    discount_percent  numeric(5,2) default 0,
    total             numeric(14,2) default 0,
    created_at        timestamptz not null default now()
);

-- evidence: src/pages/AddInvoice.tsx (addLog insert; realtime INSERT subscription), src/pages/AddQuotation.tsx
create table if not exists public.invoice_logs (
    id            uuid primary key default gen_random_uuid(),
    invoice_id    uuid not null,
    action        text,                                   -- created | status_change | payment | note
    details       text,
    performed_by  text,
    created_at    timestamptz not null default now()
);

-- evidence: src/pages/AddInvoice.tsx (handleCreatePayment insert), src/types/index.ts (Payment)
create table if not exists public.payments (
    id              uuid primary key default gen_random_uuid(),
    invoice_id      uuid not null,
    journal         text,                                 -- bank | cash
    payment_method  text default 'manual',
    amount          numeric(14,2) not null default 0,
    payment_date    date default current_date,
    memo            text,
    created_at      timestamptz not null default now()
);

-- evidence: src/components/settings/PaymentTermsSettings.tsx (CRUD, order by days), src/pages/AddQuotation.tsx (dropdown)
create table if not exists public.payment_terms (
    id           uuid primary key default gen_random_uuid(),
    name         text not null,
    description  text,
    days         integer not null default 0,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz default now(),
    constraint payment_terms_name_key unique (name)
);

-- evidence: src/components/settings/GstTreatmentSettings.tsx (CRUD, order by name), src/pages/AddQuotation.tsx (dropdown)
create table if not exists public.gst_treatments (
    id           uuid primary key default gen_random_uuid(),
    name         text not null,
    description  text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz default now(),
    constraint gst_treatments_name_key unique (name)
);


-- Email & campaigns
-- evidence: src/pages/EmailTemplates.tsx, src/pages/TemplateWizard.tsx,
--           src/components/admin/TemplateForm.tsx,
--           src/components/communication/EmailComposer.tsx,
--           src/pages/CampaignCreate.tsx, src/test/pages/EmailTemplates.test.tsx
create table if not exists public.email_templates (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid,                                   -- auth.users(id); set from session on save
    name         text not null,                          -- always supplied (validated in UI)
    subject      text,                                   -- UI calls t.subject.toLowerCase() -> keep non-null in practice
    body         text default '',                        -- exported HTML
    editor_json  jsonb,                                  -- Unlayer design JSON or legacy block array
    layout_type  text default 'single_column',           -- 'single_column' | 'hero_focus' | ...
    category     text default 'general',                 -- general|leads|customers|product|newsletter|promotional
    status       text not null default 'active'
                 check (status in ('active','inactive')),-- 'inactive' = draft/autosave
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- evidence: src/services/campaignService.ts (getSegments, saveSegment,
--           resolveAndSaveRecipients), src/pages/CampaignCreate.tsx,
--           src/types/index.ts (AudienceSegment)
create table if not exists public.audience_segments (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid,                               -- auth.users(id)
    name             text not null,
    filters          jsonb not null default '{}'::jsonb, -- {industry[], priority[], lead_source[], account_status, minRevenue, maxRevenue}
    is_dynamic       boolean not null default true,
    recipient_count  integer not null default 0,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

-- evidence: src/services/campaignService.ts, src/pages/Campaigns.tsx,
--           src/pages/CampaignCreate.tsx, src/pages/CampaignDetails.tsx,
--           src/types/index.ts (EmailCampaign), src/test/pages/Campaigns.test.tsx
create table if not exists public.email_campaigns (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid,                               -- auth.users(id); always set by saveCampaign
    name             text not null,                      -- validated before save
    description      text,
    segment_id       uuid,                               -- FK audience_segments (embedded as segment:audience_segments(*)); null = all contacts / uploaded list
    template_id      uuid,                               -- FK email_templates
    status           text not null default 'draft',      -- draft|scheduled|sending|sent|failed (no CHECK: mailer may write others)
    subject          text,
    preview_text     text,
    sender_name      text,
    sender_email     text,
    reply_to         text,
    scheduled_at     timestamptz,                        -- client sends 'YYYY-MM-DDTHH:MM:00' (no TZ)
    manual_contacts  jsonb default '[]'::jsonb,          -- snapshot array [{id?, name, email}] written on every save
    delivered_rate   numeric(5,2) default 0,             -- read-only in UI (set by mailer/backend)
    open_rate        numeric(5,2) default 0,
    click_rate       numeric(5,2) default 0,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

-- evidence: src/services/campaignService.ts (saveManualRecipients,
--           getCampaignRecipients, recipients:campaign_recipients(count)),
--           src/pages/CampaignDetails.tsx, src/types/index.ts (CampaignRecipient)
create table if not exists public.campaign_recipients (
    id               uuid primary key default gen_random_uuid(),
    campaign_id      uuid not null,                      -- FK email_campaigns
    user_id          uuid,                               -- auth.users(id); "Required for RLS insert"
    contact_id       uuid,                               -- FK crm_contacts; null for uploaded CSV contacts
    email            text not null,
    name             text,
    status           text not null default 'pending',    -- pending|sent|opened|clicked|bounced|unsubscribed (no CHECK: mailer-written)
    error_message    text,
    sent_at          timestamptz,
    opened_at        timestamptz,
    clicked_at       timestamptz,
    unsubscribed_at  timestamptz,
    created_at       timestamptz not null default now()
);

-- evidence: src/services/emailService.ts (getEmailHistory, updateEmailStatus),
--           src/components/admin/EmailSettings.tsx (activity tab),
--           src/components/communication/CommunicationHub.tsx
-- NOTE: this is SENT/RECEIVED EMAIL HISTORY, not SMTP settings (see report).
create table if not exists public.email_data (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid,                                 -- auth.users(id)
    contact_id     uuid,                                 -- POLYMORPHIC: lead / contact / customer id -> no FK
    record_type    text,                                 -- (guess) 'contact' | 'other' (sent to mailer)
    record_id      uuid,                                 -- (guess) mirrors contact_id
    direction      text default 'outbound',              -- 'outbound' | 'inbound'
    from_email     text,
    to_email       text,
    cc             text,
    subject        text,
    body           text,                                 -- HTML
    status         text not null default 'pending',      -- pending|sent|delivered|failed
    error_message  text,
    attachments    jsonb default '[]'::jsonb,
    message_id     text,                                 -- (guess) for threading/replies
    in_reply_to    text,                                 -- (guess)
    "references"   text,                                 -- (guess) quoted: reserved word
    created_at     timestamptz not null default now()
);

-- evidence: src/components/admin/EmailSettings.tsx (audit tab: fetchAuditLogs)
create table if not exists public.email_logs (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid,                            -- (guess) auth.users(id)
    from_email          text,                            -- (guess)
    recipient_email     text,
    subject             text,
    content             text,                            -- HTML body shown in audit viewer
    status              text not null default 'sent',    -- UI calls status.toUpperCase() -> must be non-null
    error_message       text,
    attachment_count    integer not null default 0,
    attachment_details  jsonb default '[]'::jsonb,       -- [{name, size}]
    message_id          text,                            -- (guess)
    sent_at             timestamptz not null default now(),
    created_at          timestamptz not null default now()
);

-- evidence: src/pages/IncomingEmails.tsx (Email interface, markAsRead)
create table if not exists public.incoming_emails (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid,                               -- (guess) auth.users(id) owner of synced IMAP mailbox
    message_id       text,
    from_email       text,
    from_name        text,
    to_email         text,
    subject          text,
    body_text        text,
    body_html        text,
    received_at      timestamptz not null default now(),
    is_read          boolean not null default false,
    has_attachments  boolean not null default false,
    in_reply_to      text,
    "references"     text,                               -- quoted: reserved word
    thread_id        text,
    created_at       timestamptz not null default now()
);


-- Roles, permissions, sales teams & targets

-- evidence: src/components/admin/RoleManagement.tsx fetchRoles():
--   .from('roles').select('id, name, description, role_permissions(permission_id), user_roles(count)').order('order')
--   insert/update {name, description}; delete .eq('id', roleId)
-- evidence: Dashboard.tsx / Leads.tsx / PipelineChart.tsx / LeadsReport.tsx compare roles.name to
--   "Admin" / "Super Admin" (exact, case-sensitive) to decide whether to see ALL crm_leads.
-- "order" column is required because of .order('order'); insert never sets it -> nullable.
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  "order"     integer,
  created_at  timestamptz not null default now(),
  constraint roles_name_key unique (name)
);

-- evidence: RoleManagement.tsx fetchPermissions(): .from('permissions').select('*').order('module');
--   label = `${p.action} ${p.module}`, grouped by module.
-- evidence: src/api/permissionApi.ts embeds permission:permissions(module, action)
-- evidence: src/contexts/PermissionContext.tsx actions: Create, Read, Read_All, Update, Update_All,
--   Delete, Delete_All (exact strings, case-sensitive); module compared lower-cased.
create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  module      text not null,
  action      text not null,
  description text,
  created_at  timestamptz not null default now(),
  constraint permissions_module_action_key unique (module, action)
);

-- evidence: RoleManagement.tsx: .from('role_permissions').delete().eq('role_id', roleId);
--   .insert(rows {role_id, permission_id}); roles embed role_permissions(permission_id)
-- evidence: permissionApi.ts: role:roles(role_permissions(permission:permissions(module, action)))
create table if not exists public.role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null,
  permission_id uuid not null,
  created_at    timestamptz not null default now(),
  constraint role_permissions_role_id_permission_id_key unique (role_id, permission_id)
);

-- evidence: RoleManagement.tsx: .from('user_roles').select('user_id, role_id');
--   assignRole: delete().eq('user_id', userId) then insert({user_id, role_id})  -> one role per user
-- evidence: permissionApi.ts: .from('user_roles').select('role:roles(role_permissions(permission:permissions(module,action)))').eq('user_id', uid)
-- evidence: Dashboard.tsx, Leads.tsx, PipelineChart.tsx, LeadsReport.tsx, Settings.tsx, Profile.tsx:
--   .from('user_roles').select('roles(name)').eq('user_id', uid).single()   -> must be exactly 1 row
-- evidence: roles embed user_roles(count)
create table if not exists public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  role_id    uuid not null,
  created_at timestamptz not null default now(),
  constraint user_roles_user_id_key unique (user_id)
);

-- evidence: src/services/salesTeamService.ts + src/types/index.ts SalesTeam
--   {id: string, name, manager_id: string, status: 'Active'|'Inactive', created_at, updated_at}
--   insert {name, manager_id, status default 'Active'}; update {..., updated_at}
--   error code '23505' => "A sales team with this name already exists."  -> UNIQUE(name)
--   select embeds manager:crm_profile!sales_teams_manager_id_fkey(full_name, avatar_url)
--   -> FK constraint MUST be named sales_teams_manager_id_fkey and point at crm_profile.
create table if not exists public.sales_teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  manager_id uuid,
  status     text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_teams_name_key unique (name),
  constraint sales_teams_status_check check (status in ('Active', 'Inactive'))
);

-- evidence: salesTeamService.ts: insert rows {team_id, user_id}; delete().eq('team_id', teamId)
--   sales_teams embeds members:sales_team_members(user_id, crm_profile(full_name, avatar_url))
--   -> exactly one FK sales_team_members -> sales_teams, and one FK sales_team_members -> crm_profile
-- evidence: types SalesTeamMember {id, team_id, user_id, created_at}
create table if not exists public.sales_team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null,
  user_id    uuid not null,
  created_at timestamptz not null default now(),
  constraint sales_team_members_team_id_user_id_key unique (team_id, user_id)
);

-- evidence: salesTargetService.ts SalesTarget interface + insert/update payload:
--   {name, team_id, target_type, target_value(number, parseFloat), start_date, end_date, period,
--    status 'On Track'|'At Risk'|'Achieved' (insert sets 'On Track'), updated_at}
--   select embeds team:sales_teams(name, manager:crm_profile!sales_teams_manager_id_fkey(...))
-- evidence: src/components/settings/SalesTargetDrawer.tsx: target_type in Revenue|Lead|Products|Service,
--   period in Monthly|Quarterly|Yearly; start/end are <input type=date> strings -> date
create table if not exists public.sales_targets (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  team_id      uuid,
  target_type  text,
  target_value numeric(14,2) not null default 0,
  start_date   date,
  end_date     date,
  period       text,
  status       text not null default 'On Track',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- evidence: salesTargetService.ts: insert rows {target_id, user_id, target_value};
--   delete().eq('target_id', id); update({target_value}).eq('id', memberId)
--   sales_targets embeds members:sales_target_members(id, user_id, target_value, profile:crm_profile(full_name, avatar_url))
--   -> exactly one FK sales_target_members -> crm_profile
create table if not exists public.sales_target_members (
  id           uuid primary key default gen_random_uuid(),
  target_id    uuid not null,
  user_id      uuid not null,
  target_value numeric(14,2) not null default 0,
  created_at   timestamptz not null default now(),
  constraint sales_target_members_target_id_user_id_key unique (target_id, user_id)
);

-- evidence: salesTeamService.ts logAudit(): insert {team_id (nullable), user_id: auth user id,
--   action: 'create'|'update'|'reactivate'|'deactivate', details: object}
-- evidence: types SalesTeamAuditLog {id, team_id: string|null, user_id, action, details: any, created_at}
create table if not exists public.sales_team_audit_logs (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid,
  user_id    uuid,
  action     text not null,
  details    jsonb,
  created_at timestamptz not null default now()
);


-- Master data lookups (Settings -> Masters). evidence: src/pages/MasterDetails.tsx
-- Each stores a reusable dropdown value: select * order by created_at, insert {value, is_active},
-- update value / is_active by id, delete by id.
do $$
declare t text;
begin
  foreach t in array array['m_customer_titles','m_customer_comm_prefs','m_customer_contact_types',
                           'm_customer_statuses','m_customer_lead_sources'] loop
    execute format('create table if not exists public.%I (
        id         uuid primary key default gen_random_uuid(),
        value      text not null,
        is_active  boolean not null default true,
        created_at timestamptz not null default now()
    )', t);
  end loop;
end $$;


-- #####################################################################
-- 2. FOREIGN KEYS
-- #####################################################################


-- crm_addresses.customer_id -> crm_customers  (embed: crm_customers -> addresses:crm_addresses(*))
alter table public.crm_addresses drop constraint if exists crm_addresses_customer_id_fkey;
alter table public.crm_addresses
    add constraint crm_addresses_customer_id_fkey
    foreign key (customer_id) references public.crm_customers(id) on delete cascade;

-- crm_contacts.customer_id -> crm_customers  (embed: customer:crm_customers(...), crm_customers!inner(...))
alter table public.crm_contacts drop constraint if exists crm_contacts_customer_id_fkey;
alter table public.crm_contacts
    add constraint crm_contacts_customer_id_fkey
    foreign key (customer_id) references public.crm_customers(id) on delete cascade;

-- crm_leads.customer_id -> crm_customers  (embed: crm_customers(name), customers:crm_customers(*), customer:crm_customers(name))
alter table public.crm_leads drop constraint if exists crm_leads_customer_id_fkey;
alter table public.crm_leads
    add constraint crm_leads_customer_id_fkey
    foreign key (customer_id) references public.crm_customers(id) on delete set null;

alter table public.crm_leads drop constraint if exists crm_leads_lead_owner_id_fkey;
alter table public.crm_leads
    add constraint crm_leads_lead_owner_id_fkey
    foreign key (lead_owner_id) references auth.users(id) on delete set null;

alter table public.crm_leads drop constraint if exists crm_leads_lead_assign_to_id_fkey;
alter table public.crm_leads
    add constraint crm_leads_lead_assign_to_id_fkey
    foreign key (lead_assign_to_id) references auth.users(id) on delete set null;

alter table public.crm_leads drop constraint if exists crm_leads_user_id_fkey;
alter table public.crm_leads
    add constraint crm_leads_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

-- lead_logs.lead_id -> crm_leads (child/log rows)
alter table public.lead_logs drop constraint if exists lead_logs_lead_id_fkey;
alter table public.lead_logs
    add constraint lead_logs_lead_id_fkey
    foreign key (lead_id) references public.crm_leads(id) on delete cascade;

-- crm_tasks.assigned_to -> crm_salesperson  (embed: crm_salesperson(name))
alter table public.crm_tasks drop constraint if exists crm_tasks_assigned_to_fkey;
alter table public.crm_tasks
    add constraint crm_tasks_assigned_to_fkey
    foreign key (assigned_to) references public.crm_salesperson(id) on delete set null;

alter table public.crm_tasks drop constraint if exists crm_tasks_customer_id_fkey;
alter table public.crm_tasks
    add constraint crm_tasks_customer_id_fkey
    foreign key (customer_id) references public.crm_customers(id) on delete cascade;

alter table public.crm_salesperson drop constraint if exists crm_salesperson_user_id_fkey;
alter table public.crm_salesperson
    add constraint crm_salesperson_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

-- crm_profile.id = auth.users.id
alter table public.crm_profile drop constraint if exists crm_profile_id_fkey;
alter table public.crm_profile
    add constraint crm_profile_id_fkey
    foreign key (id) references auth.users(id) on delete cascade;

-- leads.contact_id -> contacts  (embed: leads -> contacts(*))
alter table public.leads drop constraint if exists leads_contact_id_fkey;
alter table public.leads
    add constraint leads_contact_id_fkey
    foreign key (contact_id) references public.contacts(id) on delete set null;

-- customers.account_id -> companies  (embed: account:companies(name))
alter table public.customers drop constraint if exists customers_account_id_fkey;
alter table public.customers
    add constraint customers_account_id_fkey
    foreign key (account_id) references public.companies(id) on delete set null;

alter table public.user_settings drop constraint if exists user_settings_user_id_fkey;
alter table public.user_settings
    add constraint user_settings_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- ---------------------------------------------------------------------
-- FKs owned by OTHER teams' tables that point INTO this group (for coordination only;
-- left commented so this file runs before those tables exist):
--
-- sales_teams.manager_id -> crm_profile(id) MUST be named exactly sales_teams_manager_id_fkey
--   (salesTeamService/salesTargetService embed manager:crm_profile!sales_teams_manager_id_fkey)
-- alter table public.sales_teams add constraint sales_teams_manager_id_fkey
--     foreign key (manager_id) references public.crm_profile(id) on delete set null;
-- sales_team_members.user_id -> crm_profile(id)   (embed crm_profile(full_name, avatar_url))
-- alter table public.sales_team_members add constraint sales_team_members_user_id_fkey
--     foreign key (user_id) references public.crm_profile(id) on delete cascade;
-- sales_target_members.user_id -> crm_profile(id) (embed profile:crm_profile(...))
-- alter table public.sales_target_members add constraint sales_target_members_user_id_fkey
--     foreign key (user_id) references public.crm_profile(id) on delete cascade;
-- invoices.contact_id -> contacts(id)             (embed contacts(name) in InvoicesManagement.tsx)
-- quotations.contact_id -> contacts(id)
-- campaign_recipients.contact_id -> crm_contacts(id) (campaignService builds recipients from crm_contacts)
-- quotations.opportunity_id -> leads(lead_id)      (AddQuotation sets opportunity_id = lead.lead_id)
-- ---------------------------------------------------------------------


-- products.category_id -> categories   (embedded: categories(category_name) and categories:category_id(category_name))
alter table public.products drop constraint if exists products_category_id_fkey;
alter table public.products add constraint products_category_id_fkey
    foreign key (category_id) references public.categories(id) on delete set null;

-- product_logs
alter table public.product_logs drop constraint if exists product_logs_product_id_fkey;
alter table public.product_logs add constraint product_logs_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;

alter table public.product_logs drop constraint if exists product_logs_user_id_fkey;
alter table public.product_logs add constraint product_logs_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

-- quotations.contact_id -> contacts (other team)
alter table public.quotations drop constraint if exists quotations_contact_id_fkey;
alter table public.quotations add constraint quotations_contact_id_fkey
    foreign key (contact_id) references public.contacts(id) on delete set null;

-- quotation_items (embedded: quotation_items(*))
alter table public.quotation_items drop constraint if exists quotation_items_quotation_id_fkey;
alter table public.quotation_items add constraint quotation_items_quotation_id_fkey
    foreign key (quotation_id) references public.quotations(id) on delete cascade;

alter table public.quotation_items drop constraint if exists quotation_items_product_id_fkey;
alter table public.quotation_items add constraint quotation_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete set null;

-- quotation_logs
alter table public.quotation_logs drop constraint if exists quotation_logs_quotation_id_fkey;
alter table public.quotation_logs add constraint quotation_logs_quotation_id_fkey
    foreign key (quotation_id) references public.quotations(id) on delete cascade;

-- invoices
alter table public.invoices drop constraint if exists invoices_quotation_id_fkey;
alter table public.invoices add constraint invoices_quotation_id_fkey
    foreign key (quotation_id) references public.quotations(id) on delete set null;

-- invoices.contact_id -> contacts (other team)  (embedded: contacts(name) in InvoicesManagement)
alter table public.invoices drop constraint if exists invoices_contact_id_fkey;
alter table public.invoices add constraint invoices_contact_id_fkey
    foreign key (contact_id) references public.contacts(id) on delete set null;

-- invoice_items (embedded: invoice_items(*))
alter table public.invoice_items drop constraint if exists invoice_items_invoice_id_fkey;
alter table public.invoice_items add constraint invoice_items_invoice_id_fkey
    foreign key (invoice_id) references public.invoices(id) on delete cascade;

alter table public.invoice_items drop constraint if exists invoice_items_product_id_fkey;
alter table public.invoice_items add constraint invoice_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete set null;

-- invoice_logs
alter table public.invoice_logs drop constraint if exists invoice_logs_invoice_id_fkey;
alter table public.invoice_logs add constraint invoice_logs_invoice_id_fkey
    foreign key (invoice_id) references public.invoices(id) on delete cascade;

-- payments
alter table public.payments drop constraint if exists payments_invoice_id_fkey;
alter table public.payments add constraint payments_invoice_id_fkey
    foreign key (invoice_id) references public.invoices(id) on delete cascade;

-- Optional (NOT applied): quotations.opportunity_id holds leads.lead_id. Only add if leads.lead_id
-- is a unique key and you change opportunity_id to the same type:
-- alter table public.quotations add constraint quotations_opportunity_id_fkey
--     foreign key (opportunity_id) references public.leads(lead_id) on delete set null;


-- email_templates
alter table public.email_templates drop constraint if exists email_templates_user_id_fkey;
alter table public.email_templates
    add constraint email_templates_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

-- audience_segments
alter table public.audience_segments drop constraint if exists audience_segments_user_id_fkey;
alter table public.audience_segments
    add constraint audience_segments_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- email_campaigns
alter table public.email_campaigns drop constraint if exists email_campaigns_user_id_fkey;
alter table public.email_campaigns
    add constraint email_campaigns_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- REQUIRED by embed `segment:audience_segments(*)` (must be the ONLY FK
-- between email_campaigns and audience_segments, or the embed becomes ambiguous)
alter table public.email_campaigns drop constraint if exists email_campaigns_segment_id_fkey;
alter table public.email_campaigns
    add constraint email_campaigns_segment_id_fkey
    foreign key (segment_id) references public.audience_segments(id) on delete set null;

alter table public.email_campaigns drop constraint if exists email_campaigns_template_id_fkey;
alter table public.email_campaigns
    add constraint email_campaigns_template_id_fkey
    foreign key (template_id) references public.email_templates(id) on delete set null;

-- campaign_recipients
-- REQUIRED by embed `recipients:campaign_recipients(count)` on email_campaigns
alter table public.campaign_recipients drop constraint if exists campaign_recipients_campaign_id_fkey;
alter table public.campaign_recipients
    add constraint campaign_recipients_campaign_id_fkey
    foreign key (campaign_id) references public.email_campaigns(id) on delete cascade;

alter table public.campaign_recipients drop constraint if exists campaign_recipients_user_id_fkey;
alter table public.campaign_recipients
    add constraint campaign_recipients_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- contact_id comes from crm_contacts.id (campaignService.getAllContacts / getSegmentContacts).
-- Assumes crm_contacts.id is uuid (other team).
alter table public.campaign_recipients drop constraint if exists campaign_recipients_contact_id_fkey;
alter table public.campaign_recipients
    add constraint campaign_recipients_contact_id_fkey
    foreign key (contact_id) references public.crm_contacts(id) on delete set null;

-- email_data  (contact_id intentionally has NO FK: it can hold a lead, contact or customer id)
alter table public.email_data drop constraint if exists email_data_user_id_fkey;
alter table public.email_data
    add constraint email_data_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- email_logs
alter table public.email_logs drop constraint if exists email_logs_user_id_fkey;
alter table public.email_logs
    add constraint email_logs_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- incoming_emails
alter table public.incoming_emails drop constraint if exists incoming_emails_user_id_fkey;
alter table public.incoming_emails
    add constraint incoming_emails_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

do $$
begin
  -- user_roles.role_id -> roles   (embeds: user_roles -> role:roles / roles(name); roles -> user_roles(count))
  if not exists (select 1 from pg_constraint where conname = 'user_roles_role_id_fkey') then
    alter table public.user_roles drop constraint if exists user_roles_role_id_fkey;
    alter table public.user_roles
      add constraint user_roles_role_id_fkey foreign key (role_id)
      references public.roles(id) on delete cascade;
  end if;

  -- user_roles.user_id -> auth.users
  if not exists (select 1 from pg_constraint where conname = 'user_roles_user_id_fkey') then
    alter table public.user_roles drop constraint if exists user_roles_user_id_fkey;
    alter table public.user_roles
      add constraint user_roles_user_id_fkey foreign key (user_id)
      references auth.users(id) on delete cascade;
  end if;

  -- role_permissions.role_id -> roles   (embed: roles -> role_permissions)
  if not exists (select 1 from pg_constraint where conname = 'role_permissions_role_id_fkey') then
    alter table public.role_permissions drop constraint if exists role_permissions_role_id_fkey;
    alter table public.role_permissions
      add constraint role_permissions_role_id_fkey foreign key (role_id)
      references public.roles(id) on delete cascade;
  end if;

  -- role_permissions.permission_id -> permissions   (embed: role_permissions -> permission:permissions)
  if not exists (select 1 from pg_constraint where conname = 'role_permissions_permission_id_fkey') then
    alter table public.role_permissions drop constraint if exists role_permissions_permission_id_fkey;
    alter table public.role_permissions
      add constraint role_permissions_permission_id_fkey foreign key (permission_id)
      references public.permissions(id) on delete cascade;
  end if;

  -- sales_teams.manager_id -> crm_profile  (NAME IS LOAD-BEARING: crm_profile!sales_teams_manager_id_fkey)
  if not exists (select 1 from pg_constraint where conname = 'sales_teams_manager_id_fkey') then
    alter table public.sales_teams drop constraint if exists sales_teams_manager_id_fkey;
    alter table public.sales_teams
      add constraint sales_teams_manager_id_fkey foreign key (manager_id)
      references public.crm_profile(id) on delete set null;
  end if;

  -- sales_team_members.team_id -> sales_teams   (embed: sales_teams -> members:sales_team_members)
  if not exists (select 1 from pg_constraint where conname = 'sales_team_members_team_id_fkey') then
    alter table public.sales_team_members drop constraint if exists sales_team_members_team_id_fkey;
    alter table public.sales_team_members
      add constraint sales_team_members_team_id_fkey foreign key (team_id)
      references public.sales_teams(id) on delete cascade;
  end if;

  -- sales_team_members.user_id -> crm_profile   (embed: sales_team_members -> crm_profile)
  -- Do NOT add a second FK from sales_team_members to crm_profile (would make the embed ambiguous).
  if not exists (select 1 from pg_constraint where conname = 'sales_team_members_user_id_fkey') then
    alter table public.sales_team_members drop constraint if exists sales_team_members_user_id_fkey;
    alter table public.sales_team_members
      add constraint sales_team_members_user_id_fkey foreign key (user_id)
      references public.crm_profile(id) on delete cascade;
  end if;

  -- sales_targets.team_id -> sales_teams   (embed: sales_targets -> team:sales_teams)
  if not exists (select 1 from pg_constraint where conname = 'sales_targets_team_id_fkey') then
    alter table public.sales_targets drop constraint if exists sales_targets_team_id_fkey;
    alter table public.sales_targets
      add constraint sales_targets_team_id_fkey foreign key (team_id)
      references public.sales_teams(id) on delete set null;
  end if;

  -- sales_target_members.target_id -> sales_targets   (embed: sales_targets -> members:sales_target_members)
  if not exists (select 1 from pg_constraint where conname = 'sales_target_members_target_id_fkey') then
    alter table public.sales_target_members drop constraint if exists sales_target_members_target_id_fkey;
    alter table public.sales_target_members
      add constraint sales_target_members_target_id_fkey foreign key (target_id)
      references public.sales_targets(id) on delete cascade;
  end if;

  -- sales_target_members.user_id -> crm_profile   (embed: sales_target_members -> profile:crm_profile)
  if not exists (select 1 from pg_constraint where conname = 'sales_target_members_user_id_fkey') then
    alter table public.sales_target_members drop constraint if exists sales_target_members_user_id_fkey;
    alter table public.sales_target_members
      add constraint sales_target_members_user_id_fkey foreign key (user_id)
      references public.crm_profile(id) on delete cascade;
  end if;

  -- sales_team_audit_logs.team_id -> sales_teams
  if not exists (select 1 from pg_constraint where conname = 'sales_team_audit_logs_team_id_fkey') then
    alter table public.sales_team_audit_logs drop constraint if exists sales_team_audit_logs_team_id_fkey;
    alter table public.sales_team_audit_logs
      add constraint sales_team_audit_logs_team_id_fkey foreign key (team_id)
      references public.sales_teams(id) on delete set null;
  end if;

  -- sales_team_audit_logs.user_id -> auth.users
  if not exists (select 1 from pg_constraint where conname = 'sales_team_audit_logs_user_id_fkey') then
    alter table public.sales_team_audit_logs drop constraint if exists sales_team_audit_logs_user_id_fkey;
    alter table public.sales_team_audit_logs
      add constraint sales_team_audit_logs_user_id_fkey foreign key (user_id)
      references auth.users(id) on delete set null;
  end if;
end $$;



-- #####################################################################
-- 3. INDEXES
-- #####################################################################

create index if not exists crm_contacts_customer_id_idx   on public.crm_contacts (customer_id);
create index if not exists crm_contacts_created_at_idx    on public.crm_contacts (created_at desc);
create index if not exists crm_contacts_deleted_at_idx    on public.crm_contacts (deleted_at);
create index if not exists crm_contacts_email_idx         on public.crm_contacts (email);
create index if not exists crm_customers_name_lower_idx   on public.crm_customers (lower(name));
create index if not exists crm_customers_industry_idx     on public.crm_customers (industry);
create index if not exists crm_customers_account_status_idx on public.crm_customers (account_status);
-- crm_addresses.customer_id already indexed by its UNIQUE constraint
create index if not exists crm_leads_customer_id_idx      on public.crm_leads (customer_id);
create index if not exists crm_leads_lead_owner_id_idx    on public.crm_leads (lead_owner_id);
create index if not exists crm_leads_lead_assign_to_id_idx on public.crm_leads (lead_assign_to_id);
create index if not exists crm_leads_user_id_idx          on public.crm_leads (user_id);
create index if not exists crm_leads_is_deleted_idx       on public.crm_leads (is_deleted);
create index if not exists crm_leads_lead_stage_idx       on public.crm_leads (lead_stage);
create index if not exists crm_leads_created_at_idx       on public.crm_leads (created_at desc);
create index if not exists lead_logs_lead_id_created_idx  on public.lead_logs (lead_id, created_at desc);
create index if not exists crm_tasks_entity_idx           on public.crm_tasks (entity_type, entity_id);
create index if not exists crm_tasks_assigned_to_idx      on public.crm_tasks (assigned_to);
create index if not exists crm_tasks_customer_id_idx      on public.crm_tasks (customer_id);
create index if not exists crm_tasks_due_date_idx         on public.crm_tasks (due_date);
create index if not exists crm_meetings_entity_idx        on public.crm_meetings (entity_type, entity_id);
create index if not exists crm_meetings_start_time_idx    on public.crm_meetings (start_time);
create index if not exists crm_salesperson_user_id_idx    on public.crm_salesperson (user_id);
create index if not exists leads_contact_id_idx           on public.leads (contact_id);
create index if not exists leads_created_at_idx           on public.leads (created_at desc);
create index if not exists contacts_name_idx              on public.contacts (name);
create index if not exists companies_created_at_idx       on public.companies (created_at desc);
create index if not exists customers_account_id_idx       on public.customers (account_id);
-- user_settings.user_id already indexed by its UNIQUE constraint

create index if not exists products_category_id_idx      on public.products (category_id);
create index if not exists products_status_idx           on public.products (status);
create index if not exists products_created_at_idx       on public.products (created_at desc);
create index if not exists products_sku_idx              on public.products (sku);
create index if not exists products_name_idx             on public.products (name);

create index if not exists product_logs_product_id_idx   on public.product_logs (product_id, created_at desc);
create index if not exists product_logs_user_id_idx      on public.product_logs (user_id);

create index if not exists quotations_contact_id_idx     on public.quotations (contact_id);
create index if not exists quotations_opportunity_id_idx on public.quotations (opportunity_id);
create index if not exists quotations_status_idx         on public.quotations (status);
create index if not exists quotations_number_idx         on public.quotations (quotation_number);
create index if not exists quotations_created_at_idx     on public.quotations (created_at desc);

create index if not exists quotation_items_quotation_id_idx on public.quotation_items (quotation_id);
create index if not exists quotation_items_product_id_idx   on public.quotation_items (product_id);

create index if not exists quotation_logs_quotation_id_idx  on public.quotation_logs (quotation_id, created_at desc);

create index if not exists invoices_contact_id_idx       on public.invoices (contact_id);
create index if not exists invoices_quotation_id_idx     on public.invoices (quotation_id);
create index if not exists invoices_status_idx           on public.invoices (status);
create index if not exists invoices_number_idx           on public.invoices (invoice_number);
create index if not exists invoices_created_at_idx       on public.invoices (created_at desc);

create index if not exists invoice_items_invoice_id_idx  on public.invoice_items (invoice_id);
create index if not exists invoice_items_product_id_idx  on public.invoice_items (product_id);

create index if not exists invoice_logs_invoice_id_idx   on public.invoice_logs (invoice_id, created_at desc);

create index if not exists payments_invoice_id_idx       on public.payments (invoice_id);

create index if not exists payment_terms_days_idx        on public.payment_terms (days);


create index if not exists email_templates_user_id_idx      on public.email_templates (user_id);
create index if not exists email_templates_status_idx       on public.email_templates (status);
create index if not exists email_templates_category_idx     on public.email_templates (category);
create index if not exists email_templates_created_at_idx   on public.email_templates (created_at desc);

create index if not exists audience_segments_user_id_idx    on public.audience_segments (user_id);
create index if not exists audience_segments_created_at_idx on public.audience_segments (created_at desc);

create index if not exists email_campaigns_user_id_idx      on public.email_campaigns (user_id);
create index if not exists email_campaigns_segment_id_idx   on public.email_campaigns (segment_id);
create index if not exists email_campaigns_template_id_idx  on public.email_campaigns (template_id);
create index if not exists email_campaigns_status_idx       on public.email_campaigns (status);
create index if not exists email_campaigns_scheduled_at_idx on public.email_campaigns (scheduled_at) where status = 'scheduled';
create index if not exists email_campaigns_created_at_idx   on public.email_campaigns (created_at desc);

create index if not exists campaign_recipients_campaign_id_idx on public.campaign_recipients (campaign_id);
create index if not exists campaign_recipients_user_id_idx     on public.campaign_recipients (user_id);
create index if not exists campaign_recipients_contact_id_idx  on public.campaign_recipients (contact_id);
create index if not exists campaign_recipients_status_idx      on public.campaign_recipients (status);

create index if not exists email_data_user_id_idx     on public.email_data (user_id);
create index if not exists email_data_contact_id_idx  on public.email_data (contact_id);
create index if not exists email_data_status_idx      on public.email_data (status);
create index if not exists email_data_created_at_idx  on public.email_data (created_at desc);

create index if not exists email_logs_user_id_idx  on public.email_logs (user_id);
create index if not exists email_logs_sent_at_idx  on public.email_logs (sent_at desc);

create index if not exists incoming_emails_user_id_idx     on public.incoming_emails (user_id);
create index if not exists incoming_emails_received_at_idx on public.incoming_emails (received_at desc);
create index if not exists incoming_emails_message_id_idx  on public.incoming_emails (message_id);
-- consider a UNIQUE (user_id, message_id) once you confirm how the mailer dedupes IMAP sync

create index if not exists user_roles_role_id_idx              on public.user_roles (role_id);
create index if not exists role_permissions_permission_id_idx  on public.role_permissions (permission_id);
create index if not exists roles_order_idx                     on public.roles ("order");
create index if not exists permissions_module_idx              on public.permissions (module);
create index if not exists sales_teams_manager_id_idx          on public.sales_teams (manager_id);
create index if not exists sales_teams_created_at_idx          on public.sales_teams (created_at desc);
create index if not exists sales_team_members_user_id_idx      on public.sales_team_members (user_id);
create index if not exists sales_targets_team_id_idx           on public.sales_targets (team_id);
create index if not exists sales_targets_created_at_idx        on public.sales_targets (created_at desc);
create index if not exists sales_target_members_user_id_idx    on public.sales_target_members (user_id);
create index if not exists sales_team_audit_logs_team_id_idx   on public.sales_team_audit_logs (team_id);
create index if not exists sales_team_audit_logs_user_id_idx   on public.sales_team_audit_logs (user_id);



-- #####################################################################
-- 4. FUNCTIONS & SIGNUP TRIGGER
-- #####################################################################

-- get_users()
-- evidence: supabase.rpc('get_users') with NO args in
--   src/components/admin/RoleManagement.tsx:143  -> uses u.id, u.email, u.last_sign_in_at
--   src/pages/AddLeads.tsx:197                   -> uses u.id, u.email (lead owner dropdown)
--   src/services/salesTeamService.ts:156         -> uses u.id, u.email (joined client-side with crm_profile)
-- full_name / avatar_url / created_at are extras (code reads those from crm_profile itself).
create or replace function public.get_users()
returns table (
  id              uuid,
  email           text,
  full_name       text,
  avatar_url      text,
  created_at      timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.email::text,
    coalesce(p.full_name, u.raw_user_meta_data->>'full_name')::text  as full_name,
    coalesce(p.avatar_url, u.raw_user_meta_data->>'avatar_url')::text as avatar_url,
    u.created_at,
    u.last_sign_in_at
  from auth.users u
  left join public.crm_profile p on p.id = u.id
  where auth.uid() is not null          -- defence in depth: only signed-in callers
    and u.deleted_at is null
  order by u.email;
$$;

revoke all on function public.get_users() from public;
revoke all on function public.get_users() from anon;
grant execute on function public.get_users() to authenticated;

-- Signup trigger
-- evidence: src/pages/Signup.tsx calls supabase.auth.signUp({email, password}) ONLY — no profile/role insert,
--   no user metadata. Nothing else creates a user_roles row; crm_profile is only created lazily
--   via upsert when the user saves src/pages/Profile.tsx.
-- Consequences without this trigger:
--   * user_roles(...).single() returns null -> Dashboard.tsx / dashboard/Leads.tsx never fetch
--     (guard `if (!userId || userRole === null) return;`) -> stuck loading.
--   * PermissionContext gets no permissions -> Leads create/edit/delete buttons hidden.
--   * salesTeamService.getAllUsers() filters out users without crm_profile, and the
--     sales_team_members / sales_target_members / sales_teams.manager_id FKs require a crm_profile row.
--   * Header.tsx .from('crm_profile')...single() errors.
-- Policy: the very first user becomes 'Super Admin'; everyone after that gets 'Sales Rep'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
begin
  insert into public.crm_profile (id, email, full_name, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  if not exists (select 1 from public.user_roles) then
    select id into v_role_id from public.roles where name = 'Super Admin';
  else
    select id into v_role_id from public.roles where name = 'Sales Rep';
  end if;

  if v_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, v_role_id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();



-- #####################################################################
-- 5. ROW LEVEL SECURITY
-- #####################################################################

-- The app runs every query from the browser as the signed-in user, including admin
-- screens, so shared CRM data is open to any signed-in user. Nothing is open to anon.
-- Personal data (settings, mailbox, email history) is limited to its owner.
do $$
declare
  t text;
  owner_only text[] := array['user_settings','email_data','email_logs','incoming_emails'];
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    if t = any(owner_only) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
        t || '_owner_all', t);
    else
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        t || '_authenticated_all', t);
    end if;
  end loop;
end $$;


-- #####################################################################
-- 6. STORAGE BUCKETS
-- #####################################################################

-- evidence (in scope):
--   profile-images : src/pages/AddContact.tsx ~1326-1347 — upload(`${Date.now()}-${rand}.${ext}`) at bucket root,
--                    getPublicUrl(), remove([oldPath]) where oldPath parsed from '/public/profile-images/'.
--   scanned-cards  : src/pages/AddContact.tsx ~1349-1370 (same pattern) and
--                    src/components/contacts/BulkScanModal.tsx ~255-266 — upload(`card_${rand}_${ts}.${ext}`), getPublicUrl().
--   Both use getPublicUrl (and URLs are parsed as /public/<bucket>/) -> buckets must be PUBLIC.
--   No createSignedUrl anywhere in the repo.
-- evidence (out of my scope, but the code treats these as STORAGE BUCKETS, not tables — all use getPublicUrl):
--   user_profile_image   : Profile.tsx (`${user.id}/avatar-${ts}.${ext}`, upsert) and Settings.tsx (`${user.id}.${ext}`, upsert)
--   Customer_attachments : AddContact.tsx (`${customerId}/${ts}.${ext}`), Customer_Attachments.tsx .list(customerId)
--   lead-attachments     : AddLeads.tsx (`leads/${fileName}`), LeadDetails.tsx .list(id)
--   product-images       : AddProduct.tsx upload, Products.tsx remove([fileName])
-- =====================================================================
insert into storage.buckets (id, name, public)
values
  ('profile-images',       'profile-images',       true),
  ('scanned-cards',        'scanned-cards',        true),
  ('user_profile_image',   'user_profile_image',   true),
  ('Customer_attachments', 'Customer_attachments', true),
  ('lead-attachments',     'lead-attachments',     true),
  ('product-images',       'product-images',       true)
on conflict (id) do nothing;

-- Public buckets serve getPublicUrl() without a SELECT policy, but list()/remove()/upsert need them.
drop policy if exists "crm_buckets_auth_select" on storage.objects;
create policy "crm_buckets_auth_select" on storage.objects
  for select to authenticated
  using (bucket_id in ('profile-images','scanned-cards','user_profile_image',
                       'Customer_attachments','lead-attachments','product-images'));

drop policy if exists "crm_buckets_auth_insert" on storage.objects;
create policy "crm_buckets_auth_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('profile-images','scanned-cards','user_profile_image',
                            'Customer_attachments','lead-attachments','product-images'));

drop policy if exists "crm_buckets_auth_update" on storage.objects;
create policy "crm_buckets_auth_update" on storage.objects
  for update to authenticated
  using      (bucket_id in ('profile-images','scanned-cards','user_profile_image',
                            'Customer_attachments','lead-attachments','product-images'))
  with check (bucket_id in ('profile-images','scanned-cards','user_profile_image',
                            'Customer_attachments','lead-attachments','product-images'));

drop policy if exists "crm_buckets_auth_delete" on storage.objects;
create policy "crm_buckets_auth_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('profile-images','scanned-cards','user_profile_image',
                       'Customer_attachments','lead-attachments','product-images'));



-- #####################################################################
-- 7. REALTIME (live updates)
-- #####################################################################

-- The app subscribes to live changes on these tables.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['crm_leads','crm_tasks','lead_logs','companies',
                             'invoices','invoice_logs','quotations','quotation_logs'] loop
      if not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;


-- #####################################################################
-- 8. STARTER DATA
-- #####################################################################

insert into public.payment_terms (name, description, days) values
    ('Immediate Payment',          'Due on receipt',                         0),
    ('15 Days',                    'Net 15',                                15),
    ('30 Days',                    'Net 30',                                30),
    ('45 Days',                    'Net 45',                                45),
    ('60 Days',                    'Net 60',                                60),
    ('End of Following Month',     'Due at the end of the following month', 60)
on conflict (name) do nothing;

insert into public.gst_treatments (name, description) values
    ('Registered Business - Regular',     'Business registered under GST (regular scheme)'),
    ('Registered Business - Composition', 'Business registered under the GST composition scheme'),
    ('Unregistered Business',             'Business not registered under GST'),
    ('Consumer',                          'End consumer (B2C)'),
    ('Overseas',                          'Export / customer outside India'),
    ('Special Economic Zone',             'SEZ unit or developer'),
    ('Deemed Export',                     'Supplies treated as deemed exports')
on conflict (name) do nothing;

insert into public.categories (category_name) values
    ('Electronics'), ('Furniture'), ('Software'), ('Services')
on conflict (category_name) do nothing;

-- SEED
-- Role names: "Super Admin" and "Admin" are hard-coded in Dashboard.tsx, dashboard/Leads.tsx,
--   PipelineChart.tsx, LeadsReport.tsx (see ALL leads + admin report controls). Others come from the
--   commented initialRoles in RoleManagement.tsx (Admin, Sales Manager, Sales Rep, Viewer).
-- Actions: exact strings from PermissionContext.PermissionActions.
-- Modules: the ONLY module actually checked in code is "leads" (LeadsListView/StageColumn/LeadCard:
--   canCreate/canEdit/hasPermission(UPDATE|DELETE)). Lookup is lower-cased, so 'Leads' matches.
--   Other modules are seeded so the Role Management screen has sensible groups (not enforced anywhere).
-- =====================================================================
insert into public.roles (name, description, "order") values
  ('Super Admin',   'Unrestricted access to everything',    1),
  ('Admin',         'Full system access',                   2),
  ('Sales Manager', 'Manage team and leads',                3),
  ('Sales Rep',     'Basic sales operations',               4),
  ('Viewer',        'Read-only access',                     5)
on conflict (name) do nothing;

insert into public.permissions (module, action, description)
select m.module, a.action, a.action || ' ' || m.module
from (values
  ('Leads'), ('Customers'), ('Contacts'), ('Companies'), ('Campaigns'), ('Quotations'),
  ('Invoices'), ('Payments'), ('Products'), ('Tasks'), ('Meetings'), ('Reports'),
  ('Sales Teams'), ('Sales Targets'), ('Email Templates'), ('Users'), ('Roles'), ('Settings')
) as m(module)
cross join (values
  ('Create'), ('Read'), ('Read_All'), ('Update'), ('Update_All'), ('Delete'), ('Delete_All')
) as a(action)
on conflict (module, action) do nothing;

-- Super Admin + Admin: everything
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('Super Admin', 'Admin')
on conflict (role_id, permission_id) do nothing;

-- Sales Manager: everything except Delete_All, and no Users/Roles/Settings admin
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.action <> 'Delete_All'
 and p.module not in ('Users', 'Roles', 'Settings')
where r.name = 'Sales Manager'
on conflict (role_id, permission_id) do nothing;

-- Sales Rep: Create/Read/Update on business modules
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.action in ('Create', 'Read', 'Update')
 and p.module not in ('Users', 'Roles', 'Settings', 'Sales Teams', 'Sales Targets')
where r.name = 'Sales Rep'
on conflict (role_id, permission_id) do nothing;

-- Viewer: Read only
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.action = 'Read'
where r.name = 'Viewer'
on conflict (role_id, permission_id) do nothing;

-- Backfill for any auth users that already exist (no-op on an empty project).
insert into public.crm_profile (id, email, full_name, display_name)
select u.id, u.email, split_part(u.email, '@', 1), split_part(u.email, '@', 1)
from auth.users u
on conflict (id) do nothing;

insert into public.user_roles (user_id, role_id)
select u.id, (select id from public.roles where name = 'Super Admin')
from auth.users u
on conflict (user_id) do nothing;

-- To promote a user manually later:
-- update public.user_roles set role_id = (select id from public.roles where name = 'Super Admin')
--  where user_id = (select id from auth.users where email = 'you@example.com');

