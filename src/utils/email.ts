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
  const header = "ID,FirstName,LastName,Email,Phone,PartyCode,Role,PartyAlloc,HasRSVPD,MainAttending,P1Name,P1Attending,P2Name,P2Attending,P3Name,P3Attending,DietaryNotes,SongRequest\n";
  const escapeCSV = (str: string | null) => str ? `"${str.replace(/"/g, '""')}"` : '""';
  
  const rows = guests.map(g => {
    const p1Att = g.allocatedPlusOnes >= 1 ? g.p1Attending : '';
    const p2Att = g.allocatedPlusOnes >= 2 ? g.p2Attending : '';
    const p3Att = g.allocatedPlusOnes >= 3 ? g.p3Attending : '';
    
    return `${g.id},${escapeCSV(g.firstName)},${escapeCSV(g.lastName)},${escapeCSV(g.email)},${escapeCSV(g.phoneNumber)},${escapeCSV(g.partyCode)},${g.role},${g.allocatedPlusOnes},${g.hasRsvpd},${g.isAttending},${escapeCSV(g.p1Name)},${p1Att},${escapeCSV(g.p2Name)},${p2Att},${escapeCSV(g.p3Name)},${p3Att},${escapeCSV(g.dietaryNotes)},${escapeCSV(g.songRequest)}`;
  }).join('\n');
  return header + rows;
}

