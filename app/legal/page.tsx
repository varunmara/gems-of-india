import Link from "next/link"

// I've replaced RiMedalLine with RiTeamLine for the new "Community Guidelines" section.
import { RiFilePaper2Line, RiShieldUserLine, RiTeamLine } from "@remixicon/react"

export const metadata = {
  title: "Legal Information - Gems Of India",
  description:
    "Review the legal documents, policies, and community guidelines that govern the use of the Gems Of India platform.",
}

export default function LegalPage() {
  return (
    <div className="bg-secondary/20 py-8 sm:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-background rounded-xl border p-6 shadow-sm sm:p-8 dark:border-zinc-800">
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Legal & Policies</h1>
          <p className="text-muted-foreground mb-8">
            At Gems Of India, we are dedicated to fostering transparency and public accountability.
            Our platform empowers users to contribute ratings, reviews, and information about public
            officials and government services. Please review our legal documents to understand your
            rights, responsibilities, and how we operate as a community-driven platform.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/legal/terms"
              className="hover:bg-secondary/10 flex flex-col items-center rounded-lg border p-6 text-center transition-colors dark:border-zinc-800"
            >
              <RiFilePaper2Line className="text-primary mb-4 h-12 w-12" />
              <h2 className="mb-2 text-lg font-semibold">Terms of Service</h2>
              <p className="text-muted-foreground text-sm">
                The fundamental rules and guidelines for using the Gems Of India platform, including
                your rights and obligations.
              </p>
            </Link>

            <Link
              href="/legal/privacy"
              className="hover:bg-secondary/10 flex flex-col items-center rounded-lg border p-6 text-center transition-colors dark:border-zinc-800"
            >
              <RiShieldUserLine className="text-primary mb-4 h-12 w-12" />
              <h2 className="mb-2 text-lg font-semibold">Privacy Policy</h2>
              <p className="text-muted-foreground text-sm">
                Details on how we collect, use, and safeguard your personal data when you use our
                services.
              </p>
            </Link>

            <Link
              href="/legal/community-guidelines"
              className="hover:bg-secondary/10 flex flex-col items-center rounded-lg border p-6 text-center transition-colors dark:border-zinc-800"
            >
              <RiTeamLine className="text-primary mb-4 h-12 w-12" />
              <h2 className="mb-2 text-lg font-semibold">Community Guidelines</h2>
              <p className="text-muted-foreground text-sm">
                Rules for user-contributed content to ensure a safe, respectful, and constructive
                environment.
              </p>
            </Link>
          </div>

          <div className="mt-10 border-t pt-6 dark:border-zinc-800">
            <h2 className="mb-4 text-xl font-semibold">Contact Information</h2>
            <p className="mb-2">
              If you have any questions about our legal policies, please contact us:
            </p>
            <ul className="mb-6 space-y-2">
              <li>
                <strong>Email:</strong>{" "}
                {/* Ensure your .env.local file has NEXT_PUBLIC_CONTACT_EMAIL set */}
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "legal@gemsofindia.org"}`}
                  className="text-primary hover:underline"
                >
                  {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "legal@gemsofindia.org"}
                </a>
              </li>
            </ul>
          </div>

          <div className="mt-8 border-t pt-6 dark:border-zinc-800">
            <Link href="/" className="text-primary hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
