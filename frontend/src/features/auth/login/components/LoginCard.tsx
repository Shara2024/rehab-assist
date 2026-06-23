import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useLogin } from "../hooks/useLogin";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginCard() {
  const { state } = useAuth();
  const { login } = useLogin();

  const [identifier, setIdentifier] = useState("rcc_a_001");
  const [password, setPassword] = useState("Admin@1234");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(identifier, password);
  };

  return (
    <div className="w-full max-w-sm md:max-w-md pr-10">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue your RehabAssist program
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            {state.error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="identifier">Username</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="rcc_a_001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={state.isLoading}
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={state.isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full text-black"
              disabled={state.isLoading}
            >
              {state.isLoading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Don’t have an account?{" "}
              <Link to="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>

            <div className="text-center text-[11px] text-muted-foreground">
              By continuing, you agree to basic Terms and Privacy Policy.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
