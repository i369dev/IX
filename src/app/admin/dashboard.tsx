'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getAuth, signOut } from 'firebase/auth';

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
  releases: z.object({
    title: z.string().min(1, 'Releases title is required.'),
    tracks: z.array(trackSchema),
  }),
  live: z.object({
    title: z.string().min(1, 'Live session title is required.'),
  }),
  connect: z.object({
    title: z.string().min(1, 'Connect title is required.'),
    links: z.array(socialLinkSchema),
  }),
  footer: z.object({
    text: z.string().min(1, 'Footer text is required.'),
  }),
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
  releases: {
    title: 'Naye Releases',
    tracks: [
      { name: '1. Neon Emerald', duration: '04:12' },
      { name: '2. Deep Melodies', duration: '05:45' },
      { name: '3. Inhale', duration: '03:30' },
      { name: '4. Exhale', duration: '06:20' },
    ],
  },
  live: {
    title: 'Live Session',
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
};

export default function Dashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const auth = getAuth();

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

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control: form.control,
    name: 'connect.links',
  });

  useEffect(() => {
    if (contentData) {
      form.reset(contentData);
    }
  }, [contentData, form]);

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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={() => signOut(auth)}>Sign Out</Button>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Hero Section */}
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
          
          {/* About Section */}
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

          {/* Releases Section */}
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
                        render={({ field }) => <Input placeholder="Duration" {...field} />}
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
                  className="mt-2"
                  onClick={() => appendTrack({ name: '', duration: '' })}
                >
                  Add Track
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Session Section */}
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
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Connect Section */}
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
                <div className="space-y-2 mt-2">
                  {linkFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`connect.links.${index}.icon`}
                        render={({ field }) => <Input placeholder="Font Awesome Class (e.g. fab fa-spotify)" {...field} />}
                      />
                      <FormField
                        control={form.control}
                        name={`connect.links.${index}.url`}
                        render={({ field }) => <Input placeholder="URL" {...field} />}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => appendLink({ icon: '', url: '#' })}
                >
                  Add Link
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer Section */}
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
          
          <Separator />

          <Button type="submit" size="lg">Save All Changes</Button>
        </form>
      </Form>
    </div>
  );
}
