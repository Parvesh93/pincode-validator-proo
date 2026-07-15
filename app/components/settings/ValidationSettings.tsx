import {
  BlockStack,
  Box,
  Card,
  Checkbox,
  Text,
} from "@shopify/polaris";

import type {
  SettingsSectionProps,
} from "../../types/settings";

export function ValidationSettings({
  values,
  setters,
}: SettingsSectionProps) {
  const {
    requireValidation,
    restrictAddToCart,
    restrictBuyNow,
  } = values;

  const {
    setRequireValidation,
    setRestrictAddToCart,
    setRestrictBuyNow,
  } = setters;

  return (
    <Card>
      <BlockStack gap="500">
        <div>
          <Text
            as="h2"
            variant="headingLg"
          >
            Validation rules
          </Text>

          <Box paddingBlockStart="150">
            <Text
              as="p"
              tone="subdued"
            >
              Choose whether customers must validate
              their pincode and which purchase buttons
              should remain restricted until validation
              succeeds.
            </Text>
          </Box>
        </div>

        <div className="settings-option-grid">
          <div
            className={
              requireValidation
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Require pincode validation"
              name="requireValidation"
              checked={requireValidation}
              onChange={setRequireValidation}
              helpText="Customers must check delivery availability before continuing."
            />
          </div>

          <div
            className={
              restrictAddToCart
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Restrict Add to Cart"
              name="restrictAddToCart"
              checked={restrictAddToCart}
              onChange={setRestrictAddToCart}
              helpText="Disable visible Add to Cart buttons until validation succeeds."
            />
          </div>

          <div
            className={
              restrictBuyNow
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Restrict Buy Now"
              name="restrictBuyNow"
              checked={restrictBuyNow}
              onChange={setRestrictBuyNow}
              helpText="Disable supported dynamic checkout buttons until validation succeeds."
            />
          </div>
        </div>
      </BlockStack>
    </Card>
  );
}