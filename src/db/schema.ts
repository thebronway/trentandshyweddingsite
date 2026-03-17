import { pgTable, serial, text, boolean, integer } from 'drizzle-orm/pg-core';

export const guests = pgTable('guests', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // 'guest', 'party', 'admin'
  
  // How many extra slots does this invite get? (0 to 3)
  allocatedPlusOnes: integer('allocated_plus_ones').default(0).notNull(),

  // Main Guest RSVP
  hasRsvpd: boolean('has_rsvpd').default(false).notNull(),
  isAttending: boolean('is_attending').default(false).notNull(),
  mealChoice: text('meal_choice'),
  dietaryNotes: text('dietary_notes'),
  songRequest: text('song_request'),

  // Plus One
  p1Name: text('p1_name'),
  p1Attending: text('p1_attending').default('pending').notNull(),
  p1MealChoice: text('p1_meal_choice'),

  // Plus Two
  p2Name: text('p2_name'),
  p2Attending: text('p2_attending').default('pending').notNull(),
  p2MealChoice: text('p2_meal_choice'),

  // Plus Three
  p3Name: text('p3_name'),
  p3Attending: text('p3_attending').default('pending').notNull(),
  p3MealChoice: text('p3_meal_choice'),
});