import { Tag } from "@/pages/Tags";

// Represents a customer from Zalo
export interface ZaloCustomer {
  id: string;
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
  id: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  customer: ZaloCustomer;
  tags: Tag[]; // Add tags to the conversation type
};