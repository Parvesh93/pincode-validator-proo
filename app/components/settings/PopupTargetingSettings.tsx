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

export function PopupTargetingSettings({
  values,
  setters,
}: SettingsSectionProps) {
  const {
    popupShowHome,
    popupShowProduct,
    popupShowCollection,
    popupShowCart,
    popupShowPages,
  } = values;

  const {
    setPopupShowHome,
    setPopupShowProduct,
    setPopupShowCollection,
    setPopupShowCart,
    setPopupShowPages,
  } = setters;

  return (
    <Card>
      <BlockStack gap="500">
        <div>
          <Text
            as="h2"
            variant="headingLg"
          >
            Popup page targeting
          </Text>

          <Box paddingBlockStart="150">
            <Text
              as="p"
              tone="subdued"
            >
              Choose the storefront page types where
              the pincode popup is allowed to appear.
            </Text>
          </Box>
        </div>

        <div className="settings-option-grid">
          <div
            className={
              popupShowHome
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Home page"
              name="popupShowHome"
              checked={popupShowHome}
              onChange={setPopupShowHome}
              helpText="Allow the popup to appear on the storefront home page."
            />
          </div>

          <div
            className={
              popupShowProduct
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Product pages"
              name="popupShowProduct"
              checked={popupShowProduct}
              onChange={setPopupShowProduct}
              helpText="Allow the popup to appear on product detail pages."
            />
          </div>

          <div
            className={
              popupShowCollection
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Collection pages"
              name="popupShowCollection"
              checked={popupShowCollection}
              onChange={setPopupShowCollection}
              helpText="Allow the popup to appear on collection pages."
            />
          </div>

          <div
            className={
              popupShowCart
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Cart page"
              name="popupShowCart"
              checked={popupShowCart}
              onChange={setPopupShowCart}
              helpText="Allow the popup to appear on the cart page."
            />
          </div>

          <div
            className={
              popupShowPages
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Other pages"
              name="popupShowPages"
              checked={popupShowPages}
              onChange={setPopupShowPages}
              helpText="Allow the popup to appear on standard Shopify pages."
            />
          </div>
        </div>

        {!popupShowHome &&
        !popupShowProduct &&
        !popupShowCollection &&
        !popupShowCart &&
        !popupShowPages ? (
          <div className="settings-inline-warning">
            <strong>
              No storefront pages selected
            </strong>

            <p>
              The popup will remain enabled in settings,
              but it will not appear anywhere until at
              least one page type is selected.
            </p>
          </div>
        ) : null}
      </BlockStack>
    </Card>
  );
}