'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
        toast({
          variant: 'destructive',
          title: 'Firebase Permission Denied',
          description: error.message,
          duration: 10000,
        });

        if (process.env.NODE_ENV === 'development') {
          // Throwing in a timeout to break out of the current render cycle
          // and allow the Next.js error overlay to catch it.
          setTimeout(() => {
            throw error;
          }, 0);
        } else {
            console.error(error);
        }
    };
    
    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
