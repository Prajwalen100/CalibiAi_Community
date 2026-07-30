import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | CalibiAI",
  description: "Terms governing use of CalibiAI services.",
};

const updated = "July 30, 2026";

export default function TermsOfServicePage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50 p-8 dark:border-brand-900/50 dark:from-brand-950/30 dark:to-violet-950/20 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Legal</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Terms of Service</h1>
        <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">These Terms govern your use of CalibiAI&apos;s learning, community, portfolio, and career-platform services.</p>
        <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">Last updated: {updated}</p>
      </header>

      <div className="legal-prose mt-10">
        <p>These Terms of Service (&ldquo;Terms&rdquo;) form an agreement between you and CalibiAI (&ldquo;CalibiAI,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating an account, accessing, or using our website, applications, community, learning tools, employer features, and related services (collectively, the &ldquo;Services&rdquo;), you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Services.</p>

        <h2>1. Eligibility and accounts</h2>
        <p>You must be legally able to enter into these Terms and meet the minimum age required to use online services in your jurisdiction. You are responsible for providing accurate account information, safeguarding your account, and all activity occurring under it. Do not share credentials, impersonate another person, or create an account for another person without authorization.</p>

        <h2>2. The Services</h2>
        <p>CalibiAI provides educational, portfolio, community, and career-discovery tools. Features may include assessments, personalized learning roadmaps, AI-assisted feedback, project reviews, public profiles, community interactions, employer listings, and job applications. We may modify, suspend, or discontinue features to improve the Services, protect users, comply with law, or address operational needs.</p>
        <p>CalibiAI is not an educational institution, employer, recruiting agency, guarantor of employment, or provider of professional advice. A score, badge, verification, recommendation, feedback item, profile, job listing, or employer interaction does not guarantee admission, employment, compensation, interview selection, project quality, or any particular outcome.</p>

        <h2>3. Acceptable use</h2>
        <p>You must use the Services lawfully, respectfully, and only for their intended purpose. You must not:</p>
        <ul>
          <li>submit false, misleading, plagiarized, infringing, malicious, or unlawful content;</li>
          <li>misrepresent your identity, skills, qualifications, work, affiliations, or ownership of a project;</li>
          <li>harass, threaten, discriminate against, exploit, dox, spam, or otherwise harm another person;</li>
          <li>upload malware, attempt to bypass security, scrape the Services without permission, interfere with availability, or probe systems or accounts you do not own;</li>
          <li>use automation to manipulate scores, votes, follows, applications, reviews, rankings, or platform activity;</li>
          <li>use the Services to send unsolicited commercial communications or to collect personal information without a lawful basis;</li>
          <li>use AI-generated or third-party material in a way that violates rights, academic rules, employer rules, or applicable law; or</li>
          <li>encourage or assist anyone in doing any of the above.</li>
        </ul>

        <h2>4. Your content and profile</h2>
        <p>You retain ownership of content you submit, subject to the rights you grant below. You represent that you have the necessary rights and permissions to submit your content and that it does not violate law or the rights of others.</p>
        <p>To operate, improve, and promote the Services, you grant CalibiAI a non-exclusive, worldwide, royalty-free, sublicensable license to host, store, reproduce, process, adapt for technical purposes, display, and distribute your content as necessary to provide the Services. This license ends when your content is deleted from the Services, except to the extent it has been shared publicly, retained in backups for a limited period, or must be retained for legal, security, or dispute-resolution purposes.</p>
        <p>Public profile information, projects, and community posts may be seen, copied, linked to, or shared by other users and third parties. Use discretion when publishing personal or confidential information.</p>

        <h2>5. AI-assisted features and scoring</h2>
        <p>Some Services use automated systems or AI to provide feedback, recommendations, scoring inputs, summaries, and learning assistance. Outputs can be incomplete, inaccurate, or inappropriate for your circumstances. You are responsible for reviewing outputs and for your final submissions, decisions, and communications. Do not rely on AI output as legal, medical, financial, academic-integrity, employment, or other professional advice.</p>
        <p>We may investigate suspected manipulation, plagiarism, fraud, policy violations, or originality concerns. We may correct, withhold, recalculate, limit visibility of, or remove scores, badges, projects, or content where reasonably necessary to protect the integrity of the Services.</p>

        <h2>6. Community, employers, and applications</h2>
        <p>You are responsible for your interactions with other users, employers, and third parties. Employers are solely responsible for their listings, recruiting practices, communications, and decisions. Applicants are solely responsible for information submitted in an application. CalibiAI does not endorse, verify, or guarantee every user, employer, opportunity, listing, statement, or outcome.</p>
        <p>Do not share highly sensitive information in public posts or with unverified contacts. If you encounter suspicious conduct, use the available reporting or support channels.</p>

        <h2>7. Intellectual property</h2>
        <p>The Services, including their software, design, branding, text, graphics, and underlying technology, are owned by or licensed to CalibiAI and are protected by applicable intellectual-property laws. Except as expressly permitted by these Terms, you may not copy, modify, distribute, reverse engineer, sell, lease, or create derivative works from the Services.</p>

        <h2>8. Third-party services</h2>
        <p>The Services may link to or integrate with third-party services. Those services are governed by their own terms and privacy policies. CalibiAI is not responsible for third-party services, content, availability, security, or practices.</p>

        <h2>9. Suspension and termination</h2>
        <p>You may stop using the Services at any time. We may suspend or terminate access, remove content, or restrict features if we reasonably believe you have violated these Terms, created risk for users or the Services, failed to meet legal requirements, or if we must do so for operational or security reasons. Provisions that by their nature should survive termination will survive, including those concerning intellectual property, disclaimers, limitations of liability, and disputes.</p>

        <h2>10. Disclaimers</h2>
        <p>THE SERVICES ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, CALIBIAI DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, AVAILABILITY, AND SECURITY. We do not warrant that the Services will be uninterrupted, error-free, secure, or free from harmful components.</p>

        <h2>11. Limitation of liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, CALIBIAI AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND PROVIDERS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOSS OF DATA, PROFITS, GOODWILL, OPPORTUNITIES, OR REPUTATION ARISING FROM OR RELATED TO THE SERVICES. Where liability cannot be excluded, it will be limited to the minimum extent permitted by applicable law.</p>

        <h2>12. Indemnity</h2>
        <p>To the extent permitted by law, you will defend, indemnify, and hold harmless CalibiAI and its affiliates, officers, employees, and providers from claims, damages, losses, and expenses arising from your content, your use of the Services, your violation of these Terms, or your violation of another person&apos;s rights.</p>

        <h2>13. Governing law and disputes</h2>
        <p>These Terms are governed by the laws of India, without regard to conflict-of-law principles, subject to any mandatory consumer-protection rules that apply where you live. Before starting formal proceedings, you agree to contact CalibiAI through official support channels and allow a reasonable opportunity to resolve the matter. Nothing in these Terms limits rights that cannot be waived under applicable law.</p>

        <h2>14. Changes to these Terms</h2>
        <p>We may revise these Terms from time to time. We will post revised Terms on this page and update the date above. If a change is material, we may provide additional notice where required. Your continued use after the revised Terms take effect means you accept them.</p>

        <h2>15. Contact</h2>
        <p>For questions about these Terms, contact CalibiAI through the official support channel available within the Services. Please do not send passwords, authentication codes, or other sensitive credentials in a support request.</p>
      </div>
    </article>
  );
}
