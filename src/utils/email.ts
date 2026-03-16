import * as aws from "@aws-sdk/client-ses";
import nodemailer from "nodemailer";

console.log("--- AWS AUTH DEBUG ---");
console.log("Access Key ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("Secret Length:", process.env.AWS_SECRET_ACCESS_KEY?.length);
console.log("Secret Ends With:", process.env.AWS_SECRET_ACCESS_KEY?.slice(-2));
console.log("----------------------");

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
  const header = "ID,FirstName,LastName,Email,Role,PartyAlloc,HasRSVPD,MainAttending,MainMeal,P1Name,P1Attending,P1Meal,P2Name,P2Attending,P2Meal,P3Name,P3Attending,P3Meal,DietaryNotes\n";
  const rows = guests.map(g => {
    return `${g.id},"${g.firstName}","${g.lastName || ''}","${g.email}",${g.role},${g.allocatedPlusOnes},${g.hasRsvpd},${g.isAttending},"${g.mealChoice || ''}","${g.p1Name || ''}",${g.p1Attending},"${g.p1MealChoice || ''}","${g.p2Name || ''}",${g.p2Attending},"${g.p2MealChoice || ''}","${g.p3Name || ''}",${g.p3Attending},"${g.p3MealChoice || ''}","${g.dietaryNotes || ''}"`;
  }).join('\n');
  return header + rows;
}

// Helper: Build the dark/metal themed HTML for the guest
function buildGuestEmailHtml(guest: any, isUpdate: boolean) {
  const title = isUpdate ? "Your RSVP Has Been Updated" : "You're on the Guest List";
  const status = guest.isAttending ? "Hell Yes (Attending)" : "Can't Make It (Declined)";
  
  let html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #18181b; color: #f4f4f5; padding: 30px; border: 1px solid #3f3f46;">
      <h1 style="color: #f4f4f5; text-transform: uppercase; font-size: 24px; border-bottom: 2px solid #b45309; padding-bottom: 10px;">${title}</h1>
      <p style="color: #a1a1aa; font-size: 14px;">Party under: ${guest.email}</p>
      
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
      html += `<h3 style="color: #b45309; text-transform: uppercase; margin-top: 20px;">Dietary Notes</h3>
               <p>${guest.dietaryNotes}</p>`;
  }

  html += `
      <div style="margin-top: 40px; border-top: 1px solid #3f3f46; padding-top: 20px;">
        <p style="color: #a1a1aa; font-size: 12px;">Need to change your RSVP? <a href="https://trentandshy.com/tickets" style="color: #b45309;">Log back into the Box Office.</a></p>
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
      from: `"T&S System" <${process.env.SENDER_RSVP}>`,
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