'use client';
import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const baseSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'hr', 'employee'], { required_error: 'Role is required' }),
});

const formSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('admin') }),
  z.object({ 
    role: z.literal('hr'),
    departmentId: z.string().min(1, "Department ID is required"), 
  }),
  z.object({
    role: z.literal('employee'),
    employeeId: z.string().min(1, 'Employee ID is required'),
    departmentId: z.string().min(1, "Department ID is required"),
    designationId: z.string().min(1, "Designation ID is required"),
  }),
]).and(baseSchema);


export function RegisterForm() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: 'employee',
      employeeId: '',
      departmentId: '',
      designationId: '',
    },
  });

  const role = useWatch({ control: form.control, name: 'role' });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError('');
    try {
      await register(values);
      
      toast({
        title: "Registration Successful",
        description: `Account for ${values.email} has been created.`,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Registration Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="name@company.com" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={(value) => field.onChange(value)} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}/>

          {role === 'employee' && (
            <>
              <FormField control={form.control} name="employeeId" render={({ field }) => (
                <FormItem><FormLabel>Employee ID</FormLabel><FormControl><Input placeholder="EMP12345" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="departmentId" render={({ field }) => (
                <FormItem><FormLabel>Department ID</FormLabel><FormControl><Input placeholder="Enter Department ID" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="designationId" render={({ field }) => (
                <FormItem><FormLabel>Designation ID</FormLabel><FormControl><Input placeholder="Enter Designation ID" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </>
          )}

          {role === 'hr' && (
             <FormField control={form.control} name="departmentId" render={({ field }) => (
              <FormItem><FormLabel>Department ID</FormLabel><FormControl><Input placeholder="Enter Department ID" {...field} /></FormControl><FormMessage /></FormItem>
             )}/>
          )}

          <Button type="submit" disabled={isLoading} className="w-full !mt-6">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
          </Button>
        </form>
      </Form>
       <div className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline text-primary">
          Sign In
        </Link>
      </div>
    </>
  );
}