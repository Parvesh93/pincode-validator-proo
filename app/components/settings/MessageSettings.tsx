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

export function MessageSettings({
  values,
  setters,
}: SettingsSectionProps) {
  const {
    successMessage,
    failureMessage,
  } = values;

  const {
    setSuccessMessage,
    setFailureMessage,
  } = setters;

  return (
    <Card>
      <BlockStack gap="500">
        <div>
          <Text
            as="h2"
            variant="headingLg"
          >
            Customer messages
          </Text>

          <Box paddingBlockStart="150">
            <Text
              as="p"
              tone="subdued"
            >
              Customize the messages shown after a
              customer checks delivery availability.
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
            label="Success message"
            name="successMessage"
            value={successMessage}
            onChange={setSuccessMessage}
            autoComplete="off"
            multiline={3}
            maxLength={250}
            showCharacterCount
            helpText="Shown when delivery is available."
          />

          <TextField
            label="Failure message"
            name="failureMessage"
            value={failureMessage}
            onChange={setFailureMessage}
            autoComplete="off"
            multiline={3}
            maxLength={250}
            showCharacterCount
            helpText="Shown when delivery is unavailable."
          />
        </InlineGrid>

        <div className="message-preview-grid">
          <div className="message-preview message-preview-success">
            <span>
              Success preview
            </span>

            <p>
              {successMessage ||
                "Your success message will appear here."}
            </p>
          </div>

          <div className="message-preview message-preview-error">
            <span>
              Failure preview
            </span>

            <p>
              {failureMessage ||
                "Your failure message will appear here."}
            </p>
          </div>
        </div>
      </BlockStack>
    </Card>
  );
}