import {
  BlockStack,
  Box,
  Card,
  Text,
} from "@shopify/polaris";

import type {
  SettingsSummaryProps,
} from "../../types/settings";

export function SettingsSummary({
  requireValidation,
  restrictAddToCart,
  restrictBuyNow,
  popupEnabled,
  locationDetectionEnabled,
  rememberPincodeDays,
}: SettingsSummaryProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <div>
          <Text
            as="h2"
            variant="headingMd"
          >
            Current behaviour
          </Text>

          <Box paddingBlockStart="150">
            <Text
              as="p"
              tone="subdued"
            >
              A live summary of the currently selected settings.
            </Text>
          </Box>
        </div>

        <div className="settings-summary-list">
          <div className="settings-summary-row">
            <span>
              Validation
            </span>

            <strong>
              {requireValidation
                ? "Required"
                : "Optional"}
            </strong>
          </div>

          <div className="settings-summary-row">
            <span>
              Add to Cart
            </span>

            <strong>
              {restrictAddToCart
                ? "Restricted"
                : "Allowed"}
            </strong>
          </div>

          <div className="settings-summary-row">
            <span>
              Buy Now
            </span>

            <strong>
              {restrictBuyNow
                ? "Restricted"
                : "Allowed"}
            </strong>
          </div>

          <div className="settings-summary-row">
            <span>
              Popup
            </span>

            <strong>
              {popupEnabled
                ? "Enabled"
                : "Disabled"}
            </strong>
          </div>

          <div className="settings-summary-row">
            <span>
              Location detection
            </span>

            <strong>
              {locationDetectionEnabled
                ? "Enabled"
                : "Disabled"}
            </strong>
          </div>

          <div className="settings-summary-row">
            <span>
              Remembered for
            </span>

            <strong>
              {rememberPincodeDays || "0"} days
            </strong>
          </div>
        </div>
      </BlockStack>
    </Card>
  );
}