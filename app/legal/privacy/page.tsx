import Link from "next/link"

export const metadata = {
  title: "Privacy Policy - Gems Of India",
  description:
    "Learn how Gems Of India collects, uses, and protects your personal information when you use our platform.",
}

export default function PrivacyPolicyPage() {
  const lastUpdatedDate = "August 20, 2025"

  return (
    <div className="bg-secondary/20 py-8 sm:py-12">
      <div className="prose prose-zinc dark:prose-invert container mx-auto max-w-4xl px-4">
        <div className="bg-background rounded-xl border p-6 shadow-sm sm:p-8 dark:border-zinc-800">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: {lastUpdatedDate}</p>

          <div className="text-foreground/80 space-y-6 text-sm sm:text-base">
            <section>
              <h2 className="!mt-0 text-xl font-semibold">1. Introduction</h2>
              <p>
                Welcome to Gems Of India (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We
                are committed to fostering public accountability while respecting your privacy. This
                Privacy Policy explains how we collect, use, and protect your information when you
                use our platform and services (&quot;Services&quot;).
              </p>
            </section>

            <section>
              <h2 className="!mt-8 border-t pt-6 text-xl font-semibold dark:border-zinc-800">
                2. Information We Collect
              </h2>
              <p>
                <strong>Information You Provide to Us:</strong>
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>
                  <strong>Account Information:</strong> When you create an account, we collect your
                  name, email address, and password.
                </li>
                <li>
                  <strong>Profile Information:</strong> You may choose to provide a public username
                  and profile picture.
                </li>
                <li>
                  <strong>Public Content:</strong> We collect the information you post publicly,
                  including ratings, reviews, comments, and other information you contribute about
                  public officials or government services.
                </li>
                <li>
                  <strong>Communications:</strong> We collect information when you communicate with
                  us for support or other inquiries.
                </li>
              </ul>
              <p className="mt-4">
                <strong>Information We Collect Automatically:</strong>
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>
                  <strong>Usage Data:</strong> Information about your interactions with our
                  Services, such as pages viewed and features used.
                </li>
                <li>
                  <strong>Device and Location Data:</strong> Information about your device, browser,
                  operating system, and general location based on your IP address.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="!mt-8 border-t pt-6 text-xl font-semibold dark:border-zinc-800">
                3. How We Use Your Information
              </h2>
              <p>We use your information to:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Provide, maintain, and improve our Services.</li>
                <li>Create and manage your user account.</li>
                <li>Display your reviews and ratings publicly, attributed to your username.</li>
                <li>Communicate with you, including responding to your inquiries.</li>
                <li>Personalize your experience on our platform.</li>
                <li>Enforce our Terms of Service and Community Guidelines.</li>
                <li>Ensure the security of our platform and comply with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="!mt-8 border-t pt-6 text-xl font-semibold dark:border-zinc-800">
                4. Sharing Your Information
              </h2>
              <p>
                <strong>We do not sell your personal data.</strong> We may share your information in
                the following limited circumstances:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>
                  <strong>With Service Providers:</strong> We work with third-party vendors who help
                  us operate our platform (e.g., hosting, data analysis).
                </li>
                <li>
                  <strong>For Legal Reasons:</strong> We may disclose your information if required
                  by law or to protect the rights, property, or safety of Gems Of India, our users,
                  or the public.
                </li>
                <li>
                  <strong>With Your Consent:</strong> We may share information with your consent or
                  at your direction.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="!mt-8 border-t pt-6 text-xl font-semibold dark:border-zinc-800">
                5. Information That is Publicly Visible
              </h2>
              <p>
                Your <strong>username</strong> and any <strong>content you post</strong> (reviews,
                ratings, comments) are public and can be viewed by anyone visiting our platform.
                Please be mindful of the information you share in your public contributions. Your
                email address and password are always kept private.
              </p>
            </section>

            <section>
              <h2 className="!mt-8 border-t pt-6 text-xl font-semibold dark:border-zinc-800">
                6. Your Rights and Choices
              </h2>
              <p>You have rights regarding your personal data, including the ability to:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Access, rectify, or update your account information at any time.</li>
                <li>Delete your account and personal data (subject to certain exceptions).</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, please visit your account settings or contact us at{" "}
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "legal@gemsofindia.org"}`}
                  className="text-primary hover:underline"
                >
                  {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "legal@gemsofindia.org"}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="!mt-8 border-t pt-6 text-xl font-semibold dark:border-zinc-800">
                7. Data Security and Retention
              </h2>
              <p>
                We implement reasonable security measures to protect your information. We retain
                your personal data for as long as your account is active or as needed to provide our
                Services. When you delete your account, we will delete your personal information,
                but your public contributions may be retained (e.g., in an anonymized form) to
                maintain the integrity of the platform.
              </p>
            </section>

            <section>
              <h2 className="!mt-8 border-t pt-6 text-xl font-semibold dark:border-zinc-800">
                8. Children’s Privacy
              </h2>
              <p>
                Our Services are not directed to individuals under the age of 13. We do not
                knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="!mt-8 border-t pt-6 text-xl font-semibold dark:border-zinc-800">
                9. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any
                significant changes by posting the new policy on this page.
              </p>
            </section>

            <section>
              <h2 className="!mt-8 border-t pt-6 text-xl font-semibold dark:border-zinc-800">
                10. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:{" "}
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "legal@gemsofindia.org"}`}
                  className="text-primary hover:underline"
                >
                  {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "legal@gemsofindia.org"}
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 border-t pt-6 dark:border-zinc-800">
            <Link href="/legal" className="text-primary hover:underline">
              &larr; Back to Legal Information
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
