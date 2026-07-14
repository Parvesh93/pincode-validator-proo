import {
  Page,
  Card,
  BlockStack,
  Text,
  Link,
} from "@shopify/polaris";

export default function PrivacyPolicy() {
  return (
    <Page title="Privacy Policy">
      <Card>
        <BlockStack gap="500">

          <Text as="h1" variant="headingLg">
            Privacy Policy
          </Text>

          <Text as="p" variant="bodyMd">
            Last updated: July 2026
          </Text>

          <Text as="p" variant="bodyMd">
            This Privacy Policy explains how PP DESIGN AND TECH
            (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) collects, uses, stores and protects
            information when merchants use the Pincode Validator Pro
            Shopify application.
          </Text>

          <Text as="h2" variant="headingMd">
            Information We Collect
          </Text>

          <Text as="p">
            The application stores only the information necessary to
            provide delivery validation functionality.
          </Text>

          <ul>
            <li>Merchant shop domain</li>
            <li>Shopify shop identifier</li>
            <li>Pincode records uploaded by the merchant</li>
            <li>Application settings configured by the merchant</li>
            <li>Validation logs used for troubleshooting</li>
          </ul>

          <Text as="h2" variant="headingMd">
            Information We Do Not Collect
          </Text>

          <ul>
            <li>Customer payment information</li>
            <li>Credit card information</li>
            <li>Customer passwords</li>
            <li>Customer addresses</li>
            <li>Customer order history</li>
          </ul>

          <Text as="h2" variant="headingMd">
            Shopify Customer Data
          </Text>

          <Text as="p">
            The application does not permanently store Shopify customer
            personal information. Mandatory GDPR webhooks are implemented
            and customer data requests or redaction requests are handled
            according to Shopify requirements.
          </Text>

          <Text as="h2" variant="headingMd">
            How We Use Information
          </Text>

          <ul>
            <li>Validate delivery pincodes</li>
            <li>Display delivery availability</li>
            <li>Store merchant settings</li>
            <li>Provide technical support</li>
            <li>Improve application reliability</li>
          </ul>

          <Text as="h2" variant="headingMd">
            Data Storage
          </Text>

          <Text as="p">
            Application data is stored securely using PostgreSQL.
            The application infrastructure is hosted on Railway using
            encrypted HTTPS connections.
          </Text>

          <Text as="h2" variant="headingMd">
            Data Security
          </Text>

          <Text as="p">
            We implement industry-standard security measures including:
          </Text>

          <ul>
            <li>HTTPS encryption</li>
            <li>Secure Shopify OAuth authentication</li>
            <li>App Proxy authentication</li>
            <li>Webhook signature verification</li>
            <li>Access control by shop</li>
            <li>Transactional database operations</li>
          </ul>

          <Text as="h2" variant="headingMd">
            Data Retention
          </Text>

          <Text as="p">
            Merchant data is retained only while the application is
            installed.
          </Text>

          <Text as="p">
            Upon app uninstallation, all merchant data including
            settings, pincodes and validation logs are permanently
            removed from our database.
          </Text>

          <Text as="h2" variant="headingMd">
            Third-Party Services
          </Text>

          <Text as="p">
            The application uses:
          </Text>

          <ul>
            <li>Shopify APIs</li>
            <li>Railway cloud hosting</li>
            <li>PostgreSQL database</li>
          </ul>

          <Text as="h2" variant="headingMd">
            Your Rights
          </Text>

          <Text as="p">
            Merchants may request deletion of their application data at
            any time by uninstalling the application or contacting us.
          </Text>

          <Text as="h2" variant="headingMd">
            Contact
          </Text>

          <Text as="p">
            PP DESIGN AND TECH
          </Text>

          <Text as="p">
            Email: support@ppdesigntech.com
          </Text>

          <Text as="p">
            Website:&nbsp;
            <Link url="https://ppdesigntech.com" removeUnderline>
              https://ppdesigntech.com
            </Link>
          </Text>

        </BlockStack>
      </Card>
    </Page>
  );
}