import { pgTable, serial, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const guests = pgTable('guests', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  email: text('email').unique(),
  phoneNumber: text('phone_number').unique(),
  partyCode: text('party_code').unique(),
  role: text('role').notNull(),
  
  allocatedPlusOnes: integer('allocated_plus_ones').default(0).notNull(),

  hasRsvpd: boolean('has_rsvpd').default(false).notNull(),
  isAttending: boolean('is_attending').default(false).notNull(),
  isCheckedIn: boolean('is_checked_in').default(false).notNull(),
  checkInTime: timestamp('check_in_time', { withTimezone: true }),
  dietaryNotes: text('dietary_notes'),
  songRequest: text('song_request'),

  p1Name: text('p1_name'),
  p1Email: text('p1_email'),
  p1PhoneNumber: text('p1_phone_number'),
  p1Attending: text('p1_attending').default('pending').notNull(),
  p1CheckedIn: boolean('p1_checked_in').default(false).notNull(),
  p1CheckInTime: timestamp('p1_check_in_time', { withTimezone: true }),

  p2Name: text('p2_name'),
  p2Email: text('p2_email'),
  p2PhoneNumber: text('p2_phone_number'),
  p2Attending: text('p2_attending').default('pending').notNull(),
  p2CheckedIn: boolean('p2_checked_in').default(false).notNull(),
  p2CheckInTime: timestamp('p2_check_in_time', { withTimezone: true }),

  p3Name: text('p3_name'),
  p3Email: text('p3_email'),
  p3PhoneNumber: text('p3_phone_number'),
  p3Attending: text('p3_attending').default('pending').notNull(),
  p3CheckedIn: boolean('p3_checked_in').default(false).notNull(),
  p3CheckInTime: timestamp('p3_check_in_time', { withTimezone: true }),
});

export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  rsvpOpenDate: timestamp('rsvp_open_date', { withTimezone: true }).defaultNow().notNull(),
  rsvpCloseDate: timestamp('rsvp_close_date', { withTimezone: true }).defaultNow().notNull(),
  earlyMessage: text('early_message').default('RSVP opens soon!').notNull(),
  lateMessage: text('late_message').default('RSVP is now closed. Please contact Trent or Shy.').notNull(),
});