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
 import { Role, User } from '@/lib/types';
 import { Upload, Loader2, User as UserIcon, Copy, Check, Download } from 'lucide-react';
 import { useToast } from '@/hooks/use-toast';
 import { generateRandomPassword, downloadCredentialsCSV } from '@/lib/utils';
 
 const formSchema = z.object({
   fullName: z.string().min(2, {
     message: 'Full name must be at least 2 characters.',
   }),
   email: z.string().email({
     message: 'Please enter a valid email address.',
   }),
   role: z.enum(['admin', 'instructor', 'student']),
   phoneNumber: z.string().optional(),
   address: z.string().optional(),
   shouldChangePassword: z.boolean().optional(),
   mustResetPassword: z.boolean().optional(),
 });
 
 type FormValues = z.infer<typeof formSchema>;
 
 interface UserFormProps {
   onSubmit: (values: FormValues & { password: string; photoUrl?: string }) => void;
   defaultValues?: Partial<FormValues & { password?: string }>;
   isSubmitting?: boolean;
   isEditMode?: boolean;
   existingUser?: User;
 }
 
 export function UserForm({ onSubmit, defaultValues, isSubmitting = false, isEditMode = false, existingUser }: UserFormProps) {
   const [profilePicture, setProfilePicture] = useState<File | null>(null);
   const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
   const [generatedPassword, setGeneratedPassword] = useState(() => 
     defaultValues?.password || generateRandomPassword()
   );
   const [shouldChangePassword, setShouldChangePassword] = useState(false);
   const [copied, setCopied] = useState(false);
   const { toast } = useToast();
 
   const form = useForm<FormValues>({
     resolver: zodResolver(formSchema),
     defaultValues: {
       fullName: '',
       email: '',
       role: Role.student,
       phoneNumber: '',
       address: '',
       shouldChangePassword: false,
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
 
   const regeneratePassword = () => {
     setGeneratedPassword(generateRandomPassword());
     setCopied(false);
   };
 
   const copyPassword = () => {
     navigator.clipboard.writeText(generatedPassword);
     setCopied(true);
 
     toast({
       title: 'Password copied',
       description: 'Password has been copied to clipboard'
     });
 
     // Reset the copied state after 2 seconds
     setTimeout(() => setCopied(false), 2000);
   };
 
   
 
   const handleSubmit = async (values: FormValues) => {
     let passwordToSubmit: string | undefined = undefined;
     if (isEditMode && shouldChangePassword) {
       passwordToSubmit = generatedPassword;
     } else if (!isEditMode) {
       passwordToSubmit = generatedPassword;
     }
 
     onSubmit({
       ...values,
       password: passwordToSubmit,
       photoUrl: profilePictureUrl || undefined,
       mustResetPassword: shouldChangePassword,
       shouldChangePassword: shouldChangePassword,
     });
   };
 
   const handleShouldChangePasswordChange = (value: boolean) => {
     setShouldChangePassword(value);
     form.setValue('shouldChangePassword', value);
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
                   <span className="sr-only">Remove</span>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                 </button>
               </>
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-100">
                 <UserIcon className="h-12 w-12 text-gray-400" />
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
             name="phoneNumber"
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
 
           {isEditMode ? (
             <div>
               <FormLabel>Password</FormLabel>
               <div className="mt-1">
                 <div className="flex flex-col gap-2">
                   <div className="flex items-center mb-2">
                     <input
                       type="checkbox"
                       id="should-change-password"
                       checked={shouldChangePassword}
                       onChange={(e) => handleShouldChangePasswordChange(e.target.checked)}
                       className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                     />
                     <label htmlFor="should-change-password" className="text-sm font-medium">
                       Change password
                     </label>
                   </div>
 
                   {shouldChangePassword ? (
                     <div className="flex">
                       <Input
                         type="text"
                         value={generatedPassword}
                         readOnly
                         className="rounded-r-none border-r-0"
                         placeholder="Click Regenerate to create new password"
                       />
                       <Button 
                         type="button" 
                         variant="outline" 
                         size="icon" 
                         onClick={copyPassword}
                         className="rounded-none border-x-0"
                       >
                         {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                       </Button>
                       <Button 
                         type="button" 
                         variant="outline" 
                         onClick={regeneratePassword}
                         className="rounded-l-none border-r rounded-r-none px-2 text-xs"
                       >
                         Regenerate
                       </Button>
                       <Button
                         type="button"
                         variant="outline"
                         onClick={() => downloadCredentialsCSV(form.getValues('email'), generatedPassword, form.getValues('fullName'))}
                         className="rounded-l-none px-2 text-blue-500 hover:text-blue-600 hover:border-blue-600"
                         title="Download Credentials"
                       >
                         <Download className="h-4 w-4" />
                       </Button>
                     </div>
                   ) : (
                     <div className="flex">
                       <Input
                         type="text"
                         value={defaultValues?.password || ''}
                         readOnly
                         className="rounded-r-none border-r-0"
                       />
                       <Button 
                         type="button" 
                         variant="outline" 
                         size="icon" 
                         onClick={() => {
                           if (defaultValues?.password) {
                             navigator.clipboard.writeText(defaultValues.password);
                             setCopied(true);
                             toast({
                               title: 'Password copied',
                               description: 'Password has been copied to clipboard'
                             });
                             setTimeout(() => setCopied(false), 2000);
                           }
                         }}
                         className="rounded-none border-x-0"
                       >
                         {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                       </Button>
                       <Button
                         type="button"
                         variant="outline"
                         onClick={() => {
                           if (defaultValues?.password) {
                             downloadCredentialsCSV(form.getValues('email'), defaultValues.password, form.getValues('fullName'));
                           }
                         }}
                         className="rounded-l-none px-2 text-blue-500 hover:text-blue-600 hover:border-blue-600"
                         title="Download Credentials"
                       >
                         <Download className="h-4 w-4" />
                       </Button>
                     </div>
                   )}
                 </div>
 
                 <FormDescription className="text-xs mt-1">
                   {shouldChangePassword 
                     ? "A new random password will be generated for the user. They will be required to change it on first login."
                     : "Keep the existing password. Check the box above to generate a new password."}
                 </FormDescription>
               </div>
             </div>
           ) : (
             <div>
               <FormLabel>Password</FormLabel>
               <div className="mt-1">
                 <div className="flex">
                   <Input
                     type="text"
                     value={generatedPassword}
                     readOnly
                     className="rounded-r-none border-r-0"
                   />
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="icon" 
                     onClick={copyPassword}
                     className="rounded-none border-x-0"
                   >
                     {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                   </Button>
                   <Button 
                     type="button" 
                     variant="outline" 
                     onClick={regeneratePassword}
                     className="rounded-l-none border-r rounded-r-none px-2 text-xs"
                   >
                     Regenerate
                   </Button>
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => downloadCredentialsCSV(form.getValues('email'), generatedPassword, form.getValues('fullName'))}
                     className="rounded-l-none px-2 text-blue-500 hover:text-blue-600 hover:border-blue-600"
                     title="Download Credentials"
                   >
                     <Download className="h-4 w-4" />
                   </Button>
                 </div>
                 <FormDescription className="text-xs mt-1">
                   A random password is generated for the user. They will be required to change it on first login. You can download the credentials as a CSV file.
                 </FormDescription>
               </div>
             </div>
           )}
         </div>
 
         {/* Add the address field here */}
         <FormField
           control={form.control}
           name="address"
           render={({ field }) => (
             <FormItem>
               <FormLabel>Address</FormLabel>
               <FormControl>
                 <Textarea 
                   placeholder="Enter address (optional)" 
                   className="resize-none" 
                   {...field} 
                 />
               </FormControl>
               <FormMessage />
             </FormItem>
           )}
         />
 
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
                       <RadioGroupItem value="admin" />
                     </FormControl>
                     <FormLabel className="cursor-pointer">Admin</FormLabel>
                   </FormItem>
                   <FormItem className="flex items-center space-x-2 space-y-0">
                     <FormControl>
                       <RadioGroupItem value="instructor" />
                     </FormControl>
                     <FormLabel className="cursor-pointer">Instructor</FormLabel>
                   </FormItem>
                   <FormItem className="flex items-center space-x-2 space-y-0">
                     <FormControl>
                       <RadioGroupItem value="student" />
                     </FormControl>
                     <FormLabel className="cursor-pointer">Student</FormLabel>
                   </FormItem>
                 </RadioGroup>
               </FormControl>
               <FormMessage />
             </FormItem>
           )}
         />
 
         <Button 
           type="submit" 
           disabled={isSubmitting}
           className="w-full md:w-auto"
         >
           {(isSubmitting) && (
             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
           )}
           {isEditMode 
             ? isSubmitting ? 'Saving...' : 'Update User' 
             : isSubmitting ? 'Saving...' : 'Add User'}
         </Button>
       </form>
     </Form>
   );
 }