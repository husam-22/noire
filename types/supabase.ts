/**
 * NOIRÉ — Supabase database types.
 *
 * ⚠️ Hand-authored to match `supabase/migrations/*.sql` until the project is
 * linked. Regenerate from the live schema with:
 *
 *   npm run db:types
 *
 * (runs `supabase gen types typescript --project-id $SUPABASE_PROJECT_REF`).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamp = string;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          avatar_url: string | null;
          client_code: string | null;
          role: Database['public']['Enums']['app_role'];
          status: Database['public']['Enums']['customer_status'];
          tier: Database['public']['Enums']['customer_tier'];
          location: string | null;
          notes: string | null;
          preferences: Json;
          preferred_locale: Database['public']['Enums']['locale_code'];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          profile_id: string;
          label: string;
          first_name: string;
          last_name: string;
          company: string | null;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          phone: string;
          is_default_shipping: boolean;
          is_default_billing: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['addresses']['Row']> & {
          profile_id: string;
          first_name: string;
          last_name: string;
          line1: string;
          city: string;
          postal_code: string;
          country: string;
        };
        Update: Partial<Database['public']['Tables']['addresses']['Row']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: Database['public']['Enums']['category_slug'];
          index_number: string;
          name: string;
          short_name: string;
          description: string;
          editorial_statement: string;
          hero_image: string | null;
          thumbnail_image: string | null;
          featured_product_slug: string | null;
          sort_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & {
          id: string;
          slug: Database['public']['Enums']['category_slug'];
          index_number: string;
          name: string;
          short_name: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
        Relationships: [];
      };
      category_translations: {
        Row: {
          category_id: string;
          locale: Database['public']['Enums']['locale_code'];
          name: string | null;
          short_name: string | null;
          description: string | null;
          editorial_statement: string | null;
        };
        Insert: Database['public']['Tables']['category_translations']['Row'];
        Update: Partial<Database['public']['Tables']['category_translations']['Row']>;
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          slug: string;
          code: string;
          title: string;
          subtitle: string;
          description: string;
          editorial_essay: string;
          hero_image: string | null;
          secondary_image: string | null;
          season: string;
          featured: boolean;
          sort_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['collections']['Row']> & {
          id: string;
          slug: string;
          code: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['collections']['Row']>;
        Relationships: [];
      };
      collection_translations: {
        Row: {
          collection_id: string;
          locale: Database['public']['Enums']['locale_code'];
          title: string | null;
          subtitle: string | null;
          description: string | null;
          editorial_essay: string | null;
          season: string | null;
        };
        Insert: Database['public']['Tables']['collection_translations']['Row'];
        Update: Partial<Database['public']['Tables']['collection_translations']['Row']>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          sku: string;
          model_number: string;
          name: string;
          subtitle: string;
          short_description: string;
          editorial_description: string;
          category_id: string;
          price: number;
          compare_at_price: number | null;
          currency: Database['public']['Enums']['currency_code'];
          stock_status: Database['public']['Enums']['stock_status'];
          inventory_count: number;
          low_stock_threshold: number;
          badge: Database['public']['Enums']['product_badge'] | null;
          badge_label: string | null;
          featured: boolean;
          is_spotlight: boolean;
          is_new_arrival: boolean;
          release_year: number | null;
          designed_in: string | null;
          primary_image: string;
          secondary_image: string | null;
          gallery: Json;
          colors: Json;
          options: Json;
          option_group_label: string | null;
          materials: string[];
          highlights: string[];
          specifications: Json;
          story_blocks: Json;
          faqs: Json;
          shipping_estimate: string;
          warranty_years: number;
          seo_title: string | null;
          seo_description: string | null;
          canonical_path: string | null;
          status: Database['public']['Enums']['product_status'];
          search_vector: unknown;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Omit<Database['public']['Tables']['products']['Row'], 'search_vector'>> & {
          id: string;
          slug: string;
          sku: string;
          model_number: string;
          name: string;
          category_id: string;
          price: number;
          primary_image: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['products']['Row'], 'search_vector'>>;
        Relationships: [];
      };
      product_translations: {
        Row: {
          product_id: string;
          locale: Database['public']['Enums']['locale_code'];
          name: string | null;
          subtitle: string | null;
          short_description: string | null;
          editorial_description: string | null;
          highlights: string[] | null;
          materials: string[] | null;
          specifications: Json | null;
          story_blocks: Json | null;
          faqs: Json | null;
          shipping_estimate: string | null;
          seo_title: string | null;
          seo_description: string | null;
        };
        Insert: Partial<Database['public']['Tables']['product_translations']['Row']> & {
          product_id: string;
          locale: Database['public']['Enums']['locale_code'];
        };
        Update: Partial<Database['public']['Tables']['product_translations']['Row']>;
        Relationships: [];
      };
      product_collections: {
        Row: { product_id: string; collection_id: string; sort_order: number };
        Insert: { product_id: string; collection_id: string; sort_order?: number };
        Update: Partial<Database['public']['Tables']['product_collections']['Row']>;
        Relationships: [];
      };
      product_relations: {
        Row: { product_id: string; related_product_id: string; sort_order: number };
        Insert: { product_id: string; related_product_id: string; sort_order?: number };
        Update: Partial<Database['public']['Tables']['product_relations']['Row']>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          profile_id: string | null;
          author_name: string;
          author_location: string;
          author_role: string | null;
          rating: number;
          title: string;
          body: string;
          verified_purchase: boolean;
          variant_purchased: string;
          helpful_count: number;
          approved: boolean;
          created_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['reviews']['Row']> & {
          product_id: string;
          author_name: string;
          rating: number;
          title: string;
          body: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Row']>;
        Relationships: [];
      };
      journal_articles: {
        Row: {
          id: string;
          slug: string;
          issue_number: string;
          category: string;
          title: string;
          subtitle: string;
          excerpt: string;
          cover_image: string | null;
          author_name: string;
          author_role: string;
          published_at: Timestamp | null;
          reading_time_minutes: number;
          featured: boolean;
          related_product_ids: string[];
          content: string[];
          status: Database['public']['Enums']['product_status'];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['journal_articles']['Row']> & {
          id: string;
          slug: string;
          issue_number: string;
          category: string;
          title: string;
          author_name: string;
        };
        Update: Partial<Database['public']['Tables']['journal_articles']['Row']>;
        Relationships: [];
      };
      shipping_methods: {
        Row: {
          id: string;
          code: string;
          name: string;
          carrier: string;
          estimated_window: string;
          estimated_dispatch: string;
          base_cost: number;
          free_above_subtotal: number | null;
          description: string;
          countries: string[] | null;
          active: boolean;
          sort_order: number;
        };
        Insert: Partial<Database['public']['Tables']['shipping_methods']['Row']> & {
          id: string;
          code: string;
          name: string;
          carrier: string;
          estimated_window: string;
          base_cost: number;
        };
        Update: Partial<Database['public']['Tables']['shipping_methods']['Row']>;
        Relationships: [];
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          description: string;
          type: Database['public']['Enums']['discount_type'];
          value: number;
          min_order_amount: number | null;
          usage_limit: number | null;
          usage_count: number;
          per_customer_limit: number | null;
          status: Database['public']['Enums']['discount_status'];
          starts_at: Timestamp;
          expires_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['discounts']['Row']> & {
          code: string;
          type: Database['public']['Enums']['discount_type'];
          value: number;
        };
        Update: Partial<Database['public']['Tables']['discounts']['Row']>;
        Relationships: [];
      };
      settings: {
        Row: { key: string; value: Json; updated_by: string | null; updated_at: Timestamp };
        Insert: { key: string; value: Json; updated_by?: string | null };
        Update: Partial<Database['public']['Tables']['settings']['Row']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          allocation_reference: string | null;
          idempotency_key: string | null;
          profile_id: string | null;
          customer_email: string;
          customer_first_name: string;
          customer_last_name: string;
          customer_phone: string | null;
          status: Database['public']['Enums']['order_status'];
          payment_status: Database['public']['Enums']['payment_status'];
          payment_provider: Database['public']['Enums']['payment_provider'];
          payment_method_type: Database['public']['Enums']['payment_method_type'] | null;
          payment_brand: string | null;
          payment_last4: string | null;
          payment_cardholder: string | null;
          payment_intent_id: string | null;
          shipping_method_id: string | null;
          shipping_method: Json;
          shipping_address: Json;
          billing_address: Json;
          subtotal: number;
          discount_amount: number;
          discount_id: string | null;
          discount_code: string | null;
          shipping_cost: number;
          tax_amount: number;
          total: number;
          currency: Database['public']['Enums']['currency_code'];
          carrier: string | null;
          tracking_number: string | null;
          estimated_dispatch: string | null;
          estimated_delivery: string | null;
          notes: string | null;
          locale: Database['public']['Enums']['locale_code'];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: never; // Orders are created exclusively through the `place_order` RPC.
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_slug: string;
          product_name: string;
          model_number: string;
          sku: string;
          variant_name: string;
          selected_finish: Json | null;
          selected_option: Json | null;
          image: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      order_events: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          description: string;
          location: string | null;
          completed: boolean;
          actor_id: string | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['order_events']['Row']> & {
          order_id: string;
          status: string;
          description: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'order_events_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      discount_redemptions: {
        Row: {
          id: string;
          discount_id: string;
          order_id: string;
          profile_id: string | null;
          amount: number;
          created_at: Timestamp;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string;
          order_id: string | null;
          delta: number;
          reason: string;
          actor_id: string | null;
          created_at: Timestamp;
        };
        Insert: { product_id: string; delta: number; reason: string; order_id?: string | null; actor_id?: string | null };
        Update: never;
        Relationships: [];
      };
      wishlist_items: {
        Row: { profile_id: string; product_id: string; created_at: Timestamp };
        Insert: { profile_id: string; product_id: string };
        Update: never;
        Relationships: [];
      };
      carts: {
        Row: { id: string; profile_id: string | null; items: Json; updated_at: Timestamp };
        Insert: { id?: string; profile_id?: string | null; items?: Json };
        Update: { items?: Json };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          email: string;
          locale: Database['public']['Enums']['locale_code'];
          source: string | null;
          confirmed: boolean;
          created_at: Timestamp;
        };
        Insert: { email: string; locale?: Database['public']['Enums']['locale_code']; source?: string | null };
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Row']>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string;
          before: Json | null;
          after: Json | null;
          created_at: Timestamp;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      catalog_products: {
        Row: Omit<Database['public']['Tables']['products']['Row'], 'search_vector'> & {
          category_slug: Database['public']['Enums']['category_slug'];
          category_name: string;
          collection_ids: string[];
          related_product_ids: string[];
        };
        Relationships: [];
      };
      catalog_categories: {
        Row: Database['public']['Tables']['categories']['Row'] & { product_count: number };
        Relationships: [];
      };
      catalog_collections: {
        Row: Database['public']['Tables']['collections']['Row'] & { product_ids: string[] };
        Relationships: [];
      };
      admin_customers: {
        Row: Database['public']['Tables']['profiles']['Row'] & {
          orders_count: number;
          total_spent: number;
          last_order_at: Timestamp | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      validate_discount: { Args: { p_code: string; p_subtotal: number }; Returns: Json };
      quote_shipping: { Args: { p_method_id: string; p_subtotal: number; p_country?: string | null }; Returns: number };
      place_order: { Args: { payload: Json }; Returns: string };
      set_order_status: {
        Args: {
          p_order_id: string;
          p_status: Database['public']['Enums']['order_status'];
          p_description?: string | null;
          p_carrier?: string | null;
          p_tracking_number?: string | null;
        };
        Returns: undefined;
      };
      mark_order_paid: { Args: { p_order_id: string; p_provider_ref: string }; Returns: undefined };
      admin_dashboard_stats: { Args: { p_days?: number }; Returns: Json };
      get_order_receipt: { Args: { p_order_id: string }; Returns: Json };
      confirm_order_payment: { Args: { p_order_id: string; p_reference?: string | null }; Returns: undefined };
      get_storefront_content: { Args: Record<string, never>; Returns: Json };
      jwt_role: { Args: Record<string, never>; Returns: Database['public']['Enums']['app_role'] };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      app_role: 'customer' | 'staff' | 'admin';
      locale_code: 'en' | 'ar';
      category_slug:
        | 'audio'
        | 'desk-architecture'
        | 'lighting'
        | 'travel-carry'
        | 'smart-instruments'
        | 'tactile-input';
      stock_status: 'in_stock' | 'low_stock' | 'pre_order' | 'out_of_stock';
      product_status: 'active' | 'draft' | 'archived';
      product_badge: 'new_release' | 'limited_edition' | 'archival' | 'bestseller' | 'award_winner';
      order_status:
        | 'pending_settlement'
        | 'processing'
        | 'craft_calibration'
        | 'shipped'
        | 'delivered'
        | 'cancelled'
        | 'returned';
      payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
      payment_provider: 'demo' | 'stripe_elements' | 'apple_pay' | 'studio_wire' | 'manual';
      payment_method_type: 'card' | 'apple_pay' | 'wire_transfer' | 'cash_on_delivery' | 'bank_transfer';
      discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
      discount_status: 'active' | 'scheduled' | 'expired' | 'disabled' | 'archived';
      customer_status: 'active' | 'vip' | 'inactive';
      customer_tier: 'Private Client' | 'Collector' | 'Member';
      currency_code: 'USD' | 'EUR' | 'GBP' | 'JPY';
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
