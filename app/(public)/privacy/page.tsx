import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - AuthApp',
  description: 'Privacy Policy for AuthApp',
}

export default function PrivacyPage() {
  return (
    <article className="prose dark:prose-invert max-w-3xl mx-auto">
      <h1>Privacy Policy</h1>
      <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect information you provide directly to us, such as when you
        create an account, update your profile, or contact us for support.
      </p>
      <h3>Personal Information</h3>
      <ul>
        <li>Email address</li>
        <li>Name</li>
        <li>Phone number (optional)</li>
        <li>Profile picture (optional)</li>
      </ul>

      <h3>Usage Information</h3>
      <ul>
        <li>Log data (IP address, browser type, pages visited)</li>
        <li>Device information</li>
        <li>Session data</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Process transactions and send related information</li>
        <li>Send technical notices and support messages</li>
        <li>Respond to your comments and questions</li>
        <li>Protect against fraudulent or illegal activity</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>
        We do not sell, trade, or otherwise transfer your personal information
        to third parties. We may share information only in the following
        circumstances:
      </p>
      <ul>
        <li>With your consent</li>
        <li>To comply with legal obligations</li>
        <li>To protect our rights and prevent fraud</li>
        <li>With service providers who assist our operations</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>
        We implement appropriate security measures to protect your personal
        information against unauthorized access, alteration, disclosure, or
        destruction. These measures include:
      </p>
      <ul>
        <li>Encryption of data in transit and at rest</li>
        <li>Regular security assessments</li>
        <li>Access controls and authentication</li>
        <li>Secure password hashing</li>
      </ul>

      <h2>5. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Export your data</li>
        <li>Withdraw consent at any time</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        We use cookies and similar technologies to maintain your session,
        remember your preferences, and improve your experience. You can control
        cookies through your browser settings.
      </p>

      <h2>7. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you
        of any changes by posting the new policy on this page and updating the
        &ldquo;Last updated&rdquo; date.
      </p>

      <h2>8. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at support@authapp.com.
      </p>
    </article>
  )
}
