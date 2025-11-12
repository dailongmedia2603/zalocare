import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ConversationInboxItem } from '@/types/chat';
import { Mail, Phone, PlusCircle } from 'lucide-react';

interface CustomerInfoPanelProps {
  conversation: ConversationInboxItem | null;
}

const CustomerInfoPanel = ({ conversation }: CustomerInfoPanelProps) => {
  if (!conversation || !conversation.customer) {
    return <div className="w-[360px] border-l bg-gray-50"></div>;
  }

  const { customer } = conversation;
  const customerName = customer.display_name || 'Unknown User';

  return (
    <div className="w-[360px] border-l flex flex-col">
      <div className="p-4 text-center border-b">
        <Avatar className="w-20 h-20 mx-auto">
          <AvatarImage src={customer.avatar_url || '/placeholder.svg'} />
          <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="mt-3 font-bold text-lg">{customerName}</h3>
        {/* Online status can be added later */}
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Thông tin liên hệ</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              {/* Email can be added to customer table later */}
              <span>Chưa có email</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              {/* Phone can be added to customer table later */}
              <span>Chưa có SĐT</span>
            </div>
          </div>
        </div>
        <Separator />
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-600">Tags</h4>
            <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
              <PlusCircle className="w-4 h-4 mr-1" />
              Thêm
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Tags can be implemented later */}
            <Badge variant="secondary">Customer</Badge>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Ghi chú</h4>
          <Textarea placeholder="Thêm ghi chú về khách hàng..." rows={5} />
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoPanel;