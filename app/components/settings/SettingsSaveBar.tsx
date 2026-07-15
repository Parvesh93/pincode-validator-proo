import {
  Button,
  InlineStack,
} from "@shopify/polaris";

import type {
  SettingsSaveBarProps,
} from "../../types/settings";

export function SettingsSaveBar({
  isSubmitting,
}: SettingsSaveBarProps) {
  return (
    <div className="settings-save-bar">
      <div>
        <strong>
          Save storefront settings
        </strong>

        <span>
          Changes will apply to future storefront
          validation requests.
        </span>
      </div>

      <InlineStack gap="300">
        <Button
          url="/app"
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          submit
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Save settings
        </Button>
      </InlineStack>
    </div>
  );
}