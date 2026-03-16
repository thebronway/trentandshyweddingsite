import { defineDb, defineTable, column } from 'astro:db';

export const Guest = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    firstName: column.text(),
    lastName: column.text({ optional: true }),
    email: column.text({ unique: true }),
    role: column.text(), // 'guest', 'party', 'admin'
    
    // How many extra slots does this invite get? (0 to 3)
    allocatedPlusOnes: column.number({ default: 0 }), 

    // Main Guest RSVP
    hasRsvpd: column.boolean({ default: false }),
    isAttending: column.boolean({ default: false }),
    mealChoice: column.text({ optional: true }),
    dietaryNotes: column.text({ optional: true }),

    // Plus One
    p1Name: column.text({ optional: true }),
    p1Attending: column.boolean({ default: false }),
    p1MealChoice: column.text({ optional: true }),

    // Plus Two
    p2Name: column.text({ optional: true }),
    p2Attending: column.boolean({ default: false }),
    p2MealChoice: column.text({ optional: true }),

    // Plus Three
    p3Name: column.text({ optional: true }),
    p3Attending: column.boolean({ default: false }),
    p3MealChoice: column.text({ optional: true }),
  }
});

export default defineDb({
  tables: { Guest },
});