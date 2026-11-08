-- Quotations and invoices pick their customer from crm_customers (the table the
-- Customers screen writes to), not the legacy `contacts` table that nothing fills.
-- The column keeps its name `contact_id`; only the foreign key target changes.

alter table public.quotations drop constraint if exists quotations_contact_id_fkey;
alter table public.quotations
    add constraint quotations_contact_id_fkey
    foreign key (contact_id) references public.crm_customers(id) on delete set null;

alter table public.invoices drop constraint if exists invoices_contact_id_fkey;
alter table public.invoices
    add constraint invoices_contact_id_fkey
    foreign key (contact_id) references public.crm_customers(id) on delete set null;

-- Let the API pick up the new relationships (used by `crm_customers(name)` embeds).
notify pgrst, 'reload schema';
