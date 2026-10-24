import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import AuthContext from '../contexts/AuthContext';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

const brandMark = new URL('brand/veritas-mark.png', document.baseURI).href;

interface LocationState {
  from?: {
    pathname: string;
  };
}

// Inner component that uses the auth context
const LoginInner = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the context directly
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/';
  
  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (auth?.isAuthenticated) {
      console.log('User already authenticated, redirecting to dashboard...');
      // Use replace: true to prevent adding to history stack
      navigate('/', { replace: true });
    }
  }, [auth?.isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Check if auth context is available
      if (!auth) {
        throw new Error('Authentication service not available');
      }
      
      // Login using auth service
      await auth.login({ email, password });
      
      console.log('Login successful, redirecting to dashboard...');
      
      // Store login success in sessionStorage
      sessionStorage.setItem('login_success', 'true');
      localStorage.setItem('last_login', new Date().toISOString());
      
      // Use a single, clean redirect method to prevent flickering
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3">
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

        <Card className="w-full border-line">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-ink">Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <a href="/register" className="text-primary hover:text-gold transition-colors underline underline-offset-4">
                Register
              </a>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Veritas Global AI
        </p>
      </div>
    </div>
  );
};

// Wrapper component that ensures AuthProvider is applied
const Login = () => {
  return (
    <AuthProvider>
      <LoginInner />
    </AuthProvider>
  );
};

export default Login;
