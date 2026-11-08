export interface Category {
    id: number;
    category_name: string;
    created_at?: string;
    updated_at?: string;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    description: string | null;
    category_id: number;
    base_price: number;
    status: 'active' | 'inactive' | 'discontinued';
    image_url?: string;
    product_type?: string;
    can_be_sold?: boolean;
    can_be_purchased?: boolean;
    invoicing_policy?: string;
    sales_price?: number;
    customer_taxes?: string;
    cost?: number;
    internal_reference?: string;
    barcode?: string;
    hsn_sac_code?: string;
    product_tags?: string[];
    company?: string;
    internal_notes?: string;
    created_at: string;
    updated_at: string;
    categories?: {
        category_name: string;
    };
    category_name?: string;
}

export type ProductFormData = {
    name: string;
    sku: string;
    description?: string;
    category_id?: number;
    base_price?: number | string;
    status: 'active' | 'inactive' | 'discontinued';
    image_url?: string;
    product_type?: string;
    can_be_sold?: boolean;
    can_be_purchased?: boolean;
    invoicing_policy?: string;
    sales_price?: number;
    customer_taxes?: string;
    cost?: number;
    internal_reference?: string;
    barcode?: string;
    hsn_sac_code?: string;
    product_tags?: string[];
    company?: string;
    internal_notes?: string;
};

export type Contact = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    position: string | null;
    status: 'lead' | 'prospect' | 'customer' | 'churned';
    notes: string | null;
    geo_lat: number | null;
    geo_lng: number | null;
    geo_address: string | null;
    created_at: string;
    updated_at: string;
    custom_fields?: Record<string, unknown>;
};

export type Customer = {
    id: string;
    first_name: string;
    last_name: string;
    name?: string;
    designation?: string;
    email: string;
    mobile_no: string | null;
    job_title: string | null;
    account_id: string | null;
    secondary_email: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zip: string | null;
    street2: string | null;
    contact_type: 'Individual' | 'Company' | 'Partner' | 'Vendor' | null;
    preferred_comm: 'Email' | 'Phone' | 'WhatsApp' | null;
    sales_owner_id: string | null;
    status: 'Active' | 'Inactive';
    linkedin_url: string | null;
    notes: string | null;
    marketing_opt_in: boolean;
    source: 'Event' | 'Web' | 'Referral' | 'Cold Call' | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    custom_fields?: Record<string, unknown>;
    customer?: { name: string };
};

export type CustomerFormData = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    job_title: string;
    account_id: string;
    secondary_email: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    street2: string;
    contact_type: string;
    preferred_comm: string;
    sales_owner_id: string;
    status: string;
    linkedin_url: string;
    notes: string;
    marketing_opt_in: boolean;
    source: string;
};

export type LeadStage = 'Qualification' | 'Need Analysis' | 'Value Proposition' | 'Identify Decision Makers' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Lead {
    id: string;
    subject: string | null;
    lead_name: string | null;
    customer_id: string | null;
    product_interest: string | null;
    email: string | null;
    phone_number: string | null;
    lead_source: string | null;
    lead_priority: string | null;
    industry: string | null;
    estimated_deal_value: number | null;
    created_date: string | null;
    lead_score: number | null;
    lead_owner_id: string | null;
    lead_assign_to_id: string | null;
    is_decision_maker: boolean | null;
    campaign_name: string | null;
    expected_close_date: string | null;
    last_contact_date: string | null;
    conversion_status: string | null;
    lost_reason: string | null;
    lead_stage: LeadStage;
    note: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zip: string | null;
    attachment_url: string | null;
    is_deleted: boolean | null;
    attachment_name: string | null;
    lead_number: string | null;

    // UI specific/related fields
    lead_owner?: { full_name: string } | null;
    lead_assignee?: { full_name: string } | null;
    customers?: {
        id?: string;
        name: string;
        first_name: string;
        last_name: string;
        email: string;
    };
}

export interface Quotation {
    id: string;
    quotation_number: string;
    contact_id: string | null;
    opportunity_id: string | null;
    status: 'draft' | 'sent' | 'sales_order' | 'cancelled';
    expiration_date: string | null;
    payment_terms: string | null;
    gst_treatment: string | null;
    quotation_template: string | null;
    salesperson: string | null;
    sales_team: string | null;
    require_signature: boolean;
    require_payment: boolean;
    payment_percentage: number;
    customer_reference: string | null;
    tags: string[];
    delivery_date: string | null;
    fiscal_position: string | null;
    source_document: string | null;
    campaign: string | null;
    medium: string | null;
    source: string | null;
    subtotal: number;
    total_tax: number;
    total_amount: number;
    billing_address: string | null;
    created_at: string;
    updated_at: string;
}

export interface Company {
    id: string;
    name: string;
    website: string | null;
    industry: string | null;
    size: string | null;
    revenue: string | null;
    email: string | null;
    phone: string | null;
    contact_count: number;
    total_value: number;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    id: string;
    invoice_number: string;
    quotation_id: string | null;
    contact_id: string | null;
    status: 'draft' | 'posted' | 'cancelled' | 'paid';
    invoice_date: string | null;
    payment_reference: string | null;
    payment_terms: string | null;
    currency: string;
    subtotal: number;
    total_tax: number;
    total_amount: number;
    amount_due: number;
    created_at: string;
    updated_at: string;
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    product_id: number | null;
    product_name: string | null;
    description: string | null;
    quantity: number;
    unit_price: number;
    taxes: string | null;
    discount_percent: number;
    total: number;
}

export interface Payment {
    id: string;
    invoice_id: string;
    journal: 'bank' | 'cash';
    payment_method: string;
    amount: number;
    payment_date: string;
    memo: string | null;
    created_at: string;
}

export interface ProductLog {
    id: number;
    product_id: number;
    user_id: string | null;
    user_name: string | null;
    action: 'created' | 'updated' | 'status_change' | 'note';
    content: string;
    created_at: string;
}

export interface SalesTeam {
    id: string;
    name: string;
    manager_id: string;
    status: 'Active' | 'Inactive';
    created_at: string;
    updated_at: string;
    manager?: {
        full_name: string;
        avatar_url?: string;
    };
    members?: {
        user_id: string;
        full_name: string;
        avatar_url?: string;
    }[];
}

export interface SalesTeamMember {
    id: string;
    team_id: string;
    user_id: string;
    created_at: string;
}

export interface SalesTeamAuditLog {
    id: string;
    team_id: string | null;
    user_id: string;
    action: string;
    details: any;
    created_at: string;
}


export interface AudienceSegment {
    id: string;
    name: string;
    filters: Record<string, any>;
    is_dynamic: boolean;
    recipient_count: number;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface EmailCampaign {
    id: string;
    name: string;
    description: string | null;
    segment_id: string | null;
    template_id: string | null;
    status: CampaignStatus;
    subject: string | null;
    preview_text: string | null;
    sender_name: string | null;
    sender_email: string | null;
    reply_to: string | null;
    scheduled_at: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    segment?: AudienceSegment;
    manual_contacts?: { name: string, email: string }[];
    delivered_rate?: number;
    open_rate?: number;
    click_rate?: number;
}

export type DeliveryStatus = 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';

export interface CampaignRecipient {
    id: string;
    campaign_id: string;
    contact_id: string | null;
    email?: string;
    name?: string;
    status: DeliveryStatus;
    error_message: string | null;
    sent_at: string | null;
    opened_at: string | null;
    clicked_at: string | null;
    created_at: string;
}
