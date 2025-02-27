
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Bell, 
  Layout, 
  PaintBucket, 
  Lock, 
  Globe, 
  Zap,
  Share2,
  HardDrive,
  Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  const [formState, setFormState] = useState({
    name: user?.name || '',
    email: user?.email || '',
    language: 'english',
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    autoSave: true,
    dataSync: true,
    aiSuggestions: true,
    colorMode: 'system',
    timezone: 'UTC-0',
    startWeek: 'monday',
    timeFormat: '12hour'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: string, value: boolean) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (section: string) => {
    toast({
      title: "Settings updated",
      description: `Your ${section} settings have been saved successfully.`
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1 py-2">
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${activeTab === 'account' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('account')}
                >
                  <User className="h-4 w-4" />
                  Account
                </button>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${activeTab === 'appearance' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('appearance')}
                >
                  <PaintBucket className="h-4 w-4" />
                  Appearance
                </button>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${activeTab === 'notifications' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                </button>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${activeTab === 'preferences' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('preferences')}
                >
                  <Layout className="h-4 w-4" />
                  Preferences
                </button>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${activeTab === 'ai' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('ai')}
                >
                  <Zap className="h-4 w-4" />
                  AI Features
                </button>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${activeTab === 'data' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('data')}
                >
                  <HardDrive className="h-4 w-4" />
                  Data & Privacy
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your personal information and account security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Profile Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formState.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formState.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <Button onClick={() => handleSave('profile')}>Save Changes</Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Password</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          name="currentPassword"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          name="newPassword"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <Button onClick={() => handleSave('password')}>Update Password</Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Actions</h3>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={logout}>Sign Out</Button>
                      <Button variant="destructive">Delete Account</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the application looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Theme</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Color Mode</Label>
                        <Select 
                          value={formState.colorMode}
                          onValueChange={(value) => handleSelectChange('colorMode', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select color mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Font Size</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Small</span>
                        <span className="text-sm">Large</span>
                      </div>
                      <Slider defaultValue={[50]} max={100} step={10} />
                    </div>
                  </div>
                  
                  <Button onClick={() => handleSave('appearance')}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-gray-500">Receive task and reminder emails</p>
                        </div>
                        <Switch 
                          checked={formState.emailNotifications}
                          onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                        </div>
                        <Switch 
                          checked={formState.pushNotifications}
                          onCheckedChange={(checked) => handleToggle('pushNotifications', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Sound Alerts</Label>
                          <p className="text-sm text-gray-500">Play sounds for notifications</p>
                        </div>
                        <Switch 
                          checked={formState.soundEnabled}
                          onCheckedChange={(checked) => handleToggle('soundEnabled', checked)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={() => handleSave('notifications')}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize how the scheduler works for you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Time & Date</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Time Format</Label>
                        <Select 
                          value={formState.timeFormat}
                          onValueChange={(value) => handleSelectChange('timeFormat', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12hour">12-hour (1:00 PM)</SelectItem>
                            <SelectItem value="24hour">24-hour (13:00)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Start of Week</Label>
                        <Select 
                          value={formState.startWeek}
                          onValueChange={(value) => handleSelectChange('startWeek', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select start day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select 
                          value={formState.timezone}
                          onValueChange={(value) => handleSelectChange('timezone', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                            <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                            <SelectItem value="UTC+0">UTC+0</SelectItem>
                            <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                            <SelectItem value="UTC+5:30">Indian Standard Time (UTC+5:30)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Language</h3>
                    <div className="space-y-2">
                      <Label>Display Language</Label>
                      <Select 
                        value={formState.language}
                        onValueChange={(value) => handleSelectChange('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                          <SelectItem value="japanese">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={() => handleSave('preferences')}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'ai' && (
            <Card>
              <CardHeader>
                <CardTitle>AI Features</CardTitle>
                <CardDescription>Configure AI-powered productivity tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">AI Assistant</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>AI Scheduling Suggestions</Label>
                          <p className="text-sm text-gray-500">Get AI-powered time slot recommendations</p>
                        </div>
                        <Switch 
                          checked={formState.aiSuggestions}
                          onCheckedChange={(checked) => handleToggle('aiSuggestions', checked)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>AI Learning Level</Label>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Conservative</span>
                            <span className="text-sm">Aggressive</span>
                          </div>
                          <Slider defaultValue={[70]} max={100} step={10} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Higher values make the AI adapt more quickly to your changing habits
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">AI Privacy</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Share Usage Data to Improve AI</Label>
                          <p className="text-sm text-gray-500">Help us improve recommendations (anonymized data only)</p>
                        </div>
                        <Switch 
                          checked={true}
                          onCheckedChange={() => {}}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={() => handleSave('ai')}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Manage your data and privacy settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Storage</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Autosave Changes</Label>
                          <p className="text-sm text-gray-500">Automatically save changes to tasks and settings</p>
                        </div>
                        <Switch 
                          checked={formState.autoSave}
                          onCheckedChange={(checked) => handleToggle('autoSave', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Cloud Synchronization</Label>
                          <p className="text-sm text-gray-500">Sync your data across devices</p>
                        </div>
                        <Switch 
                          checked={formState.dataSync}
                          onCheckedChange={(checked) => handleToggle('dataSync', checked)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Privacy</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Activity Tracking</Label>
                          <p className="text-sm text-gray-500">Track your activity to improve recommendations</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline">Export Your Data</Button>
                    </div>
                  </div>
                  
                  <Button onClick={() => handleSave('data')}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
