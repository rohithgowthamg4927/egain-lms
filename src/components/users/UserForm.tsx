
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Role } from '@/lib/types';
import { uploadProfilePicture } from '@/lib/s3-upload';
import { X, Upload, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Full name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']),
  bio: z.string().optional(),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  onSubmit: (values: FormValues & { photoUrl?: string }) => void;
  defaultValues?: Partial<FormValues>;
  isSubmitting?: boolean;
}

export function UserForm({ onSubmit, defaultValues, isSubmitting = false }: UserFormProps) {
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: Role.STUDENT,
      bio: '',
      phone: '',
      ...defaultValues
    }
  });

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Preview image
      setProfilePicture(file);
      setProfilePictureUrl(URL.createObjectURL(file));
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePictureUrl(null);
  };

  const handleSubmit = async (values: FormValues) => {
    let photoUrl;
    
    if (profilePicture) {
      try {
        setIsUploading(true);
        // For now, we'll use a fake user ID of 999 - in a real app, this would be the actual user ID after creation
        photoUrl = await uploadProfilePicture(profilePicture, 999);
        toast({
          title: 'Upload successful',
          description: 'Profile picture uploaded to S3',
        });
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        toast({
          title: 'Upload failed',
          description: 'Failed to upload profile picture',
          variant: 'destructive',
        });
        return;
      } finally {
        setIsUploading(false);
      }
    }
    
    onSubmit({
      ...values,
      photoUrl
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 mb-2">
            {profilePictureUrl ? (
              <>
                <img 
                  src={profilePictureUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
                <button 
                  type="button"
                  onClick={removeProfilePicture}
                  className="absolute top-0 right-0 p-1 bg-black/70 rounded-full text-white hover:bg-black"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <User className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <label htmlFor="profile-picture" className="cursor-pointer flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md text-sm transition-colors">
            <Upload className="h-4 w-4" />
            <span>Upload Photo</span>
            <input 
              id="profile-picture" 
              type="file" 
              accept="image/*" 
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </label>
          <FormDescription className="text-xs text-center mt-1">
            Upload a profile picture. Max size: 5MB.
          </FormDescription>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Create a password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>User Role</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="ADMIN" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Admin</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="INSTRUCTOR" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Instructor</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="STUDENT" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Student</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter user bio (optional)"
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting || isUploading}
          className="w-full md:w-auto"
        >
          {(isSubmitting || isUploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isUploading ? 'Uploading...' : isSubmitting ? 'Saving...' : 'Add User'}
        </Button>
      </form>
    </Form>
  );
}
