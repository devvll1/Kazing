import type { Metadata } from "next";
import "./globals.css";

// TODO: change these to your app's name and description.
export const metadata: Metadata = {
  title: "Kazing! | Live classroom quizzes",
  description: "A browser-based live quiz game for energetic classrooms.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
