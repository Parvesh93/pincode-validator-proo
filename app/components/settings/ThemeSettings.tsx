import {
  Banner,
  BlockStack,
  Box,
  Card,
  Checkbox,
  Text,
} from "@shopify/polaris";

import type {
  SettingsSectionProps,
} from "../../types/settings";

export function ThemeSettings({
  values,
  setters,
}: SettingsSectionProps) {
  const {
    enableEmbed,
    enableBlock,
  } = values;

  const {
    setEnableEmbed,
    setEnableBlock,
  } = setters;

  return (
    <Card>
      <BlockStack gap="500">
        <div>
          <Text
            as="h2"
            variant="headingLg"
          >
            Theme integration
          </Text>

          <Box paddingBlockStart="150">
            <Text
              as="p"
              tone="subdued"
            >
              Control which storefront integration
              methods are available for this store.
            </Text>
          </Box>
        </div>

        <div className="settings-option-grid settings-option-grid-two">
          <div
            className={
              enableEmbed
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              id="enable-embed-checkbox"
              label="Enable app embed"
              name="enableEmbed"
              checked={enableEmbed}
              onChange={setEnableEmbed}
              helpText="Allow global storefront behaviour through the theme app embed."
            />
          </div>

          <div
            className={
              enableBlock
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              id="enable-block-checkbox"
              label="Enable theme block"
              name="enableBlock"
              checked={enableBlock}
              onChange={setEnableBlock}
              helpText="Allow merchants to place the inline validator on product templates."
            />
          </div>
        </div>

        <Banner
          tone="info"
          title="Theme editor setup"
        >
          <p>
            The app block and app embed must still be
            enabled from Online Store → Themes →
            Customize before they can appear on the
            storefront.
          </p>
        </Banner>
      </BlockStack>
    </Card>
  );
}