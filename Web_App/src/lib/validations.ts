import { z } from "zod";
import { TOBACCO_PRODUCTS, TRIGGERS, COUNTRIES, ACCOUNT_STATUSES } from "./constants";

const productIds = TOBACCO_PRODUCTS.map((p) => p.id) as [string, ...string[]];
const triggerIds = TRIGGERS.map((t) => t.id) as [string, ...string[]];
const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]];

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name.").max(120),
    email: z.string().trim().email("Enter a valid email address.").max(320),
    country: z.enum(countryCodes),
    place: z.string().trim().max(120).optional().nullable(),
    currency: z.string().trim().length(3),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(128)
      .regex(/[A-Za-z]/, "Include a letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, "Please accept the terms and privacy notice."),
    timezone: z.string().max(64).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const forgotSchema = z.object({
  email: z.string().trim().email(),
});

export const resetSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(10).max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const productUsageSchema = z.object({
  productType: z.enum(productIds),
  quantityPerDay: z.number().min(0).max(200).nullable().optional(),
  packSize: z.number().min(0).max(1000).nullable().optional(),
  pricePerPack: z.number().min(0).max(100000).nullable().optional(),
  buyingFrequency: z.string().max(32).nullable().optional(),
  monthlySpend: z.number().min(0).max(100000).nullable().optional(),
  unitLabel: z.string().max(32).nullable().optional(),
  isEstimate: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const onboardingSchema = z.object({
  step: z.number().int().min(0).max(6),
  complete: z.boolean().optional(),
  draft: z.record(z.string(), z.unknown()).optional(),
  products: z.array(productUsageSchema).optional(),
  triggers: z
    .array(z.object({ triggerKey: z.enum(triggerIds), isPrimary: z.boolean().optional(), localTime: z.string().optional() }))
    .max(2)
    .optional(),
  country: z.enum(countryCodes).optional(),
  currency: z.string().length(3).optional(),
  quitPlanType: z.enum(["preparation", "immediate"]).optional(),
  quitDate: z.string().nullable().optional(),
  mostChallengingTime: z.string().max(120).nullable().optional(),
  supportTrack: z.string().max(64).optional(),
});

export const cravingSchema = z.object({
  toolUsed: z.enum(["game", "questions", "breathe", "messages"]),
  durationSeconds: z.number().int().min(0).max(3600).optional(),
  answers: z.record(z.string(), z.unknown()).optional(),
  outcome: z
    .enum(["eased", "somewhat", "still_strong", "used", "prefer_not", "skipped"])
    .optional(),
});

export const postSchema = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(1).max(4000),
  category: z.enum(["general", "wins", "triggers", "questions", "urgent"]),
});

export const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export const supportSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  subject: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10).max(5000),
});

export const statusChangeSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(ACCOUNT_STATUSES),
  reason: z.string().trim().min(3).max(500),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  displayName: z.string().trim().max(80).optional().nullable(),
  country: z.enum(countryCodes).optional(),
  currency: z.string().length(3).optional(),
  place: z.string().max(120).optional().nullable(),
  timezone: z.string().max(64).optional(),
  publicProfile: z.boolean().optional(),
  privacyShareProgress: z.boolean().optional(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  quitPlanType: z.enum(["preparation", "immediate"]).optional(),
  quitDate: z.string().nullable().optional(),
});
