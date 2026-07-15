import {
  Banner,
  BlockStack,
  Box,
  Card,
  Checkbox,
  InlineStack,
  Text,
} from "@shopify/polaris";

import type {
  SettingsSectionProps,
} from "../../types/settings";

export function LocationSettings({
  values,
  setters,
}: SettingsSectionProps) {
  const {
    locationDetectionEnabled,
    popupEnabled,
    popupLocationText,
  } = values;

  const {
    setLocationDetectionEnabled,
  } = setters;

  return (
    <Card>
      <BlockStack gap="500">
        <InlineStack
          align="space-between"
          blockAlign="center"
          gap="300"
        >
          <div>
            <Text
              as="h2"
              variant="headingLg"
            >
              Location detection
            </Text>

            <Box paddingBlockStart="150">
              <Text
                as="p"
                tone="subdued"
              >
                Let customers detect their current
                location and automatically resolve
                their pincode.
              </Text>
            </Box>
          </div>

          <span className="settings-pro-badge">
            Pro feature
          </span>
        </InlineStack>

        <div
          className={
            locationDetectionEnabled
              ? "settings-option-card settings-option-card-active"
              : "settings-option-card"
          }
        >
          <Checkbox
            label="Enable automatic location detection"
            name="locationDetectionEnabled"
            checked={locationDetectionEnabled}
            onChange={setLocationDetectionEnabled}
            helpText="Customers will be asked for browser location permission before their pincode can be detected."
          />
        </div>

        <div className="settings-feature-summary">
          <div className="settings-feature-summary-row">
            <span>
              Popup status
            </span>

            <strong>
              {popupEnabled
                ? "Enabled"
                : "Disabled"}
            </strong>
          </div>

          <div className="settings-feature-summary-row">
            <span>
              Location button label
            </span>

            <strong>
              {popupLocationText ||
                "Use my current location"}
            </strong>
          </div>

          <div className="settings-feature-summary-row">
            <span>
              Browser permission
            </span>

            <strong>
              Required
            </strong>
          </div>

          <div className="settings-feature-summary-row">
            <span>
              Secure storefront
            </span>

            <strong>
              HTTPS required
            </strong>
          </div>
        </div>

        {locationDetectionEnabled &&
        !popupEnabled ? (
          <Banner
            tone="warning"
            title="Popup is currently disabled"
          >
            <p>
              Location detection is enabled, but the
              pincode popup is disabled. The location
              button will not appear in the popup until
              the popup is enabled.
            </p>
          </Banner>
        ) : null}

        <Banner
          tone="info"
          title="Reverse geocoding is required"
        >
          <p>
            Browser geolocation returns latitude,
            longitude and accuracy. The storefront will
            send those coordinates to a secure app-proxy
            endpoint, where a reverse-geocoding provider
            will resolve the postal code. Provider keys
            must never be exposed in theme JavaScript.
          </p>
        </Banner>
      </BlockStack>
    </Card>
  );
}