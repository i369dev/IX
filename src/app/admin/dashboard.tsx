'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFirestore, useDoc } from '@/firebase';
import { getStorage } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowDown, ArrowUp, Disc, Info, Link, LogOut, ShieldAlert, Star, Trash, Type, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getAuth, signOut } from 'firebase/auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';

const trackSchema = z.object({
  name: z.string().min(1, 'Track name is required.'),
  duration: z.string().min(1, 'Duration is required.'),
});

const socialLinkSchema = z.object({
  icon: z.string().min(1, 'Icon class is required (e.g., fab fa-spotify).'),
  url: z.string().url('Must be a valid URL.'),
});

const landingPageSchema = z.object({
  hero: z.object({
    title: z.string().min(1, 'Hero title is required.'),
    subtitle: z.string().min(1, 'Hero subtitle is required.'),
  }),
  about: z.object({
    title: z.string().min(1, 'About title is required.'),
    p1: z.string().min(1, 'First paragraph is required.'),
    p2: z.string().min(1, 'Second paragraph is required.'),
  }),
  live: z.object({
    title: z.string().min(1, 'Live session title is required.'),
    videoUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  }),
  releases: z.object({
    title: z.string().min(1, 'Releases title is required.'),
    tracks: z.array(trackSchema),
  }),
  connect: z.object({
    title: z.string().min(1, 'Connect title is required.'),
    links: z.array(socialLinkSchema),
  }),
  footer: z.object({
    text: z.string().min(1, 'Footer text is required.'),
  }),
  maintenanceMode: z.boolean().optional(),
});

type LandingPageData = z.infer<typeof landingPageSchema>;

