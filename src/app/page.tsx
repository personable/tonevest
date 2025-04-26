
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Guitar } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <Card className="w-full max-w-md border rounded-none">
        <CardHeader className="text-center bg-primary text-primary-foreground p-4 border-b border-border">
          <div className="flex justify-center items-center gap-2 mb-1">
            <Guitar className="w-8 h-8" />
            <CardTitle className="text-3xl font-bold font-serif">Pedal Identifier</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80 text-md">
            Your AI-powered advisor for guitar pedal identification and valuation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6 text-center">
          <p className="text-lg text-foreground/90">
            Welcome! Identify your guitar pedals, get estimated used market values, and receive... unique financial advice.
          </p>
          <Link href="/identify" passHref>
            <Button
              size="lg"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 rounded-none transition-all duration-200 ease-in-out"
            >
              Start Identifying Pedals
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
       <footer className="mt-8 text-center text-xs text-muted-foreground">
         Powered by Genkit AI
       </footer>
    </main>
  );
}
