export interface Message {
  id: number;
  sender: 'me' | 'customer';
  text: string;
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  phone: string;
  isOnline: boolean;
  tags: string[];
}

export interface Conversation {
  id: string;
  customer: Customer;
  messages: Message[];
  lastMessageTimestamp: string;
  unreadCount: number;
}

export const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    customer: {
      id: 'cust1',
      name: 'Nguyễn Văn A',
      avatarUrl: '/placeholder.svg',
      email: 'nguyenvana@example.com',
      phone: '090-123-4567',
      isOnline: true,
      tags: ['VIP', 'Hanoi'],
    },
    messages: [
      { id: 1, sender: 'customer', text: 'Chào shop, tôi muốn hỏi về sản phẩm XYZ.', timestamp: '10:30 AM' },
      { id: 2, sender: 'me', text: 'Chào bạn, sản phẩm XYZ vẫn còn hàng ạ. Bạn muốn tư vấn thêm gì không?', timestamp: '10:31 AM' },
      { id: 3, sender: 'customer', text: 'Sản phẩm này có những màu nào vậy?', timestamp: '10:32 AM' },
    ],
    lastMessageTimestamp: '10:32 AM',
    unreadCount: 1,
  },
  {
    id: 'conv2',
    customer: {
      id: 'cust2',
      name: 'Trần Thị B',
      avatarUrl: '/placeholder.svg',
      email: 'tranthib@example.com',
      phone: '091-234-5678',
      isOnline: false,
      tags: ['New Customer'],
    },
    messages: [
      { id: 1, sender: 'customer', text: 'Cảm ơn shop đã tư vấn nhé.', timestamp: 'Yesterday' },
      { id: 2, sender: 'me', text: 'Không có gì ạ. Cần hỗ trợ gì thêm bạn cứ nhắn nhé!', timestamp: 'Yesterday' },
    ],
    lastMessageTimestamp: 'Yesterday',
    unreadCount: 0,
  },
  {
    id: 'conv3',
    customer: {
      id: 'cust3',
      name: 'Lê Văn C',
      avatarUrl: '/placeholder.svg',
      email: 'levanc@example.com',
      phone: '098-765-4321',
      isOnline: true,
      tags: ['Returning'],
    },
    messages: [
       { id: 1, sender: 'customer', text: 'Đơn hàng của tôi đã được gửi chưa?', timestamp: '9:00 AM' },
    ],
    lastMessageTimestamp: '9:00 AM',
    unreadCount: 0,
  },
];