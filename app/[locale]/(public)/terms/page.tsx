import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - AuthApp',
  description: 'Terms of Service for AuthApp',
}

export default function TermsPage() {
  return (
    <article className="prose dark:prose-invert max-w-3xl mx-auto">
      <h1>Terms of Service</h1>
      <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using AuthApp, you agree to be bound by these Terms of
        Service. If you do not agree to these terms, please do not use our
        services.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        AuthApp provides a self-hosted authentication and user management
        platform. Our services include user registration, login, password
        management, two-factor authentication, and organization management.
      </p>

      <h2>3. User Accounts</h2>
      <h3>Registration</h3>
      <p>
        To use certain features, you must register for an account. You agree to:
      </p>
      <ul>
        <li>Provide accurate and complete information</li>
        <li>Maintain the security of your account credentials</li>
        <li>Notify us immediately of any unauthorized use</li>
        <li>Accept responsibility for all activities under your account</li>
      </ul>

      <h3>Account Termination</h3>
      <p>
        We reserve the right to suspend or terminate your account if you violate
        these terms or engage in fraudulent or illegal activity.
      </p>

      <h2>4. User Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service for any unlawful purpose</li>
        <li>Attempt to gain unauthorized access to our systems</li>
        <li>Interfere with or disrupt the service</li>
        <li>Upload malicious code or content</li>
        <li>Impersonate others or provide false information</li>
        <li>Violate the rights of others</li>
      </ul>

      <h2>5. Intellectual Property</h2>
      <p>
        The service and its original content, features, and functionality are
        owned by AuthApp and are protected by international copyright,
        trademark, patent, trade secret, and other intellectual property laws.
      </p>

      <h2>6. Subscriptions and Payments</h2>
      <h3>Billing</h3>
      <p>
        Some features require a paid subscription. You agree to pay all fees
        associated with your subscription plan. Fees are non-refundable except
        as required by law.
      </p>

      <h3>Cancellation</h3>
      <p>
        You may cancel your subscription at any time. Cancellation will take
        effect at the end of the current billing period.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, AuthApp shall not be liable for
        any indirect, incidental, special, consequential, or punitive damages
        resulting from your use of the service.
      </p>

      <h2>8. Disclaimer of Warranties</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; without warranties of any kind, either express or
        implied, including but not limited to implied warranties of
        merchantability and fitness for a particular purpose.
      </p>

      <h2>9. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless AuthApp and its officers,
        directors, employees, and agents from any claims, damages, losses, or
        expenses arising from your use of the service or violation of these
        terms.
      </p>

      <h2>10. Changes to Terms</h2>
      <p>
        We reserve the right to modify these terms at any time. We will provide
        notice of significant changes. Your continued use of the service after
        changes constitutes acceptance of the new terms.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These terms shall be governed by and construed in accordance with the
        laws of the jurisdiction in which AuthApp operates, without regard to
        its conflict of law provisions.
      </p>

      <h2>12. Contact</h2>
      <p>
        For questions about these Terms of Service, please contact us at
        support@authapp.com.
      </p>
    </article>
  )
}
