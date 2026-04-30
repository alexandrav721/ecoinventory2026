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
  public: {
    Tables: {
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
      borrowing_requests: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          item_id: string
          message: string | null
          owner_id: string
          requested_at: string
          requester_id: string
          responded_at: string | null
          response_message: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          item_id: string
          message?: string | null
          owner_id: string
          requested_at?: string
          requester_id: string
          responded_at?: string | null
          response_message?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          item_id?: string
          message?: string | null
          owner_id?: string
          requested_at?: string
          requester_id?: string
          responded_at?: string | null
          response_message?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
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
            foreignKeyName: "borrowing_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        ]
      }
      inventory_items: {
        Row: {
          brand: string | null
          category_id: string | null
          color: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          dimensions: string | null
          donated_date: string | null
          donated_price: number | null
          eliminated_date: string | null
          id: string
          image_urls: string[] | null
          is_available_for_sharing: boolean | null
          is_donated: boolean | null
          is_eliminated: boolean | null
          is_sold: boolean | null
          name: string
          original_price: number | null
          purchase_date: string | null
          quantity: number | null
          sharing_level: string | null
          sharing_price: number | null
          size: string | null
          sold_date: string | null
          sold_price: number | null
          tags: string[] | null
          updated_at: string | null
          usage_frequency: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          donated_date?: string | null
          donated_price?: number | null
          eliminated_date?: string | null
          id?: string
          image_urls?: string[] | null
          is_available_for_sharing?: boolean | null
          is_donated?: boolean | null
          is_eliminated?: boolean | null
          is_sold?: boolean | null
          name: string
          original_price?: number | null
          purchase_date?: string | null
          quantity?: number | null
          sharing_level?: string | null
          sharing_price?: number | null
          size?: string | null
          sold_date?: string | null
          sold_price?: number | null
          tags?: string[] | null
          updated_at?: string | null
          usage_frequency?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          donated_date?: string | null
          donated_price?: number | null
          eliminated_date?: string | null
          id?: string
          image_urls?: string[] | null
          is_available_for_sharing?: boolean | null
          is_donated?: boolean | null
          is_eliminated?: boolean | null
          is_sold?: boolean | null
          name?: string
          original_price?: number | null
          purchase_date?: string | null
          quantity?: number | null
          sharing_level?: string | null
          sharing_price?: number | null
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
        ]
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
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          item_id: string | null
          message: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          item_id?: string | null
          message: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          item_id?: string | null
          message?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
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
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          city: string | null
          created_at: string | null
          email: string | null
          friends_avatar_url: string | null
          friends_display_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          latitude: number | null
          location_visible_to_friends: boolean | null
          location_visible_to_public: boolean | null
          longitude: number | null
          public_avatar_url: string | null
          public_display_name: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          friends_avatar_url?: string | null
          friends_display_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          interests?: string[] | null
          latitude?: number | null
          location_visible_to_friends?: boolean | null
          location_visible_to_public?: boolean | null
          longitude?: number | null
          public_avatar_url?: string | null
          public_display_name?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          friends_avatar_url?: string | null
          friends_display_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          latitude?: number | null
          location_visible_to_friends?: boolean | null
          location_visible_to_public?: boolean | null
          longitude?: number | null
          public_avatar_url?: string | null
          public_display_name?: string | null
          state?: string | null
          updated_at?: string | null
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
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_friends: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      get_learned_category: {
        Args: { p_item_name: string; p_user_id: string }
        Returns: string
      }
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
      rsvp_status: "going" | "interested" | "waitlist"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
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
      rsvp_status: ["going", "interested", "waitlist"],
    },
  },
} as const
