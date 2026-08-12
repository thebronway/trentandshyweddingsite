/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly AWS_ACCESS_KEY_ID: string;
  readonly AWS_SECRET_ACCESS_KEY: string;
  readonly AWS_REGION: string;
  readonly GUEST_PASSWORD: string;
  readonly VIP_PASSWORD: string;
  readonly OPENERS_PASSWORD: string;
  readonly ADMIN_PASSWORD: string;
  readonly OVERRIDE_PASSWORD: string;
  readonly ADMIN_NOTIFY_EMAIL: string;
  readonly SENDER_NO_REPLY: string;
  readonly SENDER_RSVP: string;
  readonly TEST_EMAIL_OVERRIDE?: string;
  readonly DEMO_BANNER_TEXT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}