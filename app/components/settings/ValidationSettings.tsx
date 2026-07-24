import {
  Badge,
  BlockStack,
  Box,
  Card,
  Checkbox,
  InlineStack,
  Link,
  Text,
} from "@shopify/polaris";

import type {
  SettingsSectionProps,
} from "../../types/settings";

export function ValidationSettings({
  values,
  setters,
  isPro = false,
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
              !isPro
                ? "settings-option-card settings-option-card-disabled"
                : restrictAddToCart
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <BlockStack gap="200">

              <InlineStack
                align="space-between"
                blockAlign="center"
              >
                <Badge tone="attention">
                  Pro
                </Badge>

                {!isPro && (
                  <Link url="/app/billing">
                    Upgrade
                  </Link>
                )}
              </InlineStack>

              <Checkbox
                label="Restrict Add to Cart"
                name="restrictAddToCart"
                checked={
                  isPro
                    ? restrictAddToCart
                    : false
                }
                disabled={!isPro}
                onChange={setRestrictAddToCart}
                helpText="Disable visible Add to Cart buttons until validation succeeds."
              />

            </BlockStack>
          </div>

          <div
            className={
              !isPro
                ? "settings-option-card settings-option-card-disabled"
                : restrictBuyNow
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <BlockStack gap="200">

              <InlineStack
                align="space-between"
                blockAlign="center"
              >
                <Badge tone="attention">
                  Pro
                </Badge>

                {!isPro && (
                  <Link url="/app/billing">
                    Upgrade
                  </Link>
                )}
              </InlineStack>

              <Checkbox
                label="Restrict Buy Now"
                name="restrictBuyNow"
                checked={
                  isPro
                    ? restrictBuyNow
                    : false
                }
                disabled={!isPro}
                onChange={setRestrictBuyNow}
                helpText="Disable supported dynamic checkout buttons until validation succeeds."
              />

            </BlockStack>
          </div>

        </div>
      </BlockStack>
    </Card>
  );
}