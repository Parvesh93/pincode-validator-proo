import {
  BlockStack,
  Box,
  Card,
  Checkbox,
  InlineGrid,
  InlineStack,
  Text,
  TextField,
} from "@shopify/polaris";

import type {
  SettingsSectionProps,
} from "../../types/settings";

const DEFAULT_POPUP_TITLE =
  "Check Delivery Availability";

const DEFAULT_POPUP_DESCRIPTION =
  "Enter your pincode to check delivery availability.";

const DEFAULT_POPUP_BUTTON_TEXT =
  "Check Availability";

// const DEFAULT_LOCATION_BUTTON_TEXT =
//   "Use my current location";

export function PopupSettings({
  values,
  setters,
}: SettingsSectionProps) {
  const {
    popupEnabled,
    popupTitle,
    popupDescription,
    popupButtonText,
    // popupLocationText,
    popupTheme,
    popupWidth,
    popupShowClose,
    // locationDetectionEnabled,
  } = values;

  const {
    setPopupEnabled,
    setPopupTitle,
    setPopupDescription,
    setPopupButtonText,
    // setPopupLocationText,
  } = setters;

  const parsedPopupWidth =
    Number(popupWidth);

  const previewWidth =
    Number.isFinite(
      parsedPopupWidth,
    )
      ? Math.min(
          Math.max(
            parsedPopupWidth,
            320,
          ),
          700,
        )
      : 420;

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
              Pincode popup
            </Text>

            <Box paddingBlockStart="150">
              <Text
                as="p"
                tone="subdued"
              >
                Display a delivery
                validation popup across
                selected storefront
                pages.
              </Text>
            </Box>
          </div>

          <span className="settings-pro-badge">
            Pro feature
          </span>
        </InlineStack>

        <div
          className={
            popupEnabled
              ? "settings-option-card settings-option-card-active"
              : "settings-option-card"
          }
        >
          <Checkbox
            label="Enable pincode popup"
            name="popupEnabled"
            checked={
              popupEnabled
            }
            onChange={
              setPopupEnabled
            }
            helpText="Show the popup on the selected storefront page types."
          />
        </div>

        <InlineGrid
          columns={{
            xs: 1,
            md: 2,
          }}
          gap="400"
        >
          <BlockStack gap="400">
            <TextField
              label="Popup title"
              name="popupTitle"
              value={popupTitle}
              onChange={
                setPopupTitle
              }
              autoComplete="off"
              maxLength={100}
              showCharacterCount
              helpText="Main heading displayed inside the popup."
            />

            <TextField
              label="Popup description"
              name="popupDescription"
              value={
                popupDescription
              }
              onChange={
                setPopupDescription
              }
              autoComplete="off"
              multiline={3}
              maxLength={250}
              showCharacterCount
              helpText="Short instruction shown below the popup title."
            />

            <TextField
              label="Validation button text"
              name="popupButtonText"
              value={
                popupButtonText
              }
              onChange={
                setPopupButtonText
              }
              autoComplete="off"
              maxLength={50}
              showCharacterCount
            />

            {/* <TextField
              label="Location button text"
              name="popupLocationText"
              value={
                popupLocationText
              }
              onChange={
                setPopupLocationText
              }
              autoComplete="off"
              maxLength={50}
              showCharacterCount
              disabled={
                !locationDetectionEnabled
              }
              helpText="Shown only when automatic location detection is enabled."
            /> */}
          </BlockStack>

          <div className="popup-preview-shell">
            <span className="popup-preview-label">
              Live preview
            </span>

            <div
              className={`popup-preview popup-preview-${popupTheme}`}
              style={{
                maxWidth: `${previewWidth}px`,
              }}
            >
              {popupShowClose ? (
                <button
                  type="button"
                  className="popup-preview-close"
                  aria-label="Close popup preview"
                >
                  ×
                </button>
              ) : null}

              <div
                className="popup-preview-icon"
                aria-hidden="true"
              >
                ⌖
              </div>

              <h3>
                {popupTitle ||
                  DEFAULT_POPUP_TITLE}
              </h3>

              <p>
                {popupDescription ||
                  DEFAULT_POPUP_DESCRIPTION}
              </p>

              <div className="popup-preview-input">
                Enter pincode
              </div>

              {/* {locationDetectionEnabled ? (
                <button
                  type="button"
                  className="popup-preview-location"
                >
                  ◎{" "}
                  {popupLocationText ||
                    DEFAULT_LOCATION_BUTTON_TEXT}
                </button>
              ) : null} */}

              <button
                type="button"
                className="popup-preview-primary"
              >
                {popupButtonText ||
                  DEFAULT_POPUP_BUTTON_TEXT}
              </button>
            </div>
          </div>
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}