import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | CalibiAI",
  description: "How CalibiAI collects, uses, shares, and protects personal information.",
};

const updated = "July 30, 2026";

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50 p-8 dark:border-brand-900/50 dark:from-brand-950/30 dark:to-violet-950/20 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Legal</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Privacy Policy</h1>
        <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">This policy explains how CalibiAI handles personal information when you use our learning, community, portfolio, and career-platform services.</p>
        <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">Last updated: {updated}</p>
      </header>

      <div className="legal-prose mt-10">
        <p>CalibiAI (&ldquo;CalibiAI,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy. This Privacy Policy describes the information we collect, how we use it, when we share it, and the choices available to you. By accessing or using CalibiAI, you acknowledge the practices described in this policy.</p>

        <h2>1. Scope</h2>
        <p>This policy applies to the CalibiAI website, applications, community spaces, learning tools, employer features, and related services (collectively, the &ldquo;Services&rdquo;). It does not apply to third-party websites, services, or content that may be linked from the Services.</p>

        <h2>2. Information we collect</h2>
        <h3>Information you provide</h3>
        <p>We may collect information you choose to provide, including your name, email address, username, profile image, phone number, college, branch, graduation year, target role, biography, professional links, learning submissions, portfolio projects, resumes, job-application materials, community posts, comments, messages, and support requests.</p>
        <h3>Learning and platform activity</h3>
        <p>We collect information generated through use of the Services, such as assessment responses and results, roadmap progress, quiz and task submissions, verified skills, project-review results, scores, badges, community activity, saved content, follows, and application status. This information helps provide the learning experience, display your profile as configured by you, and operate platform features.</p>
        <h3>Technical and usage information</h3>
        <p>We may receive device, browser, log, IP-address, approximate location, authentication, cookie, and usage information. We use this information to maintain security, diagnose failures, prevent abuse, understand product performance, and improve the Services.</p>
        <h3>Information from third parties</h3>
        <p>If you sign in through a third-party identity provider or connect an external account, we may receive the information that provider makes available according to your settings and its own privacy policy.</p>

        <h2>3. How we use information</h2>
        <p>We use information to: provide and personalize the Services; create and maintain accounts; generate learning roadmaps and feedback; calculate and display platform scores and progress; enable community, employer, and job-application features; communicate about service, safety, and support matters; protect users and the platform; enforce our Terms; comply with legal obligations; and analyze and improve the Services.</p>
        <p>Automated and AI-assisted features may process content you submit to provide feedback, recommendations, summaries, or learning support. Such outputs may be inaccurate and should be reviewed by you before you rely on them for academic, professional, legal, medical, financial, or other important decisions.</p>

        <h2>4. How information is shared</h2>
        <p>We do not sell personal information. We may share information in the following circumstances:</p>
        <ul>
          <li><strong>Public and community content:</strong> Information you choose to publish, including your public profile, projects, posts, comments, reactions, and other public activity, may be visible to other users and may be indexed or copied by others.</li>
          <li><strong>Employers and opportunities:</strong> When you apply for a role or choose to share your profile, we may provide the relevant profile, portfolio, application, and contact information to that employer or opportunity provider.</li>
          <li><strong>Service providers:</strong> We may use vetted providers for hosting, authentication, storage, analytics, communications, and AI-enabled functionality, under contractual or technical safeguards appropriate to their role.</li>
          <li><strong>Legal, safety, and business reasons:</strong> We may disclose information where reasonably necessary to comply with law, protect rights or safety, investigate misuse, enforce agreements, or in connection with a merger, financing, acquisition, or transfer of assets.</li>
          <li><strong>With your direction or consent:</strong> We may share information when you ask us to or otherwise give permission.</li>
        </ul>

        <h2>5. Your choices and rights</h2>
        <p>You can update certain account and profile information through the Services. You may choose whether to add optional profile details or connect external links. You may request access, correction, deletion, or a copy of personal information, subject to applicable law and legitimate operational, security, fraud-prevention, recordkeeping, or legal requirements. Deleting public content may not remove copies already made by other users or retained in backups for a limited period.</p>
        <p>Where applicable law gives you additional rights, including rights to object to or restrict certain processing, we will honor valid requests in accordance with that law. To make a privacy request, contact CalibiAI through our official support channel and include enough information for us to verify your account and request.</p>

        <h2>6. Data retention</h2>
        <p>We retain information for as long as reasonably necessary to provide the Services, maintain security, resolve disputes, comply with legal obligations, and enforce agreements. Retention periods depend on the type of information, the purpose of processing, and legal or operational requirements.</p>

        <h2>7. Security</h2>
        <p>We use reasonable administrative, technical, and organizational measures designed to protect information. No system is completely secure, however, and we cannot guarantee absolute security. Please use a strong, unique password where applicable and notify us promptly if you believe your account has been compromised.</p>

        <h2>8. International processing</h2>
        <p>Your information may be processed in countries other than the country in which you reside. Those countries may have data-protection laws that differ from your local laws. When we transfer information, we take steps appropriate to the nature of the transfer and applicable law.</p>

        <h2>9. Children</h2>
        <p>The Services are not directed to children under the minimum age required to consent to online services in their jurisdiction. We do not knowingly collect personal information from children in violation of applicable law. If you believe a child has provided us personal information improperly, please contact us through official support channels.</p>

        <h2>10. Changes to this policy</h2>
        <p>We may update this Privacy Policy to reflect changes in our Services, legal requirements, or privacy practices. We will post the updated policy here and revise the &ldquo;Last updated&rdquo; date. Where required, we will provide additional notice or request consent.</p>

        <h2>11. Contact</h2>
        <p>For privacy questions or requests, please contact CalibiAI through the official support channel available within the Services. Please do not send passwords, authentication codes, or other sensitive credentials in a support request.</p>
      </div>
    </article>
  );
}
