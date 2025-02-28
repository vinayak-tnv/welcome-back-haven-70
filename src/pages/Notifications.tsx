
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Bell, Smartphone, Tablet, Laptop } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const Notifications = () => {
  const { toast } = useToast();
  
  const handleToggleDevice = (device: string, enabled: boolean) => {
    toast({
      title: `${device} notifications ${enabled ? 'enabled' : 'disabled'}`,
      description: `You will ${enabled ? 'now' : 'no longer'} receive notifications on your ${device.toLowerCase()}.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-gray-600">Manage where and how you receive notifications</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notification Devices</CardTitle>
                <CardDescription>Manage which devices receive notifications</CardDescription>
              </div>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                Mobile Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium">Mobile Phone</h3>
                  <p className="text-sm text-gray-500">Notifications sent via mobile app</p>
                </div>
              </div>
              <Switch id="mobile-notifications" defaultChecked onCheckedChange={(checked) => handleToggleDevice('Mobile', checked)} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full">
                  <Tablet className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium">Tablet</h3>
                  <p className="text-sm text-gray-500">Notifications sent to tablet devices</p>
                </div>
              </div>
              <Switch id="tablet-notifications" onCheckedChange={(checked) => handleToggleDevice('Tablet', checked)} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full">
                  <Laptop className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium">Desktop</h3>
                  <p className="text-sm text-gray-500">Browser notifications</p>
                </div>
              </div>
              <Switch id="desktop-notifications" defaultChecked onCheckedChange={(checked) => handleToggleDevice('Desktop', checked)} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Mobile Connection</CardTitle>
            <CardDescription>Sync your schedule with your mobile device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium">Mobile App Connected</h3>
              </div>
              <p className="text-sm text-gray-600">
                Notifications will be sent to your mobile device. You will receive alerts for:
              </p>
              <ul className="text-sm text-gray-600 mt-2 ml-6 list-disc">
                <li>Task reminders 15 minutes before scheduled time</li>
                <li>Daily schedule summary each morning</li>
                <li>AI scheduling suggestions</li>
                <li>Updates to shared tasks and invitations</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Don't have the mobile app yet? Scan the QR code or search for "Planify" in your app store.
              </p>
              <div className="flex items-center justify-center mt-4">
                <div className="bg-gray-200 w-32 h-32 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-500">QR Code Placeholder</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
