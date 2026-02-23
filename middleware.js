import { next } from '@vercel/edge';

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};

// Countries to block (ISO 3166-1 alpha-2 codes)
const BLOCKED_COUNTRIES = [
  'US', // United States
];

export default function middleware(request) {
  const country = request.geo?.country || 'XX';
  
  if (BLOCKED_COUNTRIES.includes(country)) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>KNEEL - Not Available</title>
          <style>
            body {
              background: #000;
              color: #FFD700;
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .container {
              max-width: 500px;
              padding: 2rem;
            }
            h1 { font-size: 3rem; margin-bottom: 1rem; }
            p { color: #aaa; font-size: 1.1rem; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>$KNEEL</h1>
            <p>This service is not available in your region due to regulatory restrictions.</p>
            <p style="margin-top: 2rem; font-size: 0.9rem; color: #666;">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </body>
      </html>`,
      {
        status: 451, // Unavailable For Legal Reasons
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }

  return next();
}
