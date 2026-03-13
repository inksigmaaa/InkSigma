'use client';

import { useForm, UseFormProps, FormProvider as RHFProvider, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createContext, useContext, ReactNode } from 'react';

export { RHFProvider as FormProvider };
export type { UseFormReturn };

const AppFormContext = createContext<UseFormReturn<any> | null>(null);

export function useAppForm<T = any>(props?: UseFormProps<T>) {
  return useForm<T>(props);
}

export function useAppFormWithZod<T extends z.ZodSchema>(schema: T, options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>) {
  return useForm<z.infer<T>>({
    ...options,
    resolver: zodResolver(schema as any),
  } as UseFormProps<z.infer<T>>);
}

export function AppFormProvider({ children, form }: { children: ReactNode; form: UseFormReturn<any> }) {
  return <AppFormContext.Provider value={form}><RHFProvider {...form}>{children}</RHFProvider></AppFormContext.Provider>;
}

export function useAppFormContext<T = any>() {
  const context = useContext(AppFormContext);
  if (!context) throw new Error('useAppFormContext must be used within AppFormProvider');
  return context as UseFormReturn<T>;
}
