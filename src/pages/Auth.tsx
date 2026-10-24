import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { AtSign, KeyRound, User, Eye, EyeOff } from 'lucide-react';

const brandMark = new URL('brand/veritas-mark.png', document.baseURI).href;

const trustPoints = [
  'Persistent vector memory across every conversation',
  'Plug-and-play MCP tool orchestration',
  'Bring your own model — OpenAI, Anthropic, Gemini, DeepSeek and more',
];

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ email: formData.email, password: formData.password });
      navigate('/');
    } catch (err) {
      console.error("Sign in failed", err);
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await register({ 
        email: formData.email, 
        password: formData.password, 
        name: formData.displayName 
      });
      navigate('/');
    } catch (err) {
      console.error("Sign up failed", err);
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-navy-deep p-12 text-paper lg:flex">
        <div className="flex items-center gap-3">
          <img src={brandMark} alt="Veritas Global AI" className="h-12 w-12 object-contain" />
          <div>
            <div className="flex items-baseline gap-1.5 leading-tight">
              <span className="font-serif text-xl font-semibold text-white">Veritas</span>
              <span className="text-lg font-medium text-white/90">SynapseCore</span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              AI Agent + Vector Vault
            </div>
          </div>
        </div>

        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight text-white">
            The agent that remembers everything and runs everything.
          </h2>
          <div className="mt-8 space-y-3">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-2 h-px w-4 shrink-0 bg-gold" />
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-white/40">
          © {new Date().getFullYear()} Veritas Global AI. All rights reserved.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand */}
          <div className="flex items-center justify-center gap-3 lg:hidden">
            <img src={brandMark} alt="Veritas Global AI" className="h-10 w-10 object-contain" />
            <div className="text-left">
              <div className="flex items-baseline gap-1.5 leading-tight">
                <span className="font-serif text-lg font-semibold text-ink">Veritas</span>
                <span className="text-base font-medium text-ink">SynapseCore</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                AI Agent + Vector Vault
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold text-ink">Welcome</h1>
            <p className="text-muted-foreground">
              Sign in or create an account to continue
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Card className="border-line">
            <CardContent className="pt-6">
              <Tabs value={tab} onValueChange={(v) => setTab(v as 'signin' | 'signup')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin" className="pt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup" className="pt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-displayName"
                        name="displayName"
                        type="text"
                        placeholder="Full Name"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long
                    </p>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading || !formData.email || !formData.password || formData.password.length < 6}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing up, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
