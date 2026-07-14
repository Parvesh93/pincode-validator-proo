import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    {
      title:
        "Support & Documentation | Pincode Validator Pro",
    },
    {
      name: "description",
      content:
        "Installation, setup, CSV import, settings and troubleshooting documentation for Pincode Validator Pro.",
    },
    {
      name: "robots",
      content: "index, follow",
    },
  ];
};

export default function SupportPage() {
  return (
    <main className="support-page">
      <div className="support-shell">
        <header className="support-header">
          <a
            href="https://ppdesigntech.com"
            className="support-brand"
          >
            PP DESIGN AND TECH
          </a>

          <nav
            className="support-top-nav"
            aria-label="Support navigation"
          >
            <a href="#getting-started">
              Getting started
            </a>

            <a href="#pincodes">
              Pincodes
            </a>

            <a href="#troubleshooting">
              Troubleshooting
            </a>

            <a href="#contact">
              Contact
            </a>
          </nav>
        </header>

        <section className="support-hero">
          <div className="support-hero-content">
            <span className="support-eyebrow">
              Pincode Validator Pro
            </span>

            <h1>
              Support and documentation
            </h1>

            <p>
              Learn how to install the storefront
              validator, manage delivery pincodes,
              configure validation rules and resolve
              common issues.
            </p>

            <div className="support-hero-actions">
              <a
                href="#getting-started"
                className="support-button support-button-primary"
              >
                Start setup
              </a>

              <a
                href="mailto:ppdesignandtech@gmail.com?subject=Pincode%20Validator%20Pro%20Support"
                className="support-button support-button-secondary"
              >
                Contact support
              </a>
            </div>
          </div>

          <div className="support-status-card">
            <span className="support-status-dot" />

            <div>
              <strong>
                Support available
              </strong>

              <p>
                Email assistance for installation,
                setup and technical issues.
              </p>
            </div>
          </div>
        </section>

        <div className="support-layout">
          <aside className="support-sidebar">
            <nav aria-label="Documentation sections">
              <span className="support-sidebar-title">
                On this page
              </span>

              <a href="#getting-started">
                Getting started
              </a>

              <a href="#theme-block">
                Theme block setup
              </a>

              <a href="#app-embed">
                App embed setup
              </a>

              <a href="#pincodes">
                Manage pincodes
              </a>

              <a href="#csv-import">
                CSV import
              </a>

              <a href="#csv-export">
                CSV export
              </a>

              <a href="#settings">
                Settings
              </a>

              <a href="#storefront">
                Storefront usage
              </a>

              <a href="#troubleshooting">
                Troubleshooting
              </a>

              <a href="#contact">
                Contact support
              </a>
            </nav>
          </aside>

          <article className="support-content">
            <section
              id="getting-started"
              className="support-section"
            >
              <span className="support-section-number">
                01
              </span>

              <h2>Getting started</h2>

              <p>
                After installing Pincode Validator Pro,
                complete the following setup steps
                before using it on your live
                storefront.
              </p>

              <ol className="support-steps">
                <li>
                  <strong>
                    Add delivery pincodes
                  </strong>

                  <span>
                    Add pincodes manually or upload a
                    CSV file from the app dashboard.
                  </span>
                </li>

                <li>
                  <strong>
                    Configure validation rules
                  </strong>

                  <span>
                    Choose whether Add to Cart and Buy
                    Now buttons should remain disabled
                    until a successful validation.
                  </span>
                </li>

                <li>
                  <strong>
                    Add the storefront block
                  </strong>

                  <span>
                    Open the Shopify theme editor and
                    add the Pincode Validator Pro app
                    block to your product template.
                  </span>
                </li>

                <li>
                  <strong>
                    Test the product page
                  </strong>

                  <span>
                    Check one available and one
                    unavailable pincode before
                    publishing the theme.
                  </span>
                </li>
              </ol>
            </section>

            <section
              id="theme-block"
              className="support-section"
            >
              <span className="support-section-number">
                02
              </span>

              <h2>Add the theme block</h2>

              <p>
                The theme block displays the pincode
                input directly on the product page.
              </p>

              <ol className="support-steps">
                <li>
                  <strong>
                    Open the Shopify theme editor
                  </strong>

                  <span>
                    Go to Online Store → Themes and
                    click Customize on the active or
                    development theme.
                  </span>
                </li>

                <li>
                  <strong>
                    Open a product template
                  </strong>

                  <span>
                    Select Products and open the
                    default product template or the
                    template used by your products.
                  </span>
                </li>

                <li>
                  <strong>
                    Add the app block
                  </strong>

                  <span>
                    Inside the product information
                    section, click Add block and choose
                    Pincode Validator.
                  </span>
                </li>

                <li>
                  <strong>
                    Position and save
                  </strong>

                  <span>
                    Move the block above the purchase
                    buttons or another preferred
                    position and click Save.
                  </span>
                </li>
              </ol>

              <div className="support-note">
                <strong>Recommended placement</strong>

                <p>
                  Place the validator close to the Add
                  to Cart button so customers can
                  verify serviceability before
                  purchasing.
                </p>
              </div>
            </section>

            <section
              id="app-embed"
              className="support-section"
            >
              <span className="support-section-number">
                03
              </span>

              <h2>Enable the app embed</h2>

              <p>
                The app embed supports global
                storefront behaviour such as purchase
                button restriction and dynamic theme
                compatibility.
              </p>

              <ol className="support-steps">
                <li>
                  <strong>
                    Open App embeds
                  </strong>

                  <span>
                    In the theme editor, click the App
                    embeds icon in the left sidebar.
                  </span>
                </li>

                <li>
                  <strong>
                    Enable Pincode Validator Pro
                  </strong>

                  <span>
                    Turn on the app embed toggle.
                  </span>
                </li>

                <li>
                  <strong>Save the theme</strong>

                  <span>
                    Click Save and refresh the
                    storefront product page.
                  </span>
                </li>
              </ol>

              <div className="support-note support-note-warning">
                <strong>
                  Block and embed are different
                </strong>

                <p>
                  The app block displays the visible
                  validator. The app embed supports
                  global storefront behaviour. Enable
                  both where your theme setup requires
                  them.
                </p>
              </div>
            </section>

            <section
              id="pincodes"
              className="support-section"
            >
              <span className="support-section-number">
                04
              </span>

              <h2>Manage pincodes manually</h2>

              <p>
                Open Manage Pincodes from the app
                navigation to create, edit, search,
                activate, deactivate or delete
                records.
              </p>

              <h3>Available fields</h3>

              <div className="support-table-wrap">
                <table className="support-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Purpose</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>Pincode</td>
                      <td>
                        A valid six-digit Indian
                        pincode that does not begin
                        with zero.
                      </td>
                    </tr>

                    <tr>
                      <td>City</td>
                      <td>
                        Optional city shown in the
                        storefront result.
                      </td>
                    </tr>

                    <tr>
                      <td>State</td>
                      <td>
                        Optional state shown in the
                        storefront result.
                      </td>
                    </tr>

                    <tr>
                      <td>Country</td>
                      <td>
                        Optional country. The default
                        country setting is used when
                        empty.
                      </td>
                    </tr>

                    <tr>
                      <td>COD available</td>
                      <td>
                        Indicates whether cash on
                        delivery is available.
                      </td>
                    </tr>

                    <tr>
                      <td>Prepaid available</td>
                      <td>
                        Determines whether delivery is
                        considered available for
                        prepaid orders.
                      </td>
                    </tr>

                    <tr>
                      <td>Delivery days</td>
                      <td>
                        Whole number from 0 to 365.
                      </td>
                    </tr>

                    <tr>
                      <td>Active</td>
                      <td>
                        Only active records are used
                        for storefront validation.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Bulk actions</h3>

              <p>
                Select one or more visible records to
                activate, deactivate or delete them.
                Bulk actions apply only to the
                selected records.
              </p>
            </section>

            <section
              id="csv-import"
              className="support-section"
            >
              <span className="support-section-number">
                05
              </span>

              <h2>Import pincodes using CSV</h2>

              <p>
                Use the Import CSV page when adding or
                updating a large number of pincodes.
              </p>

              <h3>Supported columns</h3>

              <pre className="support-code">
{`pincode,city,state,country,cod_available,prepaid_available,est_delivery_days,is_active`}
              </pre>

              <h3>Example</h3>

              <pre className="support-code">
{`110001,Delhi,Delhi,India,true,true,2,true
400001,Mumbai,Maharashtra,India,false,true,3,true`}
              </pre>

              <h3>Boolean values</h3>

              <p>
                The following values are accepted,
                regardless of letter case:
              </p>

              <div className="support-value-grid">
                <div>
                  <strong>True values</strong>
                  <span>
                    true, yes, y, 1
                  </span>
                </div>

                <div>
                  <strong>False values</strong>
                  <span>
                    false, no, n, 0
                  </span>
                </div>
              </div>

              <h3>Import modes</h3>

              <div className="support-value-grid">
                <div>
                  <strong>Append</strong>

                  <span>
                    Adds new records and updates
                    matching pincodes without deleting
                    other records.
                  </span>
                </div>

                <div>
                  <strong>Replace</strong>

                  <span>
                    Removes existing records and
                    replaces them with the valid rows
                    from the uploaded file.
                  </span>
                </div>
              </div>

              <div className="support-note support-note-danger">
                <strong>
                  Replace mode is destructive
                </strong>

                <p>
                  Existing records are removed only
                  when the uploaded file contains at
                  least one valid row and the
                  transaction completes successfully.
                </p>
              </div>

              <h3>Import limits</h3>

              <ul>
                <li>
                  Maximum file size: 5 MB
                </li>

                <li>
                  Maximum number of rows: 50,000
                </li>

                <li>
                  Duplicate pincodes in the same file
                  are rejected
                </li>

                <li>
                  Invalid rows are listed after the
                  import attempt
                </li>
              </ul>
            </section>

            <section
              id="csv-export"
              className="support-section"
            >
              <span className="support-section-number">
                06
              </span>

              <h2>Export pincode data</h2>

              <p>
                Select Export CSV from the app
                navigation to download all pincode
                records for the current Shopify store.
              </p>

              <p>
                The exported file contains:
              </p>

              <ul>
                <li>Pincode</li>
                <li>City</li>
                <li>State</li>
                <li>Country</li>
                <li>COD status</li>
                <li>Prepaid status</li>
                <li>Estimated delivery days</li>
                <li>Active status</li>
              </ul>

              <p>
                Exported files can be edited in Excel
                or Google Sheets and imported back
                into the app.
              </p>
            </section>

            <section
              id="settings"
              className="support-section"
            >
              <span className="support-section-number">
                07
              </span>

              <h2>Configure app settings</h2>

              <h3>Require pincode validation</h3>

              <p>
                When enabled, customers must
                successfully validate a pincode before
                restricted purchase buttons are
                enabled.
              </p>

              <h3>Restrict Add to Cart</h3>

              <p>
                Keeps supported Add to Cart buttons
                disabled until validation succeeds.
              </p>

              <h3>Restrict Buy Now</h3>

              <p>
                Keeps supported dynamic checkout or
                Buy Now buttons unavailable until
                validation succeeds.
              </p>

              <h3>Success and failure messages</h3>

              <p>
                These messages appear after
                storefront validation. Each message
                can contain up to 250 characters.
              </p>

              <h3>Default country</h3>

              <p>
                Used when a pincode record does not
                include its own country value.
              </p>

              <h3>Remember pincode</h3>

              <p>
                Controls how many days a successfully
                validated pincode is remembered in
                the customer’s browser. The allowed
                range is 1 to 365 days.
              </p>
            </section>

            <section
              id="storefront"
              className="support-section"
            >
              <span className="support-section-number">
                08
              </span>

              <h2>How storefront validation works</h2>

              <ol className="support-steps">
                <li>
                  <strong>
                    Customer enters a pincode
                  </strong>

                  <span>
                    The field accepts six numeric
                    digits.
                  </span>
                </li>

                <li>
                  <strong>
                    The app validates securely
                  </strong>

                  <span>
                    The request is sent through the
                    authenticated Shopify app proxy.
                  </span>
                </li>

                <li>
                  <strong>
                    The result is displayed
                  </strong>

                  <span>
                    Available results may show
                    location, delivery days, COD and
                    prepaid status.
                  </span>
                </li>

                <li>
                  <strong>
                    Purchase controls update
                  </strong>

                  <span>
                    Configured purchase buttons are
                    enabled after successful
                    validation.
                  </span>
                </li>
              </ol>

              <p>
                When multiple validator blocks are
                present, they share one validation
                state and remain synchronised.
              </p>
            </section>

            <section
              id="troubleshooting"
              className="support-section"
            >
              <span className="support-section-number">
                09
              </span>

              <h2>Troubleshooting</h2>

              <div className="support-faq">
                <details>
                  <summary>
                    The validator does not appear on
                    the product page
                  </summary>

                  <div>
                    Confirm that the app block has
                    been added to the correct product
                    template and that the theme
                    changes were saved.
                  </div>
                </details>

                <details>
                  <summary>
                    Purchase buttons are not being
                    restricted
                  </summary>

                  <div>
                    Confirm that validation is
                    required, the relevant restriction
                    settings are enabled, and the app
                    embed is active in the theme
                    editor.
                  </div>
                </details>

                <details>
                  <summary>
                    A valid pincode shows unavailable
                  </summary>

                  <div>
                    Check that the pincode exists, is
                    active and has prepaid delivery
                    enabled. Inactive or prepaid-disabled
                    records are treated as
                    unavailable.
                  </div>
                </details>

                <details>
                  <summary>
                    CSV import fails
                  </summary>

                  <div>
                    Confirm that the file is a CSV,
                    uses the supported headings, stays
                    within the file and row limits,
                    contains valid six-digit pincodes
                    and has no duplicate pincodes.
                  </div>
                </details>

                <details>
                  <summary>
                    Some CSV rows are rejected
                  </summary>

                  <div>
                    Review the invalid-row table shown
                    after import. Common issues include
                    invalid booleans, duplicate
                    pincodes, decimal delivery days or
                    pincodes beginning with zero.
                  </div>
                </details>

                <details>
                  <summary>
                    The theme changed after an update
                  </summary>

                  <div>
                    Recheck the app block and app embed
                    in the theme editor. If the theme
                    uses custom purchase buttons,
                    contact support with the theme
                    name and product URL.
                  </div>
                </details>

                <details>
                  <summary>
                    The remembered pincode is outdated
                  </summary>

                  <div>
                    Enter a different pincode in the
                    validator. The old result is
                    cleared and the new value is
                    validated. Browser storage can
                    also be cleared manually.
                  </div>
                </details>
              </div>
            </section>

            <section
              id="contact"
              className="support-section"
            >
              <span className="support-section-number">
                10
              </span>

              <h2>Contact support</h2>

              <p>
                For installation, theme compatibility,
                import or technical issues, contact:
              </p>

              <div className="support-contact-card">
                <div>
                  <span>Company</span>

                  <strong>
                    PP DESIGN AND TECH
                  </strong>
                </div>

                <div>
                  <span>Email</span>

                  <a href="mailto:ppdesignandtech@gmail.com">
                    ppdesignandtech@gmail.com
                  </a>
                </div>

                <div>
                  <span>Website</span>

                  <a
                    href="https://ppdesigntech.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ppdesigntech.com
                  </a>
                </div>
              </div>

              <h3>
                Include this information in your
                request
              </h3>

              <ul>
                <li>Shopify store domain</li>
                <li>Theme name</li>
                <li>Product page URL</li>
                <li>
                  Steps required to reproduce the
                  issue
                </li>
                <li>
                  Screenshot or screen recording,
                  where helpful
                </li>
                <li>
                  Relevant browser console error,
                  without passwords or private
                  credentials
                </li>
              </ul>

              <div className="support-note">
                <strong>
                  Expected response time
                </strong>

                <p>
                  Support requests are generally
                  reviewed within one to two business
                  days. Complex theme compatibility
                  issues may require additional
                  investigation.
                </p>
              </div>
            </section>
          </article>
        </div>

        <footer className="support-footer">
          <span>
            © {new Date().getFullYear()} PP DESIGN
            AND TECH
          </span>

          <nav
            className="support-footer-nav"
            aria-label="Legal pages"
          >
            <a href="/support">
              Support
            </a>

            <a href="/privacy">
              Privacy Policy
            </a>

            <a href="/terms">
              Terms of Service
            </a>
          </nav>
        </footer>
      </div>

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

          .support-page {
            min-height: 100vh;
            padding: 28px 20px 48px;
            background:
              radial-gradient(
                circle at top right,
                rgba(0, 91, 211, 0.09),
                transparent 31%
              ),
              #f4f6f8;
          }

          .support-shell {
            width: 100%;
            max-width: 1180px;
            margin: 0 auto;
          }

          .support-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 20px;
          }

          .support-brand {
            color: #111827;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.03em;
            text-decoration: none;
          }

          .support-top-nav,
          .support-footer-nav {
            display: flex;
            align-items: center;
            gap: 18px;
            flex-wrap: wrap;
          }

          .support-top-nav a,
          .support-footer-nav a {
            color: #4a4f55;
            font-size: 13px;
            font-weight: 650;
            text-decoration: none;
          }

          .support-top-nav a:hover,
          .support-footer-nav a:hover {
            color: #005bd3;
            text-decoration: underline;
          }

          .support-hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 36px;
            padding: 46px;
            border-radius: 20px;
            background:
              linear-gradient(
                135deg,
                #111827 0%,
                #1f2937 62%,
                #0f766e 145%
              );
            color: #ffffff;
            box-shadow:
              0 16px 40px
              rgba(17, 24, 39, 0.17);
          }

          .support-hero-content {
            max-width: 720px;
          }

          .support-eyebrow {
            display: inline-flex;
            padding: 6px 10px;
            border: 1px solid
              rgba(255, 255, 255, 0.2);
            border-radius: 999px;
            background:
              rgba(255, 255, 255, 0.08);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.07em;
            text-transform: uppercase;
          }

          .support-hero h1 {
            margin: 18px 0 12px;
            font-size: clamp(
              34px,
              5vw,
              54px
            );
            line-height: 1.04;
            letter-spacing: -0.04em;
          }

          .support-hero p {
            margin: 0;
            color:
              rgba(255, 255, 255, 0.76);
            font-size: 16px;
            line-height: 1.7;
          }

          .support-hero-actions {
            display: flex;
            gap: 11px;
            flex-wrap: wrap;
            margin-top: 25px;
          }

          .support-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 42px;
            padding: 10px 16px;
            border-radius: 9px;
            font-size: 13px;
            font-weight: 750;
            text-decoration: none;
          }

          .support-button-primary {
            border: 1px solid #ffffff;
            background: #ffffff;
            color: #111827;
          }

          .support-button-secondary {
            border: 1px solid
              rgba(255, 255, 255, 0.26);
            background:
              rgba(255, 255, 255, 0.08);
            color: #ffffff;
          }

          .support-status-card {
            display: flex;
            align-items: flex-start;
            gap: 11px;
            width: 260px;
            flex-shrink: 0;
            padding: 18px;
            border: 1px solid
              rgba(255, 255, 255, 0.18);
            border-radius: 14px;
            background:
              rgba(255, 255, 255, 0.08);
          }

          .support-status-dot {
            width: 9px;
            height: 9px;
            margin-top: 5px;
            flex-shrink: 0;
            border-radius: 50%;
            background: #4ade80;
            box-shadow:
              0 0 0 4px
              rgba(74, 222, 128, 0.14);
          }

          .support-status-card strong {
            display: block;
            font-size: 14px;
          }

          .support-status-card p {
            margin-top: 5px;
            font-size: 12px;
            line-height: 1.55;
          }

          .support-layout {
            display: grid;
            grid-template-columns: 230px minmax(0, 1fr);
            gap: 26px;
            margin-top: 26px;
          }

          .support-sidebar {
            position: relative;
          }

          .support-sidebar nav {
            position: sticky;
            top: 20px;
            display: grid;
            gap: 4px;
            padding: 17px;
            border: 1px solid #dfe3e8;
            border-radius: 14px;
            background: #ffffff;
            box-shadow:
              0 6px 20px
              rgba(20, 25, 30, 0.05);
          }

          .support-sidebar-title {
            margin-bottom: 7px;
            color: #8c9196;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .support-sidebar a {
            padding: 8px 9px;
            border-radius: 7px;
            color: #4a4f55;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
          }

          .support-sidebar a:hover {
            background: #f2f7ff;
            color: #005bd3;
          }

          .support-content {
            min-width: 0;
          }

          .support-section {
            scroll-margin-top: 20px;
            padding: 34px 38px;
            border: 1px solid #dfe3e8;
            border-radius: 16px;
            background: #ffffff;
            box-shadow:
              0 7px 24px
              rgba(20, 25, 30, 0.05);
          }

          .support-section +
          .support-section {
            margin-top: 20px;
          }

          .support-section-number {
            display: inline-flex;
            margin-bottom: 11px;
            color: #005bd3;
            font-size: 11px;
            font-weight: 850;
            letter-spacing: 0.08em;
          }

          .support-section h2 {
            margin: 0 0 12px;
            color: #111827;
            font-size: 25px;
            line-height: 1.25;
          }

          .support-section h3 {
            margin: 27px 0 9px;
            color: #202223;
            font-size: 16px;
          }

          .support-section p,
          .support-section li,
          .support-section td,
          .support-section th {
            color: #4a4f55;
            font-size: 14px;
            line-height: 1.7;
          }

          .support-section p {
            margin: 11px 0;
          }

          .support-section ul {
            display: grid;
            gap: 7px;
            padding-left: 21px;
          }

          .support-section li::marker {
            color: #005bd3;
          }

          .support-steps {
            display: grid;
            gap: 12px;
            margin: 18px 0 0;
            padding: 0;
            list-style: none;
          }

          .support-steps li {
            position: relative;
            padding: 15px 16px 15px 45px;
            border: 1px solid #e3e5e7;
            border-radius: 11px;
            background: #fafbfb;
          }

          .support-steps li::before {
            position: absolute;
            top: 15px;
            left: 15px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 21px;
            height: 21px;
            border-radius: 50%;
            background: #e7f0ff;
            color: #005bd3;
            font-size: 11px;
            font-weight: 800;
            content:
              counter(list-item);
          }

          .support-steps strong,
          .support-steps span {
            display: block;
          }

          .support-steps strong {
            color: #202223;
            font-size: 14px;
          }

          .support-steps span {
            margin-top: 4px;
            color: #6d7175;
            font-size: 13px;
            line-height: 1.55;
          }

          .support-note {
            margin-top: 20px;
            padding: 15px 16px;
            border-left: 4px solid #005bd3;
            border-radius: 8px;
            background: #f2f7ff;
          }

          .support-note-warning {
            border-left-color: #b7791f;
            background: #fff8e6;
          }

          .support-note-danger {
            border-left-color: #c53228;
            background: #fff1f0;
          }

          .support-note strong {
            color: #202223;
            font-size: 13px;
          }

          .support-note p {
            margin: 5px 0 0;
            font-size: 13px;
          }

          .support-table-wrap {
            width: 100%;
            overflow-x: auto;
            margin-top: 15px;
          }

          .support-table {
            width: 100%;
            min-width: 620px;
            border-collapse: collapse;
            border: 1px solid #e3e5e7;
            border-radius: 10px;
          }

          .support-table th {
            padding: 11px 13px;
            border-bottom: 1px solid #e3e5e7;
            background: #f6f6f7;
            color: #303030;
            font-size: 12px;
            text-align: left;
            text-transform: uppercase;
          }

          .support-table td {
            padding: 12px 13px;
            border-bottom: 1px solid #ededed;
            vertical-align: top;
          }

          .support-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .support-table td:first-child {
            color: #202223;
            font-weight: 700;
            white-space: nowrap;
          }

          .support-code {
            overflow-x: auto;
            margin: 13px 0;
            padding: 15px;
            border: 1px solid #dfe3e8;
            border-radius: 9px;
            background: #111827;
            color: #e5e7eb;
            font-family:
              "SFMono-Regular",
              Consolas,
              "Liberation Mono",
              monospace;
            font-size: 12px;
            line-height: 1.65;
            white-space: pre;
          }

          .support-value-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 13px;
          }

          .support-value-grid > div {
            padding: 14px;
            border: 1px solid #e3e5e7;
            border-radius: 10px;
            background: #fafbfb;
          }

          .support-value-grid strong,
          .support-value-grid span {
            display: block;
          }

          .support-value-grid strong {
            color: #202223;
            font-size: 13px;
          }

          .support-value-grid span {
            margin-top: 5px;
            color: #6d7175;
            font-size: 12px;
            line-height: 1.55;
          }

          .support-faq {
            display: grid;
            gap: 9px;
            margin-top: 18px;
          }

          .support-faq details {
            border: 1px solid #e3e5e7;
            border-radius: 10px;
            background: #ffffff;
          }

          .support-faq summary {
            padding: 14px 16px;
            color: #202223;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }

          .support-faq details div {
            padding: 0 16px 15px;
            color: #6d7175;
            font-size: 13px;
            line-height: 1.65;
          }

          .support-contact-card {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 17px;
          }

          .support-contact-card > div {
            padding: 15px;
            border: 1px solid #e3e5e7;
            border-radius: 10px;
            background: #fafbfb;
          }

          .support-contact-card span,
          .support-contact-card strong,
          .support-contact-card a {
            display: block;
          }

          .support-contact-card span {
            color: #8c9196;
            font-size: 11px;
            font-weight: 750;
            text-transform: uppercase;
          }

          .support-contact-card strong,
          .support-contact-card a {
            margin-top: 5px;
            color: #202223;
            font-size: 13px;
            font-weight: 700;
            overflow-wrap: anywhere;
          }

          .support-contact-card a {
            color: #005bd3;
          }

          .support-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            padding: 22px 4px 0;
            color: #6d7175;
            font-size: 12px;
          }

          a:focus-visible,
          summary:focus-visible {
            outline: 3px solid
              rgba(0, 91, 211, 0.3);
            outline-offset: 3px;
            border-radius: 4px;
          }

          @media (max-width: 900px) {
            .support-hero {
              align-items: flex-start;
              flex-direction: column;
            }

            .support-status-card {
              width: 100%;
            }

            .support-layout {
              grid-template-columns: 1fr;
            }

            .support-sidebar {
              display: none;
            }
          }

          @media (max-width: 700px) {
            .support-page {
              padding: 17px 12px 34px;
            }

            .support-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .support-top-nav {
              gap: 11px;
            }

            .support-hero {
              padding: 31px 22px;
            }

            .support-hero h1 {
              font-size: 36px;
            }

            .support-section {
              padding: 28px 21px;
            }

            .support-value-grid,
            .support-contact-card {
              grid-template-columns: 1fr;
            }

            .support-footer {
              align-items: flex-start;
              flex-direction: column;
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