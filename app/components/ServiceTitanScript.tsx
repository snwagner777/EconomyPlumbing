'use client';

import Script from 'next/script';

/**
 * ServiceTitan Scheduler Script Component
 * Loads the ServiceTitan web scheduler widget for online appointment booking
 * Widget ID: 3ce4a586-8427-4716-9ac6-46cb8bf7ac4f
 */
export function ServiceTitanScript() {
  return (
    <>
      <Script
        id="servicetitan-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(q,w,e,r,t,y,u){q[t]=q[t]||function(){(q[t].q = q[t].q || []).push(arguments)};
              q[t].l=1*new Date();y=w.createElement(e);u=w.getElementsByTagName(e)[0];y.async=true;
              y.src=r;u.parentNode.insertBefore(y,u);q[t]('init', '3ce4a586-8427-4716-9ac6-46cb8bf7ac4f');
            })(window, document, 'script', 'https://static.servicetitan.com/webscheduler/shim.js', 'STWidgetManager');
          `,
        }}
      />
    </>
  );
}
