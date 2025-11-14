import { Tag } from "@/pages/Tags";

// Represents a customer from Zalo
export interface ZaloCustomer {
  id: string | null; // ID có thể là null nếu khách hàng chưa được tạo trong bảng customers
  zalo_id: string;
  display_name: string;
  avatar_url: string | null;
}

// Represents a single message in a conversation
export interface ZaloMessage {
  id: string;
  conversation_id: string;
  content: string | null;
  sent_at: string;
  is_from_customer: boolean;
  sender_zalo_id: string;
}

// Represents a conversation item in the inbox list
export type ConversationInboxItem = {
  id: string; // This is the threadId (zalo_id)
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  customer: ZaloCustomer | null; // Customer can be null if not yet created in the customers table
  tags: Tag[];
};

// Represents a single note for a customer
export interface CustomerNote {
  id: string;
  customer_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Represents a scheduled message
export interface ScheduledMessage {
  id: string;
  user_id: string;
  customer_id: string;
  thread_id: string;
  content: string | null;
  image_url: string | null;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  prompt_log: string | null;
}