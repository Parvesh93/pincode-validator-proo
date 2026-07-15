import {
  BlockStack,
  Box,
  Card,
  Checkbox,
  InlineGrid,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";

import type {
  PopupTheme,
  PopupTrigger,
} from "../../lib/settings.server";

import type {
  SettingsSectionProps,
} from "../../types/settings";

export function PopupBehaviourSettings({
  values,
  setters,
}: SettingsSectionProps) {
  const {
    popupTrigger,
    popupDelaySeconds,
    popupTheme,
    popupWidth,
    popupShowClose,
    popupCloseOnOverlay,
    popupRemember,
    popupRememberDays,
    popupAutoClose,
    popupAutoCloseDelay,
  } = values;

  const {
    setPopupTrigger,
    setPopupDelaySeconds,
    setPopupTheme,
    setPopupWidth,
    setPopupShowClose,
    setPopupCloseOnOverlay,
    setPopupRemember,
    setPopupRememberDays,
    setPopupAutoClose,
    setPopupAutoCloseDelay,
  } = setters;

  return (
    <Card>
      <BlockStack gap="500">
        <div>
          <Text
            as="h2"
            variant="headingLg"
          >
            Popup behaviour
          </Text>

          <Box paddingBlockStart="150">
            <Text
              as="p"
              tone="subdued"
            >
              Configure when the
              popup appears and how it
              behaves after validation.
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
          <Select
            label="Popup trigger"
            name="popupTrigger"
            value={
              popupTrigger
            }
            options={[
              {
                label:
                  "Immediately",
                value:
                  "immediate",
              },
              {
                label:
                  "After a delay",
                value:
                  "delay",
              },
              {
                label:
                  "Before Add to Cart",
                value:
                  "before_add_to_cart",
              },
            ]}
            onChange={(value) =>
              setPopupTrigger(
                value as PopupTrigger,
              )
            }
            helpText="Choose when the popup should open."
          />

          <TextField
            label="Popup delay"
            name="popupDelaySeconds"
            type="number"
            min={0}
            max={60}
            step={1}
            value={
              popupDelaySeconds
            }
            onChange={
              setPopupDelaySeconds
            }
            autoComplete="off"
            suffix="seconds"
            disabled={
              popupTrigger !==
              "delay"
            }
            helpText="Used only when the trigger is set to After a delay."
          />

          <Select
            label="Popup theme"
            name="popupTheme"
            value={popupTheme}
            options={[
              {
                label: "Light",
                value: "light",
              },
              {
                label: "Dark",
                value: "dark",
              },
            ]}
            onChange={(value) =>
              setPopupTheme(
                value as PopupTheme,
              )
            }
          />

          <TextField
            label="Popup width"
            name="popupWidth"
            type="number"
            min={320}
            max={700}
            step={1}
            value={popupWidth}
            onChange={
              setPopupWidth
            }
            autoComplete="off"
            suffix="px"
            helpText="Choose a width between 320 and 700 pixels."
          />
        </InlineGrid>

        <div className="settings-option-grid settings-option-grid-two">
          <div
            className={
              popupShowClose
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Show close button"
              name="popupShowClose"
              checked={
                popupShowClose
              }
              onChange={
                setPopupShowClose
              }
              helpText="Allow customers to close the popup manually."
            />
          </div>

          <div
            className={
              popupCloseOnOverlay
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Close on overlay click"
              name="popupCloseOnOverlay"
              checked={
                popupCloseOnOverlay
              }
              onChange={
                setPopupCloseOnOverlay
              }
              helpText="Close the popup when the customer clicks outside it."
            />
          </div>

          <div
            className={
              popupRemember
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Remember validated pincode"
              name="popupRemember"
              checked={
                popupRemember
              }
              onChange={
                setPopupRemember
              }
              helpText="Avoid repeatedly showing the popup after a successful validation."
            />
          </div>

          <div
            className={
              popupAutoClose
                ? "settings-option-card settings-option-card-active"
                : "settings-option-card"
            }
          >
            <Checkbox
              label="Auto-close after success"
              name="popupAutoClose"
              checked={
                popupAutoClose
              }
              onChange={
                setPopupAutoClose
              }
              helpText="Close the popup automatically after delivery availability is confirmed."
            />
          </div>
        </div>

        <InlineGrid
          columns={{
            xs: 1,
            md: 2,
          }}
          gap="400"
        >
          <TextField
            label="Remember popup pincode for"
            name="popupRememberDays"
            type="number"
            min={1}
            max={365}
            step={1}
            value={
              popupRememberDays
            }
            onChange={
              setPopupRememberDays
            }
            autoComplete="off"
            suffix="days"
            disabled={
              !popupRemember
            }
            helpText="Controls how long a successful popup validation is remembered."
          />

          <TextField
            label="Auto-close delay"
            name="popupAutoCloseDelay"
            type="number"
            min={0}
            max={10000}
            step={100}
            value={
              popupAutoCloseDelay
            }
            onChange={
              setPopupAutoCloseDelay
            }
            autoComplete="off"
            suffix="ms"
            disabled={
              !popupAutoClose
            }
            helpText="Delay before closing the popup after a successful validation."
          />
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}