const defaultValues: LandingPageData = {
  hero: {
    title: 'InhaleXheale',
    subtitle: 'Organic Frequencies & Deep Melodies',
  },
  about: {
    title: 'Baare Mein',
    p1: 'Breath and sound combined. A journey through organic textures and dark, meditative spaces.',
    p2: 'Every frequency is a breath. Every silence is a void. Heal with the Neon Emerald light.',
  },
  live: {
    title: 'THE RITUAL',
    videoUrl: '',
  },
  releases: {
    title: 'Naye Releases',
    tracks: [
      { name: '1. Neon Emerald', duration: '04:12' },
      { name: '2. Deep Melodies', duration: '05:45' },
      { name: '3. Inhale', duration: '03:30' },
      { name: '4. Exhale', duration: '06:20' },
    ],
  },
  connect: {
    title: 'Judein',
    links: [
      { icon: 'fab fa-spotify', url: '#' },
      { icon: 'fab fa-soundcloud', url: '#' },
      { icon: 'fab fa-instagram', url: '#' },
      { icon: 'fab fa-youtube', url: '#' },
    ],
  },
  footer: {
    text: '© 2026 InhaleXheale. All rights reserved.',
  },
  maintenanceMode: false,
};

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('hero');
  const firestore = useFirestore();
  const { toast } = useToast();
  const auth = getAuth();
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const storage = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) return null;
    try {
        return getStorage(undefined, process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    } catch(e) {
        console.error("Failed to initialize storage", e);
        return null;
    }
  }, []);

  const contentRef = useMemo(
    () => (firestore ? doc(firestore, 'content', 'landingPage') : null),
    [firestore]
  );

  const { data: contentData, loading } = useDoc<LandingPageData>(contentRef);

  const form = useForm<LandingPageData>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: contentData || defaultValues,
  });

  const { fields: trackFields, append: appendTrack, remove: removeTrack } = useFieldArray({
    control: form.control,
    name: 'releases.tracks',
  });

  const { fields: linkFields, append: appendLink, remove: removeLink, swap: swapLink } = useFieldArray({
    control: form.control,
    name: 'connect.links',
  });

  useEffect(() => {
    if (contentData) {
      form.reset(contentData);
    }
  }, [contentData, form]);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!storage) {
        setUploadError("Firebase Storage is not configured. Please add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to your environment variables.");
        return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const storageRef = ref(storage, `live-session`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
        'state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
        },
        (error) => {
            console.error("Upload failed:", error);
            setUploadError("Video upload failed. Please try again.");
            setUploading(false);
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                form.setValue('live.videoUrl', downloadURL, { shouldValidate: true });
                setUploading(false);
                toast({
                    title: 'Upload Complete!',
                    description: 'The video has been uploaded. Saving...',
                });
                
                if (contentRef) {
                  setDoc(contentRef, { live: { videoUrl: downloadURL } }, { merge: true })
                    .then(() => {
                        toast({
                            title: 'Video Saved!',
                            description: 'The live session video has been updated.',
                        });
                    })
                    .catch(async (serverError) => {
                       const permissionError = new FirestorePermissionError({
                         path: contentRef.path,
                         operation: 'write',
                         requestResourceData: { live: { videoUrl: downloadURL } },
                       });
                       errorEmitter.emit('permission-error', permissionError);
                     });
                }
            });
        }
    );
};
  
  const onSubmit = async (data: LandingPageData) => {
    if (!contentRef) return;

    setDoc(contentRef, data, { merge: true })
      .then(() => {
        toast({
          title: 'Content Saved!',
          description: 'Your changes have been saved successfully.',
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: contentRef.path,
          operation: 'write',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading Dashboard...</div>;
  }

  return (
    <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
             <h2 className="text-lg font-semibold px-2">InhaleXhale Admin</h2>
             <SidebarSeparator />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('hero')} isActive={activeSection === 'hero'}>
                  <Star /> Hero
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('about')} isActive={activeSection === 'about'}>
                  <Info /> About
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('live')} isActive={activeSection === 'live'}>
                  <Video /> Live Session
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('releases')} isActive={activeSection === 'releases'}>
                  <Disc /> Releases
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('connect')} isActive={activeSection === 'connect'}>
                  <Link /> Connect
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('footer')} isActive={activeSection === 'footer'}>
                  <Type /> Footer
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('maintenance')} isActive={activeSection === 'maintenance'}>
                  <ShieldAlert /> Site Status
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => signOut(auth)}>
                        <LogOut /> Sign Out
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-background text-foreground h-screen overflow-y-auto">
          <div className="p-4 sm:p-6 md:p-8">
            <header className="flex items-center mb-8">
              <SidebarTrigger className="md:hidden mr-4" />
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </header>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                
                {activeSection === 'hero' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Hero Section</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="hero.title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hero.subtitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subtitle</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {activeSection === 'about' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About Section</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="about.title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="about.p1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paragraph 1</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="about.p2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paragraph 2</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {activeSection === 'live' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Live Session</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="live.title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormItem>
                        <FormLabel>Upload New Video</FormLabel>
                        <FormControl>
                          <Input type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploading} />
                        </FormControl>
                        <FormDescription>Upload a new video. The change will be saved and published immediately.</FormDescription>
                        {uploading && <Progress value={uploadProgress} className="w-full mt-2" />}
                        {uploadError && <p className="text-sm font-medium text-destructive mt-2">{uploadError || 'Storage not configured. Add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to .env.local'}</p>}
                      </FormItem>
                      
                       {form.watch('live.videoUrl') && (
                        <FormItem>
                            <FormLabel>Current Video</FormLabel>
                            <div className="mt-2 rounded-lg overflow-hidden border">
                                <video
                                    key={form.watch('live.videoUrl')}
                                    src={form.watch('live.videoUrl')}
                                    controls
                                    muted
                                    className="w-full"
                                />
                            </div>
                        </FormItem>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeSection === 'releases' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Releases Section</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="releases.title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <FormLabel>Tracks</FormLabel>
                        <div className="space-y-2 mt-2">
                          {trackFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                              <FormField
                                control={form.control}
                                name={`releases.tracks.${index}.name`}
                                render={({ field }) => <Input placeholder="Track Name" {...field} />}
                              />
                              <FormField
                                control={form.control}
                                name={`releases.tracks.${index}.duration`}
                                render={({ field }) => <Input placeholder="Duration" className="w-28" {...field} />}
                              />
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeTrack(index)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => appendTrack({ name: '', duration: '' })}
                        >
                          Add Track
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeSection === 'connect' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Connect Section</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="connect.title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <FormLabel>Social Links</FormLabel>
                        <div className="space-y-4 mt-2">
                          {linkFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background/50">
                                <div className="flex flex-col">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={index === 0}
                                      onClick={() => swapLink(index, index - 1)}
                                    >
                                      <span className="sr-only">Move up</span>
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={index === linkFields.length - 1}
                                      onClick={() => swapLink(index, index + 1)}
                                    >
                                      <span className="sr-only">Move down</span>
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex-grow space-y-2">
                                    <FormField
                                        control={form.control}
                                        name={`connect.links.${index}.icon`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="sr-only">Icon</FormLabel>
                                            <FormControl>
                                              <Input placeholder="Font Awesome Class (e.g. fab fa-spotify)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`connect.links.${index}.url`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="sr-only">URL</FormLabel>
                                            <FormControl>
                                              <Input placeholder="URL" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)}>
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Remove link</span>
                                </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => appendLink({ icon: '', url: '#' })}
                        >
                          Add Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {activeSection === 'footer' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Footer Section</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="footer.text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Footer Text</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {activeSection === 'maintenance' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Maintenance Mode</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="maintenanceMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Enable Maintenance Mode
                              </FormLabel>
                              <FormDescription>
                                When enabled, visitors will see a maintenance page instead of the main site.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
                
                <Separator />

                <Button type="submit" size="lg" className="w-full sm:w-auto">Save All Changes</Button>
              </form>
            </Form>
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
