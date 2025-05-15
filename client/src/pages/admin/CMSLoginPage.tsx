import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Step 1: Request OTP
const requestOTPSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Step 2: Verify OTP
const verifyOTPSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

type RequestOTPFormData = z.infer<typeof requestOTPSchema>;
type VerifyOTPFormData = z.infer<typeof verifyOTPSchema>;

export default function CMSLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [otpRequested, setOtpRequested] = useState(false);
  const [email, setEmail] = useState('');
  const [otpSecret, setOtpSecret] = useState('');

  // Request OTP form
  const requestForm = useForm<RequestOTPFormData>({
    resolver: zodResolver(requestOTPSchema),
    defaultValues: {
      email: '',
    },
  });

  // Verify OTP form
  const verifyForm = useForm<VerifyOTPFormData>({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Request OTP mutation
  const requestOTPMutation = useMutation({
    mutationFn: async (data: RequestOTPFormData) => {
      const response = await fetch('/api/admin/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.otpSecret) {
        setOtpRequested(true);
        setOtpSecret(data.otpSecret);
        toast({
          title: 'OTP Sent',
          description: 'Please check your email for the verification code.',
        });
      } else {
        toast({
          title: 'OTP Request',
          description: data.message || 'If your email exists in our system, you will receive an OTP.',
        });
      }
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to request OTP. Please try again.',
      });
    },
  });

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: async (data: VerifyOTPFormData) => {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: data.otp,
          otpSecret,
        }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user) {
        toast({
          title: 'Login Successful',
          description: 'Redirecting to admin dashboard...',
        });
        navigate('/cms/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: data.message || 'Invalid OTP. Please try again.',
        });
      }
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to verify OTP. Please try again.',
      });
    },
  });

  // Handle request OTP form submission
  const onRequestOTP = (data: RequestOTPFormData) => {
    setEmail(data.email);
    requestOTPMutation.mutate(data);
  };

  // Handle verify OTP form submission
  const onVerifyOTP = (data: VerifyOTPFormData) => {
    verifyOTPMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">PlayinMO CMS</CardTitle>
          <CardDescription className="text-center">
            {otpRequested
              ? 'Enter the verification code sent to your email'
              : 'Enter your email to receive a verification code'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpRequested ? (
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestOTP)} className="space-y-4">
                <FormField
                  control={requestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@example.com"
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={requestOTPMutation.isPending}
                >
                  {requestOTPMutation.isPending ? 'Sending...' : 'Request Verification Code'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(onVerifyOTP)} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123456"
                          type="text"
                          autoComplete="one-time-code"
                          maxLength={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyOTPMutation.isPending}
                >
                  {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {otpRequested && (
            <Button
              variant="link"
              onClick={() => {
                setOtpRequested(false);
                requestForm.reset();
                verifyForm.reset();
              }}
            >
              Try a different email
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}