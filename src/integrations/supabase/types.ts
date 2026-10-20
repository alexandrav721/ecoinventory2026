export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          item_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          item_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          item_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string
          category: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          read_time: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          read_time?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          read_time?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      assistant_user_prefs: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      badge_catalog: {
        Row: {
          blurb: string
          category: string
          emoji: string
          slug: string
          title: string
        }
        Insert: {
          blurb: string
          category: string
          emoji?: string
          slug: string
          title: string
        }
        Update: {
          blurb?: string
          category?: string
          emoji?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      book_picks: {
        Row: {
          author: string | null
          created_at: string
          genre: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          genre: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          author?: string | null
          created_at?: string
          genre?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      borrow_ratings: {
        Row: {
          created_at: string
          id: string
          note: string | null
          ratee_id: string
          rater_id: string
          request_id: string
          stars: number
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          ratee_id: string
          rater_id: string
          request_id: string
          stars: number
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          ratee_id?: string
          rater_id?: string
          request_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "borrow_ratings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "borrowing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowing_requests: {
        Row: {
          borrower_pickup_confirmed_at: string | null
          borrower_return_confirmed_at: string | null
          collection_id: string | null
          created_at: string
          delivery_method: string | null
          dispute_id: string | null
          disputed_at: string | null
          disputed_by: string | null
          end_date: string | null
          id: string
          item_id: string
          lender_pickup_confirmed_at: string | null
          lender_return_confirmed_at: string | null
          message: string | null
          offer_amount_cents: number | null
          owner_id: string
          picked_up_at: string | null
          requested_at: string
          requester_id: string
          responded_at: string | null
          response_message: string | null
          returned_at: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          borrower_pickup_confirmed_at?: string | null
          borrower_return_confirmed_at?: string | null
          collection_id?: string | null
          created_at?: string
          delivery_method?: string | null
          dispute_id?: string | null
          disputed_at?: string | null
          disputed_by?: string | null
          end_date?: string | null
          id?: string
          item_id: string
          lender_pickup_confirmed_at?: string | null
          lender_return_confirmed_at?: string | null
          message?: string | null
          offer_amount_cents?: number | null
          owner_id: string
          picked_up_at?: string | null
          requested_at?: string
          requester_id: string
          responded_at?: string | null
          response_message?: string | null
          returned_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          borrower_pickup_confirmed_at?: string | null
          borrower_return_confirmed_at?: string | null
          collection_id?: string | null
          created_at?: string
          delivery_method?: string | null
          dispute_id?: string | null
          disputed_at?: string | null
          disputed_by?: string | null
          end_date?: string | null
          id?: string
          item_id?: string
          lender_pickup_confirmed_at?: string | null
          lender_return_confirmed_at?: string | null
          message?: string | null
          offer_amount_cents?: number | null
          owner_id?: string
          picked_up_at?: string | null
          requested_at?: string
          requester_id?: string
          responded_at?: string | null
          response_message?: string | null
          returned_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrowing_requests_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_requests_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_requests_disputed_by_fkey"
            columns: ["disputed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_requests_disputed_by_fkey"
            columns: ["disputed_by"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "borrowing_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "borrowing_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      borrowing_requests_backup_20260529: {
        Row: {
          collection_id: string | null
          created_at: string | null
          delivery_method: string | null
          end_date: string | null
          id: string | null
          item_id: string | null
          message: string | null
          owner_id: string | null
          requested_at: string | null
          requester_id: string | null
          responded_at: string | null
          response_message: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          delivery_method?: string | null
          end_date?: string | null
          id?: string | null
          item_id?: string | null
          message?: string | null
          owner_id?: string | null
          requested_at?: string | null
          requester_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          delivery_method?: string | null
          end_date?: string | null
          id?: string | null
          item_id?: string | null
          message?: string | null
          owner_id?: string | null
          requested_at?: string | null
          requester_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories_backup_20260529: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string | null
          name: string | null
          parent_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string | null
          name?: string | null
          parent_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string | null
          name?: string | null
          parent_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      category_learning: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          item_name: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          item_name: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          item_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_learning_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_bingo_boards: {
        Row: {
          blurb: string
          board_type: string
          created_at: string
          emoji: string
          id: string
          mission: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          blurb: string
          board_type: string
          created_at?: string
          emoji?: string
          id?: string
          mission: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          blurb?: string
          board_type?: string
          created_at?: string
          emoji?: string
          id?: string
          mission?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      challenge_bingo_cells: {
        Row: {
          board_id: string
          category_hint: string | null
          id: string
          is_free: boolean
          label: string
          match_keywords: string[]
          position: number
        }
        Insert: {
          board_id: string
          category_hint?: string | null
          id?: string
          is_free?: boolean
          label: string
          match_keywords?: string[]
          position: number
        }
        Update: {
          board_id?: string
          category_hint?: string | null
          id?: string
          is_free?: boolean
          label?: string
          match_keywords?: string[]
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_bingo_cells_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "challenge_bingo_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_days: {
        Row: {
          day_number: number
          difficulty_week: string
          escape_hatch: string | null
          id: string
          lane_tags: string[]
          points: number
          prompt: string
          reward_copy: string | null
          section_number: number | null
          target_count: number
          template_id: string
          theme: string | null
          track: string
          unit_in_section: number | null
          unit_outcome: string | null
          unit_title: string | null
        }
        Insert: {
          day_number: number
          difficulty_week: string
          escape_hatch?: string | null
          id?: string
          lane_tags?: string[]
          points?: number
          prompt: string
          reward_copy?: string | null
          section_number?: number | null
          target_count?: number
          template_id: string
          theme?: string | null
          track: string
          unit_in_section?: number | null
          unit_outcome?: string | null
          unit_title?: string | null
        }
        Update: {
          day_number?: number
          difficulty_week?: string
          escape_hatch?: string | null
          id?: string
          lane_tags?: string[]
          points?: number
          prompt?: string
          reward_copy?: string | null
          section_number?: number | null
          target_count?: number
          template_id?: string
          theme?: string | null
          track?: string
          unit_in_section?: number | null
          unit_outcome?: string | null
          unit_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_days_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_kit_slots: {
        Row: {
          category_hint: string | null
          id: string
          kit_id: string
          match_keywords: string[]
          required: boolean
          slot_name: string
          sort_order: number
        }
        Insert: {
          category_hint?: string | null
          id?: string
          kit_id: string
          match_keywords?: string[]
          required?: boolean
          slot_name: string
          sort_order?: number
        }
        Update: {
          category_hint?: string | null
          id?: string
          kit_id?: string
          match_keywords?: string[]
          required?: boolean
          slot_name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_kit_slots_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "challenge_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_kits: {
        Row: {
          blurb: string
          created_at: string
          emoji: string
          id: string
          kit_type: string
          mission: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          blurb: string
          created_at?: string
          emoji?: string
          id?: string
          kit_type: string
          mission: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          blurb?: string
          created_at?: string
          emoji?: string
          id?: string
          kit_type?: string
          mission?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      challenge_milestones: {
        Row: {
          id: string
          label: string
          metric: string
          reward_points: number
          sort_order: number
          threshold: number
          track: string
        }
        Insert: {
          id?: string
          label: string
          metric: string
          reward_points?: number
          sort_order?: number
          threshold: number
          track: string
        }
        Update: {
          id?: string
          label?: string
          metric?: string
          reward_points?: number
          sort_order?: number
          threshold?: number
          track?: string
        }
        Relationships: []
      }
      challenge_section_badges: {
        Row: {
          badge_slug: string
          id: string
          reward_label: string
          section_number: number
          track: string
        }
        Insert: {
          badge_slug: string
          id?: string
          reward_label: string
          section_number: number
          track: string
        }
        Update: {
          badge_slug?: string
          id?: string
          reward_label?: string
          section_number?: number
          track?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_section_badges_badge_slug_fkey"
            columns: ["badge_slug"]
            isOneToOne: false
            referencedRelation: "badge_catalog"
            referencedColumns: ["slug"]
          },
        ]
      }
      challenge_section_outcomes: {
        Row: {
          id: string
          outcomes: Json
          section_number: number
          track: string
        }
        Insert: {
          id?: string
          outcomes?: Json
          section_number: number
          track: string
        }
        Update: {
          id?: string
          outcomes?: Json
          section_number?: number
          track?: string
        }
        Relationships: []
      }
      challenge_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          total_days: number
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          total_days: number
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          total_days?: number
          version?: number
        }
        Relationships: []
      }
      challenge_weekly_focus: {
        Row: {
          cta_label: string
          data_blurb: string
          headline: string
          id: string
          sort_order: number
          subhead: string
          track: string
          value_kind: string
          week_number: number
        }
        Insert: {
          cta_label?: string
          data_blurb: string
          headline: string
          id?: string
          sort_order?: number
          subhead: string
          track: string
          value_kind?: string
          week_number: number
        }
        Update: {
          cta_label?: string
          data_blurb?: string
          headline?: string
          id?: string
          sort_order?: number
          subhead?: string
          track?: string
          value_kind?: string
          week_number?: number
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          added_at: string
          collection_id: string
          item_id: string
          position: number
        }
        Insert: {
          added_at?: string
          collection_id: string
          item_id: string
          position?: number
        }
        Update: {
          added_at?: string
          collection_id?: string
          item_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          bundle_price: number | null
          cover_item_id: string | null
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_available_for_sharing: boolean
          is_donated: boolean
          is_for_borrow: boolean
          is_for_sale: boolean
          name: string
          sharing_level: string
          sharing_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bundle_price?: number | null
          cover_item_id?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_available_for_sharing?: boolean
          is_donated?: boolean
          is_for_borrow?: boolean
          is_for_sale?: boolean
          name: string
          sharing_level?: string
          sharing_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bundle_price?: number | null
          cover_item_id?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_available_for_sharing?: boolean
          is_donated?: boolean
          is_for_borrow?: boolean
          is_for_sale?: boolean
          name?: string
          sharing_level?: string
          sharing_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_cover_item_id_fkey"
            columns: ["cover_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      common_tags: {
        Row: {
          created_at: string | null
          id: string
          last_used: string | null
          tag_text: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used?: string | null
          tag_text: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used?: string | null
          tag_text?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      community_events: {
        Row: {
          address: string | null
          borough: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          external_url: string | null
          host_name: string | null
          id: string
          is_free: boolean
          items_focus: string | null
          latitude: number | null
          longitude: number | null
          max_attendees: number | null
          neighborhood: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          borough?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          external_url?: string | null
          host_name?: string | null
          id?: string
          is_free?: boolean
          items_focus?: string | null
          latitude?: number | null
          longitude?: number | null
          max_attendees?: number | null
          neighborhood?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          borough?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          external_url?: string | null
          host_name?: string | null
          id?: string
          is_free?: boolean
          items_focus?: string | null
          latitude?: number | null
          longitude?: number | null
          max_attendees?: number | null
          neighborhood?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      curated_high_clear_categories: {
        Row: {
          emoji: string | null
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          emoji?: string | null
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          emoji?: string | null
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      curated_high_demand_categories: {
        Row: {
          emoji: string | null
          example_items: string[]
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          emoji?: string | null
          example_items?: string[]
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          emoji?: string | null
          example_items?: string[]
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      disputes: {
        Row: {
          borrow_request_id: string | null
          created_at: string
          evidence_urls: string[]
          id: string
          raised_against: string
          raised_by: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          borrow_request_id?: string | null
          created_at?: string
          evidence_urls?: string[]
          id?: string
          raised_against: string
          raised_by: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          borrow_request_id?: string | null
          created_at?: string
          evidence_urls?: string[]
          id?: string
          raised_against?: string
          raised_by?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_borrow_request_id_fkey"
            columns: ["borrow_request_id"]
            isOneToOne: false
            referencedRelation: "borrowing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_against_fkey"
            columns: ["raised_against"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_against_fkey"
            columns: ["raised_against"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          bringing_items: string | null
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bringing_items?: string | null
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bringing_items?: string | null
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_events"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      forwarding_tokens: {
        Row: {
          created_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          body: string
          created_at: string
          group_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          group_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          group_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_shared_items: {
        Row: {
          created_at: string
          group_id: string
          id: string
          item_id: string
          shared_by: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          item_id: string
          shared_by: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          item_id?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_shared_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_shared_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          city: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          radius_miles: number | null
          requires_approval: boolean
          state: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          radius_miles?: number | null
          requires_approval?: boolean
          state?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          radius_miles?: number | null
          requires_approval?: boolean
          state?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      inventory_benchmarks: {
        Row: {
          category_key: string
          created_at: string | null
          created_by: string | null
          display_name: string
          id: string
          keywords: string[] | null
          max_quantity: number
          reasoning: string
          typical_quantity: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category_key: string
          created_at?: string | null
          created_by?: string | null
          display_name: string
          id?: string
          keywords?: string[] | null
          max_quantity: number
          reasoning: string
          typical_quantity: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category_key?: string
          created_at?: string | null
          created_by?: string | null
          display_name?: string
          id?: string
          keywords?: string[] | null
          max_quantity?: number
          reasoning?: string
          typical_quantity?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      inventory_insights: {
        Row: {
          action_recommended: string | null
          created_at: string | null
          description: string
          id: string
          insight_type: string
          is_dismissed: boolean | null
          priority: string | null
          related_item_ids: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_recommended?: string | null
          created_at?: string | null
          description: string
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          priority?: string | null
          related_item_ids?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_recommended?: string | null
          created_at?: string | null
          description?: string
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          priority?: string | null
          related_item_ids?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          admin_hidden: boolean
          admin_hidden_at: string | null
          admin_hidden_by: string | null
          admin_hidden_reason: string | null
          allow_offers: boolean
          brand: string | null
          category_id: string | null
          color: string | null
          condition: string | null
          courier_available: boolean
          created_at: string | null
          description: string | null
          dimensions: string | null
          donated_date: string | null
          donated_price: number | null
          eliminated_date: string | null
          handoff_available: boolean
          id: string
          image_urls: string[] | null
          is_available_for_sharing: boolean | null
          is_donated: boolean | null
          is_eliminated: boolean | null
          is_for_borrow: boolean
          is_for_sale: boolean
          is_sold: boolean | null
          love_rating: string | null
          name: string
          original_price: number | null
          personal_notes: string | null
          product_url: string | null
          purchase_date: string | null
          quantity: number | null
          rent_price: number | null
          rent_window: string
          sharing_level: string | null
          sharing_price: number | null
          shipping_available: boolean
          show_original_price: boolean
          size: string | null
          sold_date: string | null
          sold_price: number | null
          tags: string[] | null
          updated_at: string | null
          usage_frequency: string | null
          user_id: string
        }
        Insert: {
          admin_hidden?: boolean
          admin_hidden_at?: string | null
          admin_hidden_by?: string | null
          admin_hidden_reason?: string | null
          allow_offers?: boolean
          brand?: string | null
          category_id?: string | null
          color?: string | null
          condition?: string | null
          courier_available?: boolean
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          donated_date?: string | null
          donated_price?: number | null
          eliminated_date?: string | null
          handoff_available?: boolean
          id?: string
          image_urls?: string[] | null
          is_available_for_sharing?: boolean | null
          is_donated?: boolean | null
          is_eliminated?: boolean | null
          is_for_borrow?: boolean
          is_for_sale?: boolean
          is_sold?: boolean | null
          love_rating?: string | null
          name: string
          original_price?: number | null
          personal_notes?: string | null
          product_url?: string | null
          purchase_date?: string | null
          quantity?: number | null
          rent_price?: number | null
          rent_window?: string
          sharing_level?: string | null
          sharing_price?: number | null
          shipping_available?: boolean
          show_original_price?: boolean
          size?: string | null
          sold_date?: string | null
          sold_price?: number | null
          tags?: string[] | null
          updated_at?: string | null
          usage_frequency?: string | null
          user_id: string
        }
        Update: {
          admin_hidden?: boolean
          admin_hidden_at?: string | null
          admin_hidden_by?: string | null
          admin_hidden_reason?: string | null
          allow_offers?: boolean
          brand?: string | null
          category_id?: string | null
          color?: string | null
          condition?: string | null
          courier_available?: boolean
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          donated_date?: string | null
          donated_price?: number | null
          eliminated_date?: string | null
          handoff_available?: boolean
          id?: string
          image_urls?: string[] | null
          is_available_for_sharing?: boolean | null
          is_donated?: boolean | null
          is_eliminated?: boolean | null
          is_for_borrow?: boolean
          is_for_sale?: boolean
          is_sold?: boolean | null
          love_rating?: string | null
          name?: string
          original_price?: number | null
          personal_notes?: string | null
          product_url?: string | null
          purchase_date?: string | null
          quantity?: number | null
          rent_price?: number | null
          rent_window?: string
          sharing_level?: string | null
          sharing_price?: number | null
          shipping_available?: boolean
          show_original_price?: boolean
          size?: string | null
          sold_date?: string | null
          sold_price?: number | null
          tags?: string[] | null
          updated_at?: string | null
          usage_frequency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_admin_hidden_by_fkey"
            columns: ["admin_hidden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_admin_hidden_by_fkey"
            columns: ["admin_hidden_by"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inventory_items_backup_20260529: {
        Row: {
          category_id: string | null
          id: string | null
        }
        Insert: {
          category_id?: string | null
          id?: string | null
        }
        Update: {
          category_id?: string | null
          id?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          id: string
          inviter_id: string
          redeemed_at: string | null
          redeemed_by: string | null
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          inviter_id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          token: string
        }
        Update: {
          created_at?: string
          id?: string
          inviter_id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          token?: string
        }
        Relationships: []
      }
      item_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      item_dismissals: {
        Row: {
          created_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_dismissals_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_dispositions: {
        Row: {
          brand: string | null
          category_id: string | null
          condition: string | null
          disposed_at: string
          disposition: string
          disposition_note: string | null
          id: string
          image_url: string | null
          item_name: string
          original_price: number | null
          purchase_date: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          condition?: string | null
          disposed_at?: string
          disposition: string
          disposition_note?: string | null
          id?: string
          image_url?: string | null
          item_name: string
          original_price?: number | null
          purchase_date?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          condition?: string | null
          disposed_at?: string
          disposition?: string
          disposition_note?: string | null
          id?: string
          image_url?: string | null
          item_name?: string
          original_price?: number | null
          purchase_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_dispositions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      item_likes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_requests: {
        Row: {
          audience: Database["public"]["Enums"]["request_audience"]
          brand: string | null
          category: string | null
          city: string | null
          created_at: string
          delivery_method: string | null
          description: string | null
          dimensions: string | null
          id: string
          is_anonymous: boolean
          item_name: string
          neighborhood: string | null
          requester_id: string
          size: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          view_count: number
        }
        Insert: {
          audience?: Database["public"]["Enums"]["request_audience"]
          brand?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          delivery_method?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          is_anonymous?: boolean
          item_name: string
          neighborhood?: string | null
          requester_id: string
          size?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          view_count?: number
        }
        Update: {
          audience?: Database["public"]["Enums"]["request_audience"]
          brand?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          delivery_method?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          is_anonymous?: boolean
          item_name?: string
          neighborhood?: string | null
          requester_id?: string
          size?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      item_saves: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_saves_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lend_rate_estimates: {
        Row: {
          category: string
          est_daily_rate: number
          est_freq_per_mo: number
          updated_at: string
        }
        Insert: {
          category: string
          est_daily_rate: number
          est_freq_per_mo?: number
          updated_at?: string
        }
        Update: {
          category?: string
          est_daily_rate?: number
          est_freq_per_mo?: number
          updated_at?: string
        }
        Relationships: []
      }
      loop_score_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          meta: Json
          points: number
          ref: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          points: number
          ref?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          points?: number
          ref?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loop_score_weights: {
        Row: {
          daily_cap: number | null
          kind: string
          points: number
        }
        Insert: {
          daily_cap?: number | null
          kind: string
          points: number
        }
        Update: {
          daily_cap?: number | null
          kind?: string
          points?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mutes: {
        Row: {
          created_at: string
          muted_id: string
          muter_id: string
        }
        Insert: {
          created_at?: string
          muted_id: string
          muter_id: string
        }
        Update: {
          created_at?: string
          muted_id?: string
          muter_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          is_read: boolean | null
          item_id: string | null
          kind: string | null
          message: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean | null
          item_id?: string | null
          kind?: string | null
          message: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean | null
          item_id?: string | null
          kind?: string | null
          message?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizer_profiles: {
        Row: {
          bio: string | null
          created_at: string
          headline: string
          is_active: boolean
          is_hidden: boolean
          photo_urls: string[] | null
          rate_note: string | null
          specialties: string[] | null
          travel_miles: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          headline: string
          is_active?: boolean
          is_hidden?: boolean
          photo_urls?: string[] | null
          rate_note?: string | null
          specialties?: string[] | null
          travel_miles?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          headline?: string
          is_active?: boolean
          is_hidden?: boolean
          photo_urls?: string[] | null
          rate_note?: string | null
          specialties?: string[] | null
          travel_miles?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      path_section_kits: {
        Row: {
          headline: string | null
          id: string
          kit_slug: string
          section_number: number
          subhead: string | null
          track: string
        }
        Insert: {
          headline?: string | null
          id?: string
          kit_slug: string
          section_number: number
          subhead?: string | null
          track: string
        }
        Update: {
          headline?: string | null
          id?: string
          kit_slug?: string
          section_number?: number
          subhead?: string | null
          track?: string
        }
        Relationships: [
          {
            foreignKeyName: "path_section_kits_kit_slug_fkey"
            columns: ["kit_slug"]
            isOneToOne: false
            referencedRelation: "challenge_kits"
            referencedColumns: ["slug"]
          },
        ]
      }
      premium_entitlements: {
        Row: {
          expires_at: string | null
          is_active: boolean
          product_id: string | null
          store: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          is_active?: boolean
          product_id?: string | null
          store?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          is_active?: boolean
          product_id?: string | null
          store?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_catalog: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          dimensions: string | null
          id: string
          image_urls: string[] | null
          name: string
          size: string | null
          typical_price: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          image_urls?: string[] | null
          name: string
          size?: string | null
          typical_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          image_urls?: string[] | null
          name?: string
          size?: string | null
          typical_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_catalog_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_category_mappings: {
        Row: {
          category_id: string
          created_at: string | null
          created_by: string | null
          id: string
          keywords: string[] | null
          product_name: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          keywords?: string[] | null
          product_name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          keywords?: string[] | null
          product_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_mappings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_mappings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_image_cache: {
        Row: {
          cached_at: string
          expires_at: string
          hit_count: number
          id: string
          query_normalized: string
          suggestions: Json
        }
        Insert: {
          cached_at?: string
          expires_at?: string
          hit_count?: number
          id?: string
          query_normalized: string
          suggestions: Json
        }
        Update: {
          cached_at?: string
          expires_at?: string
          hit_count?: number
          id?: string
          query_normalized?: string
          suggestions?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allow_lower_offers: boolean
          avatar_url: string | null
          birth_year: number | null
          city: string | null
          created_at: string | null
          default_courier_available: boolean
          default_handoff_available: boolean
          default_shipping_available: boolean
          discovery_max_miles: number | null
          email: string | null
          email_hash: string | null
          friends_avatar_url: string | null
          friends_display_name: string | null
          full_name: string | null
          gender: string | null
          handoff_max_miles: number
          id: string
          interests: string[] | null
          is_admin: boolean
          latitude: number | null
          life_phases: string[] | null
          location_visible_to_friends: boolean | null
          location_visible_to_public: boolean | null
          longitude: number | null
          onboarding_dismissed_at: string | null
          payouts_enabled: boolean | null
          phone_e164: string | null
          phone_hash: string | null
          phone_verified_at: string | null
          pickup_address: string | null
          pickup_availability_note: string | null
          pickup_blackout_dates: string[]
          pickup_phone: string | null
          public_avatar_url: string | null
          public_display_name: string | null
          push_token: string | null
          push_token_updated_at: string | null
          referral_credits: number
          referred_by: string | null
          state: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_charges_enabled: boolean | null
          terms_accepted_at: string | null
          terms_accepted_version: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          allow_lower_offers?: boolean
          avatar_url?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string | null
          default_courier_available?: boolean
          default_handoff_available?: boolean
          default_shipping_available?: boolean
          discovery_max_miles?: number | null
          email?: string | null
          email_hash?: string | null
          friends_avatar_url?: string | null
          friends_display_name?: string | null
          full_name?: string | null
          gender?: string | null
          handoff_max_miles?: number
          id: string
          interests?: string[] | null
          is_admin?: boolean
          latitude?: number | null
          life_phases?: string[] | null
          location_visible_to_friends?: boolean | null
          location_visible_to_public?: boolean | null
          longitude?: number | null
          onboarding_dismissed_at?: string | null
          payouts_enabled?: boolean | null
          phone_e164?: string | null
          phone_hash?: string | null
          phone_verified_at?: string | null
          pickup_address?: string | null
          pickup_availability_note?: string | null
          pickup_blackout_dates?: string[]
          pickup_phone?: string | null
          public_avatar_url?: string | null
          public_display_name?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          referral_credits?: number
          referred_by?: string | null
          state?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          terms_accepted_at?: string | null
          terms_accepted_version?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          allow_lower_offers?: boolean
          avatar_url?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string | null
          default_courier_available?: boolean
          default_handoff_available?: boolean
          default_shipping_available?: boolean
          discovery_max_miles?: number | null
          email?: string | null
          email_hash?: string | null
          friends_avatar_url?: string | null
          friends_display_name?: string | null
          full_name?: string | null
          gender?: string | null
          handoff_max_miles?: number
          id?: string
          interests?: string[] | null
          is_admin?: boolean
          latitude?: number | null
          life_phases?: string[] | null
          location_visible_to_friends?: boolean | null
          location_visible_to_public?: boolean | null
          longitude?: number | null
          onboarding_dismissed_at?: string | null
          payouts_enabled?: boolean | null
          phone_e164?: string | null
          phone_hash?: string | null
          phone_verified_at?: string | null
          pickup_address?: string | null
          pickup_availability_note?: string | null
          pickup_blackout_dates?: string[]
          pickup_phone?: string | null
          public_avatar_url?: string | null
          public_display_name?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          referral_credits?: number
          referred_by?: string | null
          state?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_charges_enabled?: boolean | null
          terms_accepted_at?: string | null
          terms_accepted_version?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reason: string
          reporter_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          reporter_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          created_at: string | null
          id: string
          result_count: number | null
          search_category: string | null
          search_term: string
          search_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          result_count?: number | null
          search_category?: string | null
          search_term: string
          search_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          result_count?: number | null
          search_category?: string | null
          search_term?: string
          search_type?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          event_id: string
          event_type: string
          payload: Json
          received_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          payload: Json
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          payload?: Json
          received_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      suggested_brands: {
        Row: {
          brand_name: string
          category_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          brand_name: string
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          brand_name?: string
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "suggested_brands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_brands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_brands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      suggestion_feedback: {
        Row: {
          actual_category_id: string | null
          created_at: string | null
          feedback_type: string
          id: string
          item_name: string
          notes: string | null
          suggested_category_id: string | null
          user_id: string
        }
        Insert: {
          actual_category_id?: string | null
          created_at?: string | null
          feedback_type: string
          id?: string
          item_name: string
          notes?: string | null
          suggested_category_id?: string | null
          user_id: string
        }
        Update: {
          actual_category_id?: string | null
          created_at?: string | null
          feedback_type?: string
          id?: string
          item_name?: string
          notes?: string | null
          suggested_category_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_feedback_actual_category_id_fkey"
            columns: ["actual_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_feedback_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      swap_offers: {
        Row: {
          counter_of_id: string | null
          created_at: string
          id: string
          message: string | null
          offered_item_id: string
          offerer_id: string
          recipient_id: string
          requested_item_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["swap_status"]
          updated_at: string
        }
        Insert: {
          counter_of_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          offered_item_id: string
          offerer_id: string
          recipient_id: string
          requested_item_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["swap_status"]
          updated_at?: string
        }
        Update: {
          counter_of_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          offered_item_id?: string
          offerer_id?: string
          recipient_id?: string
          requested_item_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["swap_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_offers_counter_of_id_fkey"
            columns: ["counter_of_id"]
            isOneToOne: false
            referencedRelation: "swap_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          buyer_handoff_confirmed_at: string | null
          buyer_id: string
          collection_id: string | null
          courier_fee_cents: number
          created_at: string
          currency: string
          delivery_method: string
          dispute_id: string | null
          dispute_reason: string | null
          disputed_at: string | null
          dropoff_address: string | null
          dropoff_name: string | null
          dropoff_notes: string | null
          dropoff_phone: string | null
          handed_off_at: string | null
          held_at: string | null
          id: string
          item_id: string | null
          kind: string
          metadata: Json
          payout_pending: boolean
          platform_fee_cents: number
          proposed_pickup_at: string | null
          refunded_at: string | null
          released_at: string | null
          request_id: string | null
          seller_accepted_at: string | null
          seller_amount_cents: number
          seller_declined_at: string | null
          seller_handoff_confirmed_at: string | null
          seller_id: string
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_transfer_id: string | null
          transfer_group: string | null
          uber_delivered_at: string | null
          uber_delivery_id: string | null
          uber_quote_id: string | null
          uber_status: string | null
          uber_tracking_url: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          buyer_handoff_confirmed_at?: string | null
          buyer_id: string
          collection_id?: string | null
          courier_fee_cents?: number
          created_at?: string
          currency?: string
          delivery_method?: string
          dispute_id?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          dropoff_address?: string | null
          dropoff_name?: string | null
          dropoff_notes?: string | null
          dropoff_phone?: string | null
          handed_off_at?: string | null
          held_at?: string | null
          id?: string
          item_id?: string | null
          kind: string
          metadata?: Json
          payout_pending?: boolean
          platform_fee_cents: number
          proposed_pickup_at?: string | null
          refunded_at?: string | null
          released_at?: string | null
          request_id?: string | null
          seller_accepted_at?: string | null
          seller_amount_cents: number
          seller_declined_at?: string | null
          seller_handoff_confirmed_at?: string | null
          seller_id: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          transfer_group?: string | null
          uber_delivered_at?: string | null
          uber_delivery_id?: string | null
          uber_quote_id?: string | null
          uber_status?: string | null
          uber_tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          buyer_handoff_confirmed_at?: string | null
          buyer_id?: string
          collection_id?: string | null
          courier_fee_cents?: number
          created_at?: string
          currency?: string
          delivery_method?: string
          dispute_id?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          dropoff_address?: string | null
          dropoff_name?: string | null
          dropoff_notes?: string | null
          dropoff_phone?: string | null
          handed_off_at?: string | null
          held_at?: string | null
          id?: string
          item_id?: string | null
          kind?: string
          metadata?: Json
          payout_pending?: boolean
          platform_fee_cents?: number
          proposed_pickup_at?: string | null
          refunded_at?: string | null
          released_at?: string | null
          request_id?: string | null
          seller_accepted_at?: string | null
          seller_amount_cents?: number
          seller_declined_at?: string | null
          seller_handoff_confirmed_at?: string | null
          seller_id?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          transfer_group?: string | null
          uber_delivered_at?: string | null
          uber_delivery_id?: string | null
          uber_quote_id?: string | null
          uber_status?: string | null
          uber_tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "transactions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "borrowing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_reputation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      transactions_backup_20260529: {
        Row: {
          amount_cents: number | null
          buyer_id: string | null
          collection_id: string | null
          created_at: string | null
          currency: string | null
          dispute_reason: string | null
          disputed_at: string | null
          held_at: string | null
          id: string | null
          item_id: string | null
          kind: string | null
          metadata: Json | null
          platform_fee_cents: number | null
          refunded_at: string | null
          released_at: string | null
          request_id: string | null
          seller_amount_cents: number | null
          seller_id: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_transfer_id: string | null
          transfer_group: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents?: number | null
          buyer_id?: string | null
          collection_id?: string | null
          created_at?: string | null
          currency?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          held_at?: string | null
          id?: string | null
          item_id?: string | null
          kind?: string | null
          metadata?: Json | null
          platform_fee_cents?: number | null
          refunded_at?: string | null
          released_at?: string | null
          request_id?: string | null
          seller_amount_cents?: number | null
          seller_id?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          transfer_group?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number | null
          buyer_id?: string | null
          collection_id?: string | null
          created_at?: string | null
          currency?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          held_at?: string | null
          id?: string | null
          item_id?: string | null
          kind?: string | null
          metadata?: Json | null
          platform_fee_cents?: number | null
          refunded_at?: string | null
          released_at?: string | null
          request_id?: string | null
          seller_amount_cents?: number | null
          seller_id?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          transfer_group?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          earned_at: string
          id: string
          meta: Json
          ref: string | null
          slug: string
          user_id: string
        }
        Insert: {
          earned_at?: string
          id?: string
          meta?: Json
          ref?: string | null
          slug: string
          user_id: string
        }
        Update: {
          earned_at?: string
          id?: string
          meta?: Json
          ref?: string | null
          slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_slug_fkey"
            columns: ["slug"]
            isOneToOne: false
            referencedRelation: "badge_catalog"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_bingo_boards: {
        Row: {
          board_id: string
          completed_at: string | null
          id: string
          lines_count: number
          started_at: string
          user_id: string
        }
        Insert: {
          board_id: string
          completed_at?: string | null
          id?: string
          lines_count?: number
          started_at?: string
          user_id: string
        }
        Update: {
          board_id?: string
          completed_at?: string | null
          id?: string
          lines_count?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bingo_boards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "challenge_bingo_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bingo_cell_fills: {
        Row: {
          cell_id: string
          filled_at: string
          id: string
          item_id: string
          user_board_id: string
          user_id: string
        }
        Insert: {
          cell_id: string
          filled_at?: string
          id?: string
          item_id: string
          user_board_id: string
          user_id: string
        }
        Update: {
          cell_id?: string
          filled_at?: string
          id?: string
          item_id?: string
          user_board_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bingo_cell_fills_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "challenge_bingo_cells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bingo_cell_fills_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bingo_cell_fills_user_board_id_fkey"
            columns: ["user_board_id"]
            isOneToOne: false
            referencedRelation: "user_bingo_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_satisfactions: {
        Row: {
          created_at: string
          day_number: number
          id: string
          item_id: string
          user_challenge_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          item_id: string
          user_challenge_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          item_id?: string
          user_challenge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_satisfactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_satisfactions_user_challenge_id_fkey"
            columns: ["user_challenge_id"]
            isOneToOne: false
            referencedRelation: "user_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          completed_at: string | null
          current_day: number
          id: string
          last_action_date: string | null
          started_at: string
          status: string
          streak_count: number
          template_id: string
          track: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_day?: number
          id?: string
          last_action_date?: string | null
          started_at?: string
          status?: string
          streak_count?: number
          template_id: string
          track: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_day?: number
          id?: string
          last_action_date?: string | null
          started_at?: string
          status?: string
          streak_count?: number
          template_id?: string
          track?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          kind: string
          note: string | null
          source_invite_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          source_invite_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          source_invite_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_source_invite_id_fkey"
            columns: ["source_invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_kit_slot_fills: {
        Row: {
          dont_own_reason: string | null
          filled_at: string
          id: string
          item_id: string | null
          quantity: number
          slot_id: string
          status: string
          user_id: string
          user_kit_id: string
        }
        Insert: {
          dont_own_reason?: string | null
          filled_at?: string
          id?: string
          item_id?: string | null
          quantity?: number
          slot_id: string
          status?: string
          user_id: string
          user_kit_id: string
        }
        Update: {
          dont_own_reason?: string | null
          filled_at?: string
          id?: string
          item_id?: string | null
          quantity?: number
          slot_id?: string
          status?: string
          user_id?: string
          user_kit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_kit_slot_fills_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_kit_slot_fills_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "challenge_kit_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_kit_slot_fills_user_kit_id_fkey"
            columns: ["user_kit_id"]
            isOneToOne: false
            referencedRelation: "user_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_kits: {
        Row: {
          completed_at: string | null
          id: string
          kit_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          kit_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          kit_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_kits_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "challenge_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lanes: {
        Row: {
          created_at: string
          lane: string
          user_id: string
        }
        Insert: {
          created_at?: string
          lane: string
          user_id: string
        }
        Update: {
          created_at?: string
          lane?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      want_match_notified: {
        Row: {
          created_at: string
          owner_id: string
          want_id: string
        }
        Insert: {
          created_at?: string
          owner_id: string
          want_id: string
        }
        Update: {
          created_at?: string
          owner_id?: string
          want_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "want_match_notified_want_id_fkey"
            columns: ["want_id"]
            isOneToOne: false
            referencedRelation: "item_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_premium_users: {
        Row: {
          user_id: string | null
        }
        Insert: {
          user_id?: string | null
        }
        Update: {
          user_id?: string | null
        }
        Relationships: []
      }
      user_reputation: {
        Row: {
          disputes_against: number | null
          lifetime_borrows: number | null
          lifetime_completed: number | null
          lifetime_lends: number | null
          measurable_returns: number | null
          on_time_pct: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      are_friends: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      bump_want_view: { Args: { p_want_id: string }; Returns: undefined }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      community_overlap: { Args: { top_n?: number }; Returns: Json }
      count_latent_owners: {
        Args: { _search_term: string; _user_id: string }
        Returns: {
          friends_count: number
          neighbors_count: number
        }[]
      }
      expire_stale_handshake_borrows: { Args: never; Returns: number }
      expire_stale_pending_requests: { Args: never; Returns: number }
      get_learned_category: {
        Args: { p_item_name: string; p_user_id: string }
        Returns: string
      }
      get_loop_score: { Args: { p_user_id: string }; Returns: number }
      get_or_create_forwarding_token: { Args: never; Returns: string }
      get_profile_stats: { Args: { p_user_id: string }; Returns: Json }
      get_user_display_info: {
        Args: { profile_user_id: string; viewer_id: string }
        Returns: {
          avatar_url: string
          display_name: string
        }[]
      }
      get_user_subscription_tier: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_want_match_counts: {
        Args: { p_wants: Json }
        Returns: {
          match_count: number
          want_id: string
        }[]
      }
      group_items: {
        Args: { _group_id: string }
        Returns: {
          admin_hidden: boolean
          admin_hidden_at: string | null
          admin_hidden_by: string | null
          admin_hidden_reason: string | null
          allow_offers: boolean
          brand: string | null
          category_id: string | null
          color: string | null
          condition: string | null
          courier_available: boolean
          created_at: string | null
          description: string | null
          dimensions: string | null
          donated_date: string | null
          donated_price: number | null
          eliminated_date: string | null
          handoff_available: boolean
          id: string
          image_urls: string[] | null
          is_available_for_sharing: boolean | null
          is_donated: boolean | null
          is_eliminated: boolean | null
          is_for_borrow: boolean
          is_for_sale: boolean
          is_sold: boolean | null
          love_rating: string | null
          name: string
          original_price: number | null
          personal_notes: string | null
          product_url: string | null
          purchase_date: string | null
          quantity: number | null
          rent_price: number | null
          rent_window: string
          sharing_level: string | null
          sharing_price: number | null
          shipping_available: boolean
          show_original_price: boolean
          size: string | null
          sold_date: string | null
          sold_price: number | null
          tags: string[] | null
          updated_at: string | null
          usage_frequency: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "inventory_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { conv_id: string; user_uuid: string }
        Returns: boolean
      }
      is_following: {
        Args: { _followee: string; _follower: string }
        Returns: boolean
      }
      is_phone_verified: { Args: { p_user?: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_premium: { Args: { p_user: string }; Returns: boolean }
      item_booked_ranges: {
        Args: { p_item_id: string }
        Returns: {
          end_date: string
          start_date: string
        }[]
      }
      leaderboard_weekly_rankings: {
        Args: {
          p_all_time?: boolean
          p_friend_ids?: string[]
          p_limit?: number
          p_scope: string
        }
        Returns: {
          city: string
          display_name: string
          rank_position: number
          user_id: string
          weekly_points: number
        }[]
      }
      match_contacts: {
        Args: { p_email_hashes?: string[]; p_phone_hashes?: string[] }
        Returns: {
          city: string
          id: string
          public_avatar_url: string
          public_display_name: string
          state: string
        }[]
      }
      nearby_profiles: {
        Args: { p_lat: number; p_lng: number; p_radius_miles?: number }
        Returns: {
          city: string
          distance_miles: number
          id: string
          public_avatar_url: string
          public_display_name: string
          state: string
        }[]
      }
      notify_want_matches: { Args: { p_want?: string }; Returns: number }
      pymk_age_affinity: {
        Args: { p_candidates: string[] }
        Returns: {
          age_score: number
          id: string
        }[]
      }
      redeem_invite: { Args: { p_token: string }; Returns: boolean }
      send_date_reminders: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      event_status: "draft" | "published" | "cancelled" | "completed"
      event_type:
        | "swap_party"
        | "repair_cafe"
        | "stoop_sale"
        | "donation_drive"
        | "lending_circle"
        | "skill_share"
      request_audience: "friends" | "neighbors" | "both"
      request_status: "open" | "fulfilled" | "closed"
      rsvp_status: "going" | "interested" | "waitlist"
      swap_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "countered"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "user"],
      event_status: ["draft", "published", "cancelled", "completed"],
      event_type: [
        "swap_party",
        "repair_cafe",
        "stoop_sale",
        "donation_drive",
        "lending_circle",
        "skill_share",
      ],
      request_audience: ["friends", "neighbors", "both"],
      request_status: ["open", "fulfilled", "closed"],
      rsvp_status: ["going", "interested", "waitlist"],
      swap_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "countered",
      ],
    },
  },
} as const
