
'use client';
import { useState, useEffect } from 'react';
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
    departmentId: z.string().min(1, "Department is required"), 
  }),
  z.object({
    role: z.literal('employee'),
    employeeId: z.string().min(1, 'Employee ID is required'),
    departmentId: z.string().min(1, "Department is required"),
    designationId: z.string().min(1, "Designation is required"),
  }),
]).and(baseSchema);

interface Department {
  id: string;
  name: string;
}

interface Designation {
  id: string;
  name: string;
}

export function RegisterForm() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  
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
  const departmentId = useWatch({ control: form.control, name: 'departmentId' });

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    }
    if (role === 'hr' || role === 'employee') {
      fetchDepartments();
    }
  }, [role]);

  useEffect(() => {
    async function fetchDesignations() {
      if (!departmentId) {
        setDesignations([]);
        form.setValue('designationId', '');
        return;
      }
      try {
        const response = await fetch(`/api/designations?departmentId=${departmentId}`);
        if (response.ok) {
          const data = await response.json();
          setDesignations(data);
        }
      } catch (error) {
        console.error("Failed to fetch designations", error);
      }
    }

    if (role === 'employee' && departmentId) {
      fetchDesignations();
    }
  }, [role, departmentId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError('');
    try {
      let payload: any = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        role: values.role,
      };

      if (values.role === 'employee') {
        payload.employeeId = values.employeeId;
        payload.departmentId = values.departmentId;
        payload.designationId = values.designationId;
      } else if (values.role === 'hr') {
        payload.departmentId = values.departmentId;
      }

      await register(payload);
      
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
                <FormItem><FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {departments.map(dep => <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="designationId" render={({ field }) => (
                <FormItem><FormLabel>Designation</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!departmentId || designations.length === 0}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a designation" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {designations.map(des => <SelectItem key={des.id} value={des.id}>{des.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage /></FormItem>
              )}/>
            </>
          )}

          {role === 'hr' && (
             <FormField control={form.control} name="departmentId" render={({ field }) => (
              <FormItem><FormLabel>Department</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger></FormControl>
                <SelectContent>
                  {departments.map(dep => <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage /></FormItem>
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
