import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/';
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      setIsLoading(false);
    }
  };

  // Guest login removed as requested
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex flex-col md:flex-row w-full max-w-6xl gap-8">
        {/* Promotional Content */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Meet AI SuperAgent</h1>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              The only agent that remembers everything and runs everything.
            </p>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300">
            Live VectorVault memory + plug-and-play MCP tools. Drag-and-drop docs, paste any API key, and let 2,550+ actions run themselves.
          </p>
          
          <div className="flex gap-4 pt-2">
            <Button className="gap-2" size="lg">
              Launch Free Workspace
            </Button>
            <Button variant="outline" className="gap-2" size="lg">
              Watch 30-sec demo
            </Button>
          </div>
          
          <div className="pt-4">
            <div className="text-sm bg-secondary text-secondary-foreground rounded-md px-2 py-1 inline-block">SynasporeCore + VectorVault – Zero Amnesia AI</div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Why Memory Matters</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Context Windows Forget</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Traditional agents hallucinate because they lose context after each conversation.</p>
                </div>
                <div>
                  <p className="font-medium">VectorVault Remembers</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Every chat & doc stored as live embeddings for instant recall, zero re-upload.</p>
                </div>
                <div>
                  <p className="font-medium">Persistent Knowledge</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reusable knowledge across teams and sessions that never gets lost.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">How It Works</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs">1</div>
                  <div>
                    <p className="font-medium">Drop & Paste</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Drop docs or paste API keys once.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs">2</div>
                  <div>
                    <p className="font-medium">Auto-Index</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">VectorVault auto-indexes; MCP tools auto-register.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs">3</div>
                  <div>
                    <p className="font-medium">Execute</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ask in chat: "@web-scrape → @midjourney → @slack" – results stream back in real time.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Tools at Your Fingertips</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">2,550+ integrations and counting</p>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="border rounded-md px-2 py-1 text-center">OpenAI</div>
                <div className="border rounded-md px-2 py-1 text-center">Claude</div>
                <div className="border rounded-md px-2 py-1 text-center">Gemini</div>
                <div className="border rounded-md px-2 py-1 text-center">Replicate</div>
                <div className="border rounded-md px-2 py-1 text-center">ElevenLabs</div>
                <div className="border rounded-md px-2 py-1 text-center">GitHub</div>
                <div className="border rounded-md px-2 py-1 text-center">Notion</div>
                <div className="border rounded-md px-2 py-1 text-center">Slack</div>
                <div className="border rounded-md px-2 py-1 text-center">Make</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Login Form */}
        <div className="flex-1 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="flex justify-between w-full">
                <Button variant="ghost" onClick={() => navigate('/register')}>
                  Create account
                </Button>
                <Button variant="ghost" onClick={() => navigate('/forgot-password')}>
                  Forgot password?
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <div className="mt-6 space-y-4">
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">Launch Pricing</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div className="space-y-2">
                  <h4 className="font-medium">Free Tier</h4>
                  <p className="text-2xl font-bold">$0</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>3 bases</p>
                    <p>10 GB storage</p>
                    <p>20k tool runs/mo</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">Start Free</Button>
                </div>
                <div className="space-y-2 relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md">Most Popular</div>
                  <h4 className="font-medium">Pro</h4>
                  <p className="text-2xl font-bold">$49/mo</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>5M tokens</p>
                    <p>50 flows</p>
                    <p>Priority API access</p>
                  </div>
                  <Button size="sm" className="w-full">Upgrade to Pro</Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Enterprise</h4>
                  <p className="text-2xl font-bold">Custom</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>VPC deployment</p>
                    <p>SSO integration</p>
                    <p>SOC-2 compliance</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">Contact Sales</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
