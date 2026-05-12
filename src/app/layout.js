import "./globals.css";

export const metadata = {
  title: "3MIN",
  description: "Anonymous smart matching chat",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-[#f5f5f5] text-black">
        {children}
      </body>
    </html>
  );
}