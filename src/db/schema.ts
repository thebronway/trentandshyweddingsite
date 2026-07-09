import { pgTable, serial, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const guests = pgTable('guests', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
 email: text('email').unique(),
  phoneNumber: text('phone_number').unique(),
  role: text('role').notNull(),
  
  allocatedPlusOnes: integer('allocated_plus_ones').default(0).notNull(),

  hasRsvpd: boolean('has_rsvpd').default(false).notNull(),
  isAttending: boolean('is_attending').default(false).notNull(),
  dietaryNotes: text('dietary_notes'),
  songRequest: text('song_request'),

  p1Name: text('p1_name'),
  p1Attending: text('p1_attending').default('pending').notNull(),

  p2Name: text('p2_name'),
  p2Attending: text('p2_attending').default('pending').notNull(),

  p3Name: text('p3_name'),
  p3Attending: text('p3_attending').default('pending').notNull(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  rsvpOpenDate: timestamp('rsvp_open_date', { withTimezone: true }).defaultNow().notNull(),
  rsvpCloseDate: timestamp('rsvp_close_date', { withTimezone: true }).defaultNow().notNull(),
  earlyMessage: text('early_message').default('RSVP opens soon!').notNull(),
  lateMessage: text('late_message').default('RSVP is now closed. Please contact Trent or Shy.').notNull(),
});