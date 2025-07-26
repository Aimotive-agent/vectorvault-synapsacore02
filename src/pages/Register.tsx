import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import AuthContext from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import './Login.css';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Separator } from '../components/ui/separator';

const RegisterInner = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the context directly
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if auth context is available
      if (!auth) {
        throw new Error('Authentication service not available');
      }
      
      await auth.register({ name, email, password });
      
      // Store registration success in sessionStorage
      sessionStorage.setItem('registration_success', 'true');
      localStorage.setItem('last_login', new Date().toISOString());
      
      // Use a single, clean redirect method to prevent flickering
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 overflow-hidden">
      <div className="flex flex-row w-full max-w-7xl gap-8 h-screen items-center">
        {/* Promotional Content - Left Side */}
        <div className="flex-1 h-full overflow-y-auto py-8 pr-4 hide-scrollbar">
          <div className="space-y-4 mb-6">
            <h1 className="text-4xl font-bold tracking-tight">Meet AI SuperAgent</h1>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              The only agent that remembers everything and runs everything.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Live VectorVault memory + plug-and-play MCP tools. Drag-and-drop docs, paste any API key, and let 2,550+ actions run themselves.
            </p>
          </div>
          
          <div className="flex gap-4 mb-6">
            <Button className="gap-2" size="lg">
              Launch Free Workspace
            </Button>
            <Button variant="outline" className="gap-2" size="lg">
              Watch 30-sec demo
            </Button>
          </div>
          
          <div className="mb-6">
            <div className="text-sm bg-secondary text-secondary-foreground rounded-md px-2 py-1 inline-block">SynasporeCore + VectorVault – Zero Amnesia AI</div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="grid grid-cols-3 gap-8">
            {/* Why Memory Matters */}
            <div>
              <h3 className="text-lg font-medium mb-4">Why Memory Matters</h3>
              <div className="space-y-3">
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
            
            {/* How It Works */}
            <div>
              <h3 className="text-lg font-medium mb-4">How It Works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</div>
                  <div>
                    <p className="font-medium">Drop & Paste</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Drop docs or paste API keys once.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</div>
                  <div>
                    <p className="font-medium">Auto-Index</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">VectorVault auto-indexes; MCP tools auto-register.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</div>
                  <div>
                    <p className="font-medium">Execute</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ask in chat: @web-scrape → @midjourney → @slack</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tools at Your Fingertips */}
            <div>
              <h3 className="text-lg font-medium mb-4">Tools at Your Fingertips</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2"></div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2"></div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2"></div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2"></div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2"></div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">2,550+ integrations and counting</p>
            </div>
          </div>
        </div>
        
        {/* Registration Form - Right Side */}
        <div className="w-96">
          <Card>
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>Enter your information to create an account</CardDescription>
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
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
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
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center pt-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Already have an account? Sign in
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Wrap the inner component with AuthProvider
const RegisterContent = () => {
  return (
    <AuthProvider>
      <RegisterInner />
    </AuthProvider>
  );
};

export default RegisterContent;
