import * as aws from "@aws-sdk/client-ses";
import nodemailer from "nodemailer";

// Initialize the SES Client
const ses = new aws.SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

// Create the Nodemailer Transporter using the AWS SES Client
const transporter = nodemailer.createTransport({
  SES: { ses, aws },
});

// Helper: Generate the CSV string identical to your export route
function generateCSV(guests: any[]) {
  const header = "ID,FirstName,LastName,Email,Role,PartyAlloc,HasRSVPD,MainAttending,MainMeal,P1Name,P1Attending,P1Meal,P2Name,P2Attending,P2Meal,P3Name,P3Attending,P3Meal,DietaryNotes,SongRequest\n";
  const escapeCSV = (str: string | null) => str ? `"${str.replace(/"/g, '""')}"` : '""';
  
  const rows = guests.map(g => {
    // Only output the attending status if they were actually allocated that slot
    const p1Att = g.allocatedPlusOnes >= 1 ? g.p1Attending : '';
    const p2Att = g.allocatedPlusOnes >= 2 ? g.p2Attending : '';
    const p3Att = g.allocatedPlusOnes >= 3 ? g.p3Attending : '';
    
    return `${g.id},${escapeCSV(g.firstName)},${escapeCSV(g.lastName)},${escapeCSV(g.email)},${g.role},${g.allocatedPlusOnes},${g.hasRsvpd},${g.isAttending},${escapeCSV(g.mealChoice)},${escapeCSV(g.p1Name)},${p1Att},${escapeCSV(g.p1MealChoice)},${escapeCSV(g.p2Name)},${p2Att},${escapeCSV(g.p2MealChoice)},${escapeCSV(g.p3Name)},${p3Att},${escapeCSV(g.p3MealChoice)},${escapeCSV(g.dietaryNotes)},${escapeCSV(g.songRequest)}`;
  }).join('\n');
  return header + rows;
}

