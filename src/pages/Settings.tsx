import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Webhook, Link2 } from "lucide-react";
import GeminiCustomSettings from "@/components/GeminiCustomSettings";
import ZaloConnectionSettings from "@/components/ZaloConnectionSettings";
import N8NWebhookSettings from "@/components/N8NWebhookSettings";

const Settings = () => {
  return (
    <div className="flex-1 p-6 w-full">
      <h2 className="text-2xl font-bold mb-6">Cài đặt</h2>
      <Tabs defaultValue="zalo" className="w-full">
        <TabsList className="h-auto justify-start bg-transparent p-0 gap-4">
          <TabsTrigger
            value="zalo"
            className="flex items-center gap-3 p-3 border rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:border-orange-200 data-[state=active]:shadow-sm"
          >
            <div className="p-2 bg-blue-600 rounded-md border border-blue-700">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-700">
              Kết nối Zalo
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="gemini"
            className="flex items-center gap-3 p-3 border rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:border-orange-200 data-[state=active]:shadow-sm"
          >
            <div className="p-2 bg-orange-600 rounded-md border border-orange-700">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-700">
              API Gemini Custom
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="webhook"
            className="flex items-center gap-3 p-3 border rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:border-orange-200 data-[state=active]:shadow-sm"
          >
            <div className="p-2 bg-green-600 rounded-md border border-green-700">
              <Webhook className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-700">
              Webhook N8N
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="zalo" className="mt-6">
          <div className="p-6 border rounded-lg bg-white">
            <ZaloConnectionSettings />
          </div>
        </TabsContent>
        <TabsContent value="gemini" className="mt-6">
          <div className="p-6 border rounded-lg bg-white">
            <GeminiCustomSettings />
          </div>
        </TabsContent>
        <TabsContent value="webhook" className="mt-6">
          <div className="p-6 border rounded-lg bg-white">
            <N8NWebhookSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;