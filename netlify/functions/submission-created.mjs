// Sends each website enquiry to Trail CRM as a new contact.
//
// Netlify runs this automatically every time someone submits the enquiry form,
// after its spam filter. The enquiry is already saved in Netlify Forms and
// emailed to Philippa before this runs, so a Trail problem never loses a lead.
//
// Settings, added in Netlify under Site configuration > Environment variables:
//   TRAIL_API_KEY       the API token from Trail (Organization settings > Integrations > API Access)
//   TRAIL_CONTACT_URL   the Trail endpoint that creates a contact (from Trail's Contact API docs)
//   TRAIL_ADVISER_ID    optional: the Trail adviser or user to assign the contact to
//
// IMPORTANT: confirm the endpoint and field names below against Trail's API
// reference (developer.gettrail.com > API reference > Contact) before going live.

export const handler = async (event) => {
  let submission;
  try {
    submission = JSON.parse(event.body).payload;
  } catch {
    return { statusCode: 400, body: "Bad payload" };
  }

  if (submission?.form_name !== "enquiry") return { statusCode: 200, body: "Not the enquiry form" };

  const { TRAIL_API_KEY, TRAIL_CONTACT_URL, TRAIL_ADVISER_ID } = process.env;
  if (!TRAIL_API_KEY || !TRAIL_CONTACT_URL) {
    console.log("Trail not set up yet: add TRAIL_API_KEY and TRAIL_CONTACT_URL in Netlify.");
    return { statusCode: 200, body: "Trail not configured" };
  }

  const d = submission.data || {};
  const [firstName, ...rest] = String(d.name || "").trim().split(/\s+/);

  // Field names: check these match Trail's Contact API.
  const contact = {
    firstName: firstName || "",
    lastName: rest.join(" "),
    email: d.email || "",
    mobile: d.phone || "",
    source: "Website enquiry",
    referrer: d.referral || "",
    notes: [
      `Website enquiry, ${new Date().toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" })}`,
      `Lending: ${d.overview || ""}`,
      d.referral ? `Introduced by: ${d.referral}` : ""
    ].filter(Boolean).join("\n"),
    ...(TRAIL_ADVISER_ID ? { adviserId: TRAIL_ADVISER_ID } : {})
  };

  try {
    const res = await fetch(TRAIL_CONTACT_URL, {
      method: "POST",
      headers: { Authorization: TRAIL_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(contact)
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`Trail returned ${res.status}: ${text.slice(0, 500)}`);
      return { statusCode: 200, body: "Saved in Netlify, Trail rejected it" };
    }
    console.log("Contact created in Trail");
    return { statusCode: 200, body: "Sent to Trail" };
  } catch (err) {
    console.error("Could not reach Trail:", err.message);
    return { statusCode: 200, body: "Saved in Netlify, Trail unreachable" };
  }
};
