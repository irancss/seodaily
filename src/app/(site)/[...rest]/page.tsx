import { notFound } from "next/navigation";

// Any URL that no other route matches renders the site's 404 (inside the
// public header and footer) with a 404 status.
export default function UnknownPage() {
  notFound();
}
