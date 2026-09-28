import Script from "next/script";

/** Google's standard GTM loader; it reads the events already queued in window.dataLayer. */
export function TagManager({ id }: { id: string }) {
  // The ID is interpolated into a script, so anything but the exact format is dropped.
  if (!/^GTM-[A-Z0-9]{4,12}$/.test(id)) return null;
  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
    </Script>
  );
}
