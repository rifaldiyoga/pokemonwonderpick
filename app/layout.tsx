import type React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Wonder Pick Suggestion",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
