import {
  BlockStack,
  Box,
  Card,
  InlineGrid,
  Text,
  TextField,
} from "@shopify/polaris";

import type {
  SettingsSectionProps,
} from "../../types/settings";

export function DefaultsSettings({
  values,
  setters,
}: SettingsSectionProps) {
  const {
    defaultCountry,
    rememberPincodeDays,
  } = values;

  const {
    setDefaultCountry,
    setRememberPincodeDays,
  } = setters;

  return (
    <Card>
      <BlockStack gap="500">
        <div>
          <Text
            as="h2"
            variant="headingLg"
          >
            Defaults and memory
          </Text>

          <Box paddingBlockStart="150">
            <Text
              as="p"
              tone="subdued"
            >
              Define the default market and how long a
              successful inline validation should remain
              remembered.
            </Text>
          </Box>
        </div>

        <InlineGrid
          columns={{
            xs: 1,
            md: 2,
          }}
          gap="400"
        >
          <TextField
            label="Default country"
            name="defaultCountry"
            value={defaultCountry}
            onChange={setDefaultCountry}
            autoComplete="country-name"
            helpText="Used when a pincode record does not specify a country."
          />

          <TextField
            label="Remember pincode for"
            name="rememberPincodeDays"
            type="number"
            min={1}
            max={365}
            step={1}
            value={rememberPincodeDays}
            onChange={setRememberPincodeDays}
            autoComplete="off"
            suffix="days"
            helpText="Choose a whole number between 1 and 365."
          />
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}