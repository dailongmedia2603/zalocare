import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Conversation } from '@/data/mock-chat-data';
import { Mail, Phone, PlusCircle } from 'lucide-react';

interface CustomerInfoPanelProps {
  conversation: Conversation | null;
}

const CustomerInfoPanel = ({ conversation }: CustomerInfoPanelProps) => {
  if (!conversation) {
    return <div className="w-[360px] border-l bg-gray-50"></div>;
  }

  const { customer } = conversation;

  return (
    <div className="w-[360px] border-l flex flex-col">
      <div className="p-4 text-center border-b">
        <Avatar className="w-20 h-20 mx-auto">
          <AvatarImage src={customer.avatarUrl} />
          <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="mt-3 font-bold text-lg">{customer.name}</h3>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <div className={`w-2 h-2 rounded-full ${customer.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-500">{customer.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Thông tin liên hệ</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{customer.phone}</span>
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
            {customer.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
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