export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PaymentRequest = {
  id: string;
  merchant_id: string;
  stellar_destination: string;
  amount: string;
  asset_code: string;
  asset_issuer: string | null;
  memo: string;
  status: "pending" | "paid" | "expired";
  expires_at: string;
  paid_at: string | null;
  created_at: string;
};

type Table<Row, Insert = Row, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      merchants: Table<
        {
          id: string;
          user_id: string;
          business_name: string;
          slug: string | null;
          stellar_public_key: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          business_name: string;
          slug?: string | null;
          stellar_public_key?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      products: Table<
        {
          id: string;
          merchant_id: string;
          name: string;
          description: string | null;
          price: number;
          asset_code: string;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          merchant_id: string;
          name: string;
          description?: string | null;
          price: number;
          asset_code?: string;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      payment_requests: Table<
        {
          id: string;
          merchant_id: string;
          product_id: string | null;
          title: string;
          description: string | null;
          amount: number;
          asset_code: string;
          status: "pending" | "paid" | "expired" | "cancelled";
          stellar_destination: string;
          memo: string;
          expires_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          merchant_id: string;
          product_id?: string | null;
          title: string;
          description?: string | null;
          amount: number;
          asset_code?: string;
          status?: "pending" | "paid" | "expired" | "cancelled";
          stellar_destination: string;
          memo: string;
          expires_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          product_id?: string | null;
          title?: string;
          description?: string | null;
          amount?: number;
          asset_code?: string;
          status?: "pending" | "paid" | "expired" | "cancelled";
          stellar_destination?: string;
          memo?: string;
          expires_at?: string | null;
          paid_at?: string | null;
          updated_at?: string;
        }
      >;
      transactions: Table<
        {
          id: string;
          payment_request_id: string;
          merchant_id: string;
          stellar_tx_hash: string;
          source_wallet: string | null;
          destination_wallet: string | null;
          amount: number | null;
          asset_code: string | null;
          verified_at: string;
          raw_payload: Json | null;
          created_at: string;
        },
        {
          id?: string;
          payment_request_id: string;
          merchant_id: string;
          stellar_tx_hash: string;
          source_wallet?: string | null;
          destination_wallet?: string | null;
          amount?: number | null;
          asset_code?: string | null;
          verified_at?: string;
          raw_payload?: Json | null;
          created_at?: string;
        }
      >;
      receipts: Table<
        {
          id: string;
          payment_request_id: string;
          merchant_id: string;
          receipt_number: string;
          created_at: string;
        },
        {
          id?: string;
          payment_request_id: string;
          merchant_id: string;
          receipt_number: string;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
