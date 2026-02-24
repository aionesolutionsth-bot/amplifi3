export const metadata = {
  title: "Amplifi3 — Web3 KOL Network",
  description: "400+ vetted crypto creators. Launch your campaign in 24 hours.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#080B12" }}>
        {children}
      </body>
    </html>
  );
}
