import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    {
      title:
        "Privacy Policy | Pincode Validator Pro",
    },
    {
      name: "description",
      content:
        "Privacy Policy for the Pincode Validator Pro Shopify application by PP DESIGN AND TECH.",
    },
    {
      name: "robots",
      content: "index, follow",
    },
  ];
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <article className="legal-container">
        <header className="legal-header">
          <a
            href="https://ppdesigntech.com"
            className="legal-brand"
          >
            PP DESIGN AND TECH
          </a>

          <span className="legal-app-name">
            Pincode Validator Pro
          </span>
        </header>

        <section className="legal-card">
          <div className="legal-title-block">
            <span className="legal-eyebrow">
              Legal
            </span>

            <h1>Privacy Policy</h1>

            <p className="legal-updated">
              Last updated: July 2026
            </p>
          </div>

          <div className="legal-content">
            <p>
              This Privacy Policy explains how PP
              DESIGN AND TECH (“we”, “our” or “us”)
              collects, uses, stores and protects
              information when Shopify merchants use
              the Pincode Validator Pro application
              (“the App”).
            </p>

            <p>
              By installing or using the App, you
              acknowledge the practices described in
              this Privacy Policy.
            </p>

            <section>
              <h2>1. Information we collect</h2>

              <p>
                We collect and process only the
                information reasonably necessary to
                provide the App’s delivery
                serviceability features.
              </p>

              <h3>Merchant and store information</h3>

              <ul>
                <li>
                  Shopify store domain and internal
                  shop identifier
                </li>

                <li>
                  Shopify authentication and session
                  information required to operate the
                  embedded application
                </li>

                <li>
                  Application installation and
                  uninstallation status
                </li>
              </ul>

              <h3>Merchant-provided information</h3>

              <ul>
                <li>
                  Delivery pincodes uploaded or
                  entered by the merchant
                </li>

                <li>
                  City, state and country information
                  associated with pincodes
                </li>

                <li>
                  COD and prepaid availability
                  settings
                </li>

                <li>
                  Estimated delivery time and active
                  status
                </li>

                <li>
                  Storefront validation and display
                  settings configured by the merchant
                </li>
              </ul>

              <h3>Technical information</h3>

              <ul>
                <li>
                  Limited technical logs required for
                  security, debugging and application
                  reliability
                </li>

                <li>
                  Validation activity, where enabled,
                  without requiring customer identity
                </li>
              </ul>
            </section>

            <section>
              <h2>
                2. Information we do not require
              </h2>

              <p>
                The App does not require merchants to
                provide us with:
              </p>

              <ul>
                <li>
                  Customer payment or credit card
                  information
                </li>

                <li>Customer passwords</li>

                <li>
                  Customer order histories
                </li>

                <li>
                  Customer account login credentials
                </li>

                <li>
                  Full customer delivery addresses
                </li>
              </ul>
            </section>

            <section>
              <h2>
                3. Shopify customer information
              </h2>

              <p>
                The App is designed to validate a
                postal code entered on the storefront.
                It does not need to permanently store
                Shopify customer profiles or customer
                personal information to provide this
                feature.
              </p>

              <p>
                We have implemented Shopify’s
                mandatory privacy webhooks for:
              </p>

              <ul>
                <li>
                  Customer data access requests
                </li>

                <li>
                  Customer data redaction requests
                </li>

                <li>Shop data redaction requests</li>
              </ul>

              <p>
                Where the App does not hold applicable
                customer personal information, the
                request is safely acknowledged in
                accordance with Shopify’s
                requirements.
              </p>
            </section>

            <section>
              <h2>
                4. How we use information
              </h2>

              <p>
                Information processed through the App
                is used to:
              </p>

              <ul>
                <li>
                  Validate whether delivery is
                  available for an entered pincode
                </li>

                <li>
                  Display delivery estimates, COD
                  availability and location details
                </li>

                <li>
                  Store merchant application settings
                </li>

                <li>
                  Authenticate merchants and maintain
                  secure sessions
                </li>

                <li>
                  Provide customer support and
                  troubleshoot errors
                </li>

                <li>
                  Protect the App against misuse and
                  security threats
                </li>

                <li>
                  Maintain and improve application
                  reliability
                </li>

                <li>
                  Meet legal and Shopify platform
                  requirements
                </li>
              </ul>
            </section>

            <section>
              <h2>
                5. Legal basis for processing
              </h2>

              <p>
                Depending on your location, we process
                information because it is necessary to
                provide the App under our agreement
                with the merchant, to comply with
                legal obligations, and for legitimate
                interests such as application
                security, support and service
                improvement.
              </p>
            </section>

            <section>
              <h2>
                6. Data storage and security
              </h2>

              <p>
                Application data is stored in a
                PostgreSQL database. The production
                application is hosted using Railway
                infrastructure and is made available
                through encrypted HTTPS connections.
              </p>

              <p>
                Security measures include:
              </p>

              <ul>
                <li>HTTPS encryption in transit</li>

                <li>
                  Shopify OAuth and embedded
                  application authentication
                </li>

                <li>
                  Shopify app-proxy authentication
                </li>

                <li>
                  Webhook authentication and
                  verification
                </li>

                <li>
                  Shop-level database access controls
                </li>

                <li>
                  Transactional database operations
                  for sensitive imports and deletion
                </li>

                <li>
                  Restricted production environment
                  variables and credentials
                </li>

                <li>
                  Safe error responses that do not
                  intentionally expose database
                  credentials or internal system
                  details
                </li>
              </ul>

              <p>
                No method of transmission or storage
                is completely secure. We take
                reasonable measures to protect
                information but cannot guarantee
                absolute security.
              </p>
            </section>

            <section>
              <h2>
                7. Data retention and deletion
              </h2>

              <p>
                Merchant data is retained while
                reasonably necessary to operate the
                App and provide the requested service.
              </p>

              <p>
                When a merchant uninstalls the App,
                session information is removed as part
                of the uninstall cleanup process.
                Shopify’s shop-redaction webhook is
                also used to permanently remove the
                associated shop data, including:
              </p>

              <ul>
                <li>Application settings</li>
                <li>Pincode records</li>
                <li>Validation logs</li>
                <li>
                  Other records linked to the shop
                </li>
              </ul>

              <p>
                Shopify may deliver the shop-redaction
                request after its prescribed retention
                period. Data may also be deleted
                earlier where appropriate or upon a
                valid request.
              </p>
            </section>

            <section>
              <h2>
                8. Third-party service providers
              </h2>

              <p>
                We may rely on service providers to
                operate the App, including:
              </p>

              <ul>
                <li>
                  Shopify, for the application
                  platform, authentication and APIs
                </li>

                <li>
                  Railway, for application and
                  infrastructure hosting
                </li>

                <li>
                  PostgreSQL infrastructure used to
                  store application data
                </li>
              </ul>

              <p>
                These providers may process limited
                information on our behalf according
                to their own contractual and privacy
                obligations.
              </p>
            </section>

            <section>
              <h2>
                9. Sale and advertising use of data
              </h2>

              <p>
                We do not sell merchant or customer
                personal information. We do not use
                pincode validation data for
                third-party behavioural advertising.
              </p>
            </section>

            <section>
              <h2>
                10. International processing
              </h2>

              <p>
                Service providers may process
                information in countries other than
                the merchant’s country. Where
                required, we take reasonable steps to
                use appropriate safeguards for such
                processing.
              </p>
            </section>

            <section>
              <h2>11. Your rights</h2>

              <p>
                Subject to applicable law, merchants
                may request access to, correction of
                or deletion of information associated
                with their use of the App.
              </p>

              <p>
                Merchants can also delete their App
                data through the uninstall and
                Shopify privacy-redaction processes.
              </p>
            </section>

            <section>
              <h2>12. Children’s privacy</h2>

              <p>
                The App is intended for Shopify
                merchants and is not directed to
                children. We do not knowingly collect
                personal information from children
                through the App.
              </p>
            </section>

            <section>
              <h2>
                13. Changes to this policy
              </h2>

              <p>
                We may update this Privacy Policy to
                reflect changes to the App, legal
                requirements or our data-processing
                practices. The updated date at the top
                of this page will indicate when the
                policy was most recently revised.
              </p>
            </section>

            <section>
              <h2>14. Contact us</h2>

              <p>
                Questions or requests concerning this
                Privacy Policy may be sent to:
              </p>

              <address>
                <strong>PP DESIGN AND TECH</strong>
                <br />

                Email:{" "}
                <a href="mailto:ppdesignandtech@gmail.com">
                  ppdesignandtech@gmail.com
                </a>
                <br />

                Website:{" "}
                <a
                  href="https://ppdesigntech.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  ppdesigntech.com
                </a>
              </address>
            </section>
          </div>
        </section>

        <footer className="legal-footer">
          <span>
            © {new Date().getFullYear()} PP DESIGN
            AND TECH
          </span>

          <a href="/privacy">
            Privacy Policy
          </a>
        </footer>
      </article>

      <style>
        {`
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
          }

          html {
            scroll-behavior: smooth;
          }

          body {
            margin: 0;
            background: #f4f6f8;
            color: #202223;
            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .legal-page {
            min-height: 100vh;
            padding: 32px 20px 48px;
            background:
              radial-gradient(
                circle at top right,
                rgba(0, 91, 211, 0.08),
                transparent 34%
              ),
              #f4f6f8;
          }

          .legal-container {
            width: 100%;
            max-width: 960px;
            margin: 0 auto;
          }

          .legal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 20px;
          }

          .legal-brand {
            color: #111827;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.03em;
            text-decoration: none;
          }

          .legal-brand:hover {
            text-decoration: underline;
          }

          .legal-app-name {
            color: #6d7175;
            font-size: 13px;
            font-weight: 600;
          }

          .legal-card {
            overflow: hidden;
            border: 1px solid #dfe3e8;
            border-radius: 18px;
            background: #ffffff;
            box-shadow:
              0 14px 36px
              rgba(20, 25, 30, 0.08);
          }

          .legal-title-block {
            padding: 44px 48px 38px;
            border-bottom: 1px solid #e8eaed;
            background:
              linear-gradient(
                135deg,
                #111827 0%,
                #1f2937 62%,
                #0f766e 145%
              );
            color: #ffffff;
          }

          .legal-eyebrow {
            display: inline-flex;
            padding: 6px 10px;
            border: 1px solid
              rgba(255, 255, 255, 0.2);
            border-radius: 999px;
            background:
              rgba(255, 255, 255, 0.08);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .legal-title-block h1 {
            margin: 18px 0 8px;
            font-size: clamp(
              32px,
              5vw,
              48px
            );
            line-height: 1.08;
            letter-spacing: -0.035em;
          }

          .legal-updated {
            margin: 0;
            color:
              rgba(255, 255, 255, 0.72);
            font-size: 13px;
          }

          .legal-content {
            padding: 42px 48px 52px;
          }

          .legal-content > p:first-child {
            margin-top: 0;
          }

          .legal-content section {
            padding-top: 10px;
          }

          .legal-content section +
          section {
            margin-top: 28px;
            padding-top: 30px;
            border-top: 1px solid #eceff1;
          }

          .legal-content h2 {
            margin: 0 0 12px;
            color: #111827;
            font-size: 21px;
            line-height: 1.3;
          }

          .legal-content h3 {
            margin: 22px 0 8px;
            color: #303030;
            font-size: 15px;
          }

          .legal-content p,
          .legal-content li,
          .legal-content address {
            color: #4a4f55;
            font-size: 15px;
            line-height: 1.75;
          }

          .legal-content p {
            margin: 12px 0;
          }

          .legal-content ul {
            display: grid;
            gap: 8px;
            margin: 14px 0 0;
            padding-left: 22px;
          }

          .legal-content li::marker {
            color: #005bd3;
          }

          .legal-content a {
            color: #005bd3;
            font-weight: 600;
            overflow-wrap: anywhere;
          }

          .legal-content address {
            margin-top: 14px;
            padding: 18px;
            border: 1px solid #dfe3e8;
            border-radius: 12px;
            background: #f8fafc;
            font-style: normal;
          }

          .legal-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 20px 4px 0;
            color: #6d7175;
            font-size: 12px;
          }

          .legal-footer a {
            color: #4a4f55;
            font-weight: 600;
            text-decoration: none;
          }

          .legal-footer a:hover {
            text-decoration: underline;
          }

          a:focus-visible {
            outline: 3px solid
              rgba(0, 91, 211, 0.3);
            outline-offset: 3px;
            border-radius: 3px;
          }

          @media (max-width: 700px) {
            .legal-page {
              padding: 18px 12px 34px;
            }

            .legal-header {
              align-items: flex-start;
              flex-direction: column;
              gap: 5px;
              padding: 0 4px;
            }

            .legal-title-block {
              padding: 32px 22px 28px;
            }

            .legal-content {
              padding: 30px 22px 38px;
            }

            .legal-content h2 {
              font-size: 19px;
            }

            .legal-content p,
            .legal-content li,
            .legal-content address {
              font-size: 14px;
            }

            .legal-footer {
              align-items: flex-start;
              flex-direction: column;
              padding-left: 4px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            html {
              scroll-behavior: auto;
            }
          }
        `}
      </style>
    </main>
  );
}