// Helper: Build the dark/metal themed HTML for the guest
function buildGuestEmailHtml(guest: any, isUpdate: boolean, siteSettings: any) {
  const formattedCloseDate = siteSettings?.rsvpCloseDate 
    ? new Date(siteSettings.rsvpCloseDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
    : "the deadline";

  const getBadgeHtml = (roleStr: string | null | undefined) => {
    const r = (roleStr || 'guest').toLowerCase();
    const baseStyle = "display: inline-block; padding: 4px 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; margin-left: 12px; vertical-align: middle; white-space: nowrap;";
    if (r === 'admin') return `<span style="${baseStyle} background-color: #451a03; border: 1px solid #78350f; color: #fbbf24;">Main Act</span>`;
    if (r === 'openers') return `<span style="${baseStyle} background-color: #022c22; border: 1px solid #064e3b; color: #34d399;">Openers</span>`;
    if (r === 'vip') return `<span style="${baseStyle} background-color: #3b0764; border: 1px solid #581c87; color: #c084fc;">★ VIP ★</span>`;
    return `<span style="${baseStyle} background-color: #27272a; border: 1px solid #3f3f46; color: #a1a1aa;">Guest</span>`;
  };

  const partyRoles = [guest.role];
  if (guest.allocatedPlusOnes >= 1) partyRoles.push(guest.p1Role);
  if (guest.allocatedPlusOnes >= 2) partyRoles.push(guest.p2Role);
  if (guest.allocatedPlusOnes >= 3) partyRoles.push(guest.p3Role);
  
  const hasRole = (r: string) => partyRoles.map(x => (x || 'guest').toLowerCase()).includes(r);
  
  let announcementHtml = '';
  
  if (siteSettings?.messageAll) {
    announcementHtml += `<div style="background-color: #4a044e; border: 1px solid #831843; color: #f472b6; padding: 15px; margin-bottom: 15px; border-radius: 4px; font-size: 14px;">
      <span style="display: block; font-size: 10px; margin-bottom: 5px; opacity: 0.8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Announcement</span>
      ${siteSettings.messageAll}
    </div>`;
  }
  if (hasRole('admin') && siteSettings?.messageAdmin) {
    announcementHtml += `<div style="background-color: #451a03; border: 1px solid #78350f; color: #f59e0b; padding: 15px; margin-bottom: 15px; border-radius: 4px; font-size: 14px;">
      <span style="display: block; font-size: 10px; margin-bottom: 5px; opacity: 0.8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Announcement</span>
      ${siteSettings.messageAdmin}
    </div>`;
  }
  if (hasRole('openers') && siteSettings?.messageOpeners) {
    announcementHtml += `<div style="background-color: #022c22; border: 1px solid #064e3b; color: #34d399; padding: 15px; margin-bottom: 15px; border-radius: 4px; font-size: 14px;">
      <span style="display: block; font-size: 10px; margin-bottom: 5px; opacity: 0.8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Announcement</span>
      ${siteSettings.messageOpeners}
    </div>`;
  }
  if (hasRole('vip') && siteSettings?.messageVip) {
    announcementHtml += `<div style="background-color: #3b0764; border: 1px solid #581c87; color: #c084fc; padding: 15px; margin-bottom: 15px; border-radius: 4px; font-size: 14px;">
      <span style="display: block; font-size: 10px; margin-bottom: 5px; opacity: 0.8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Announcement</span>
      ${siteSettings.messageVip}
    </div>`;
  }
  if (hasRole('guest') && siteSettings?.messageGuest) {
    announcementHtml += `<div style="background-color: #18181b; border: 1px solid #3f3f46; color: #d4d4d8; padding: 15px; margin-bottom: 15px; border-radius: 4px; font-size: 14px;">
      <span style="display: block; font-size: 10px; margin-bottom: 5px; opacity: 0.8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Announcement</span>
      ${siteSettings.messageGuest}
    </div>`;
  }

  const title = isUpdate ? "Your RSVP Has Been Updated" : "You're on the Guest List";
  const status = guest.isAttending ? "Hell Yes (Attending)" : "Can't Make It (Declined)";
  
  let html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #450a0a; color: #f4f4f5; padding: 30px; border: 1px solid #3f3f46; border-radius: 4px;">
      <h2 style="color: #f472b6; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; margin-bottom: 5px;">Trent & Shy's "Till Death" Tour (Wedding)</h2>
      <h1 style="color: #f4f4f5; text-transform: uppercase; font-size: 24px; border-bottom: 2px solid #f472b6; padding-bottom: 10px; margin-top: 0; margin-bottom: 20px;">${title}</h1>
      
      ${announcementHtml}

      <div style="background-color: #52525b; padding: 15px; margin: 20px 0; border-left: 4px solid #f472b6; border-radius: 4px;">
        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Date:</strong> October 10, 2026</p>
        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Time:</strong> Doors TBA</p>
        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Venue:</strong> Baltimore Soundstage</p>
        <p style="margin: 0; font-size: 14px; color: #e4e4e7;">124 Market Pl, Baltimore, MD 21202</p>
      </div>

      <p style="color: #e4e4e7; font-size: 14px; margin-bottom: 30px;"><strong>Party under:</strong> <span style="color: #f472b6;">${guest.email}</span></p>
      
      <div style="border-bottom: 1px solid #3f3f46; padding-bottom: 15px; margin-bottom: 15px;">
        <div style="font-size: 10px; text-transform: uppercase; color: #f472b6; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px;">Main Guest</div>
        <h3 style="color: #f4f4f5; text-transform: uppercase; margin: 0 0 8px 0; font-size: 20px;">
          ${guest.firstName} ${guest.lastName || ''} ${getBadgeHtml(guest.role)}
        </h3>
        <p style="margin: 0; font-size: 14px; color: #e4e4e7;"><strong>Status:</strong> ${status}</p>
      </div>
  `;

  if (guest.allocatedPlusOnes >= 1) {
      const p1LastName = guest.p1LastName ? ` ${guest.p1LastName}` : '';
      html += `
      <div style="border-bottom: 1px solid #3f3f46; padding-bottom: 15px; margin-bottom: 15px;">
        <div style="font-size: 10px; text-transform: uppercase; color: #f472b6; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px;">Plus One</div>
        <h3 style="color: #f4f4f5; text-transform: uppercase; margin: 0 0 8px 0; font-size: 20px;">
          ${guest.p1Name || 'Guest'}${p1LastName} ${getBadgeHtml(guest.p1Role)}
        </h3>
        <p style="margin: 0; font-size: 14px; color: #e4e4e7;"><strong>Status:</strong> ${guest.p1Attending === 'true' ? 'Hell Yes (Attending)' : guest.p1Attending === 'false' ? "Can't Make It (Declined)" : 'Pending'}</p>
      </div>`;
  }
  if (guest.allocatedPlusOnes >= 2) {
      const p2LastName = guest.p2LastName ? ` ${guest.p2LastName}` : '';
      html += `
      <div style="border-bottom: 1px solid #3f3f46; padding-bottom: 15px; margin-bottom: 15px;">
        <div style="font-size: 10px; text-transform: uppercase; color: #f472b6; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px;">Plus Two</div>
        <h3 style="color: #f4f4f5; text-transform: uppercase; margin: 0 0 8px 0; font-size: 20px;">
          ${guest.p2Name || 'Guest'}${p2LastName} ${getBadgeHtml(guest.p2Role)}
        </h3>
        <p style="margin: 0; font-size: 14px; color: #e4e4e7;"><strong>Status:</strong> ${guest.p2Attending === 'true' ? 'Hell Yes (Attending)' : guest.p2Attending === 'false' ? "Can't Make It (Declined)" : 'Pending'}</p>
      </div>`;
  }
  if (guest.allocatedPlusOnes >= 3) {
      const p3LastName = guest.p3LastName ? ` ${guest.p3LastName}` : '';
      html += `
      <div style="border-bottom: 1px solid #3f3f46; padding-bottom: 15px; margin-bottom: 15px;">
        <div style="font-size: 10px; text-transform: uppercase; color: #f472b6; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px;">Plus Three</div>
        <h3 style="color: #f4f4f5; text-transform: uppercase; margin: 0 0 8px 0; font-size: 20px;">
          ${guest.p3Name || 'Guest'}${p3LastName} ${getBadgeHtml(guest.p3Role)}
        </h3>
        <p style="margin: 0; font-size: 14px; color: #e4e4e7;"><strong>Status:</strong> ${guest.p3Attending === 'true' ? 'Hell Yes (Attending)' : guest.p3Attending === 'false' ? "Can't Make It (Declined)" : 'Pending'}</p>
      </div>`;
  }

  if (guest.dietaryNotes) {
      html += `<h3 style="color: #f472b6; text-transform: uppercase; margin-top: 20px;">Dietary Note(s)</h3>
               <p>${guest.dietaryNotes}</p>`;
  }
  
  if (guest.songRequest) {
      html += `<h3 style="color: #f472b6; text-transform: uppercase; margin-top: 20px;">Song Request(s)</h3>
               <p>${guest.songRequest}</p>`;
  }

  html += `
      <div style="margin-top: 40px; border-top: 1px solid #3f3f46; padding-top: 20px;">
        <p style="color: #f4f4f5; font-size: 14px; font-weight: bold; margin: 0 0 5px 0;">Questions?</p>
        <p style="color: #e4e4e7; font-size: 14px; margin: 0 0 25px 0;">Please do not reply to this automated email. Instead, email <a href="mailto:shrentshredding@gmail.com" style="color: #f472b6; font-weight: bold;">shrentshredding@gmail.com</a>.</p>

        <h4 style="color: #f4f4f5; text-transform: uppercase; margin-top: 0; margin-bottom: 10px;">Need to update your RSVP?</h4>
        <p style="color: #e4e4e7; font-size: 14px; margin-bottom: 10px;">You can log back into the Box Office anytime before ${formattedCloseDate} to change your RSVP.</p>
        <div style="background-color: #52525b; padding: 15px; border-left: 4px solid #f472b6; border-radius: 4px;">
          <p style="color: #e4e4e7; font-size: 14px; margin: 0 0 5px 0;"><strong>Site Password:</strong> <span style="color: #f4f4f5;">frontrow2026</span></p>
          <p style="color: #e4e4e7; font-size: 14px; margin: 0;"><strong>Box Office (Update RSVP) Link:</strong> <a href="https://trentandshy.com/tickets" style="color: #f472b6; text-decoration: none; font-weight: bold;">https://trentandshy.com/tickets</a></p>
        </div>
      </div>
    </div>
  `;
  return html;
}

// ---------------------------------------------------------
// EXPORTED FUNCTIONS
// ---------------------------------------------------------

export async function sendGuestConfirmation(guest: any, isUpdate: boolean, siteSettings: any) {
  if (!process.env.SENDER_NO_REPLY) return;
  
  // Gather all valid emails for the party to ensure everyone gets the confirmation
  const toEmails = [guest.email, guest.p1Email, guest.p2Email, guest.p3Email]
    .filter(email => email != null && email.trim() !== '');
  
  // Deduplicate emails just in case they used the same email for multiple party members
  const uniqueToEmails = [...new Set(toEmails)].join(', ');

  if (!uniqueToEmails) return;

  const isTestMode = !!process.env.TEST_EMAIL_OVERRIDE;
  const targetEmail = isTestMode ? process.env.TEST_EMAIL_OVERRIDE : uniqueToEmails;
  const baseSubject = isUpdate ? "Your Trent & Shy RSVP is Updated" : "Trent & Shy RSVP Confirmed";
  const finalSubject = isTestMode ? `[TEST MODE - To: ${uniqueToEmails}] ${baseSubject}` : baseSubject;

  try {
    await transporter.sendMail({
      from: `"Trent & Shy Box Office" <${process.env.SENDER_NO_REPLY}>`,
      to: targetEmail,
      subject: finalSubject,
      html: buildGuestEmailHtml(guest, isUpdate, siteSettings)
    });
  } catch (error) {
    console.error("Error sending guest email:", error);
  }
}

export async function sendAdminNotification(guest: any, allGuests: any[], action: string) {
  if (!process.env.ADMIN_NOTIFY_EMAIL || !process.env.SENDER_RSVP) return;

  const csvContent = generateCSV(allGuests);
  
  const isTestMode = !!process.env.TEST_EMAIL_OVERRIDE;
  const targetEmail = isTestMode ? process.env.TEST_EMAIL_OVERRIDE : process.env.ADMIN_NOTIFY_EMAIL;
  const baseSubject = `RSVP Alert: ${guest.firstName} ${guest.lastName || ''} - ${action}`;
  const finalSubject = isTestMode ? `[TEST MODE - To: Admin] ${baseSubject}` : baseSubject;

  try {
    await transporter.sendMail({
      from: `"Trent & Shy RSVP" <${process.env.SENDER_RSVP}>`,
      to: targetEmail,
      subject: finalSubject,
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