// Helper: Build the dark/metal themed HTML for the guest
function buildGuestEmailHtml(guest: any, isUpdate: boolean) {
  const title = isUpdate ? "Your RSVP Has Been Updated" : "You're on the Guest List";
  const status = guest.isAttending ? "Hell Yes (Attending)" : "Can't Make It (Declined)";
  
  let html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #18181b; color: #f4f4f5; padding: 30px; border: 1px solid #3f3f46;">
      <h2 style="color: #b45309; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; margin-bottom: 5px;">Trent & Shy's "Till Death" Tour (Wedding)</h2>
      <h1 style="color: #f4f4f5; text-transform: uppercase; font-size: 24px; border-bottom: 2px solid #b45309; padding-bottom: 10px; margin-top: 0;">${title}</h1>
      
      <div style="background-color: #27272a; padding: 15px; margin: 20px 0; border-left: 4px solid #b45309;">
        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Date:</strong> October 10, 2026</p>
        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Time:</strong> Doors at 4:30 PM</p>
        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Venue:</strong> Baltimore Soundstage</p>
        <p style="margin: 0; font-size: 14px; color: #a1a1aa;">124 Market Pl, Baltimore, MD 21202</p>
      </div>

      <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px;"><strong>Party under:</strong> ${guest.email}</p>
      
      <h3 style="color: #10b981; text-transform: uppercase;">Main Guest: ${guest.firstName} ${guest.lastName || ''}</h3>
      <p><strong>Status:</strong> ${status}</p>
      ${guest.isAttending ? `<p><strong>Meal:</strong> ${guest.mealChoice || 'None'}</p>` : ''}
  `;

  if (guest.allocatedPlusOnes >= 1) {
      html += `<h3 style="color: #10b981; text-transform: uppercase; margin-top: 20px;">Plus One: ${guest.p1Name || 'Guest'}</h3>
               <p><strong>Status:</strong> ${guest.p1Attending === 'true' ? 'Yes' : guest.p1Attending === 'false' ? 'No' : 'Pending'}</p>
               ${guest.p1Attending === 'true' ? `<p><strong>Meal:</strong> ${guest.p1MealChoice || 'None'}</p>` : ''}`;
  }
  if (guest.allocatedPlusOnes >= 2) {
      html += `<h3 style="color: #10b981; text-transform: uppercase; margin-top: 20px;">Plus Two: ${guest.p2Name || 'Guest'}</h3>
               <p><strong>Status:</strong> ${guest.p2Attending === 'true' ? 'Yes' : guest.p2Attending === 'false' ? 'No' : 'Pending'}</p>
               ${guest.p2Attending === 'true' ? `<p><strong>Meal:</strong> ${guest.p2MealChoice || 'None'}</p>` : ''}`;
  }
  if (guest.allocatedPlusOnes >= 3) {
      html += `<h3 style="color: #10b981; text-transform: uppercase; margin-top: 20px;">Plus Three: ${guest.p3Name || 'Guest'}</h3>
               <p><strong>Status:</strong> ${guest.p3Attending === 'true' ? 'Yes' : guest.p3Attending === 'false' ? 'No' : 'Pending'}</p>
               ${guest.p3Attending === 'true' ? `<p><strong>Meal:</strong> ${guest.p3MealChoice || 'None'}</p>` : ''}`;
  }

  if (guest.dietaryNotes) {
      html += `<h3 style="color: #b45309; text-transform: uppercase; margin-top: 20px;">Dietary Note(s)</h3>
               <p>${guest.dietaryNotes}</p>`;
  }
  
  if (guest.songRequest) {
      html += `<h3 style="color: #b45309; text-transform: uppercase; margin-top: 20px;">Song Request(s)</h3>
               <p>${guest.songRequest}</p>`;
  }

  html += `
      <div style="margin-top: 40px; border-top: 1px solid #3f3f46; padding-top: 20px;">
        <p style="color: #f4f4f5; font-size: 14px; font-weight: bold; margin: 0 0 5px 0;">Questions?</p>
        <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 25px 0;">Please do not reply to this automated email. Instead, email <a href="mailto:conwayb2@gmail.com" style="color: #b45309; font-weight: bold;">conwayb2@gmail.com</a>.</p>

        <h4 style="color: #f4f4f5; text-transform: uppercase; margin-top: 0; margin-bottom: 10px;">Need to update your RSVP?</h4>
        <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 10px;">You can log back into the Box Office anytime before the deadline (August 1, 2026) to change RSVP.</p>
        <div style="background-color: #09090b; padding: 15px; border: 1px solid #27272a;">
          <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 5px 0;"><strong>Site Password:</strong> <span style="color: #f4f4f5;">frontrow2026</span></p>
          <p style="color: #a1a1aa; font-size: 14px; margin: 0;"><strong>Box Office (Update RSVP) Link:</strong> <a href="https://trentandshy.com/tickets" style="color: #b45309; text-decoration: none; font-weight: bold;">https://trentandshy.com/tickets</a></p>
        </div>
      </div>
    </div>
  `;
  return html;
}

// ---------------------------------------------------------
// EXPORTED FUNCTIONS
// ---------------------------------------------------------

export async function sendGuestConfirmation(guest: any, isUpdate: boolean) {
  if (!process.env.SENDER_NO_REPLY) return;
  
  try {
    await transporter.sendMail({
      from: `"Trent & Shy Box Office" <${process.env.SENDER_NO_REPLY}>`,
      to: guest.email,
      subject: isUpdate ? "Your Trent & Shy RSVP is Updated" : "Trent & Shy RSVP Confirmed",
      html: buildGuestEmailHtml(guest, isUpdate)
    });
  } catch (error) {
    console.error("Error sending guest email:", error);
  }
}

export async function sendAdminNotification(guest: any, allGuests: any[], action: string) {
  if (!process.env.ADMIN_NOTIFY_EMAIL || !process.env.SENDER_RSVP) return;

  const csvContent = generateCSV(allGuests);

  try {
    await transporter.sendMail({
      from: `"Trent & Shy RSVP" <${process.env.SENDER_RSVP}>`,
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: `RSVP Alert: ${guest.firstName} ${guest.lastName || ''} - ${action}`,
      html: `
        <div style="font-family: sans-serif;">
          <h2>Guest List Update</h2>
          <p><strong>Action:</strong> ${action}</p>
          <p><strong>Guest:</strong> ${guest.firstName} ${guest.lastName || ''} (${guest.email})</p>
          <p>An updated CSV of the entire guest list is attached.</p>
        </div>
      `,
      attachments: [
        {
          filename: 'trent_and_shy_guest_list.csv',
          content: csvContent
        }
      ]
    });
  } catch (error) {
    console.error("Error sending admin email:", error);
  }
}