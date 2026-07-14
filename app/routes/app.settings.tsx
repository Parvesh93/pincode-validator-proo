import "@shopify/polaris/build/esm/styles.css";

import { useState } from "react";

import {
  AppProvider,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";

import {
  Form,
  data,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";

import { authenticate } from "../shopify.server";
import { getOrCreateShopByDomain } from "../lib/pincode.server";
import {
  getSettingsByShopId,
  upsertSettings,
} from "../lib/settings.server";

type ActionData = {
  success?: string;
  error?: string;
};

function toBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const shop = await getOrCreateShopByDomain(
    session.shop,
  );

  const settings = await getSettingsByShopId(
    shop.id,
  );

  return data({
    settings: {
      restrictAddToCart:
        settings?.restrictAddToCart ?? true,

      restrictBuyNow:
        settings?.restrictBuyNow ?? true,

      enableEmbed:
        settings?.enableEmbed ?? true,

      enableBlock:
        settings?.enableBlock ?? true,

      requireValidation:
        settings?.requireValidation ?? true,

      successMessage:
        settings?.successMessage ??
        "Delivery available for this pincode.",

      failureMessage:
        settings?.failureMessage ??
        "Sorry, delivery is not available for this pincode.",

      defaultCountry:
        settings?.defaultCountry ?? "India",

      rememberPincodeDays:
        settings?.rememberPincodeDays ?? 7,
    },
  });
}

export async function action({
  request,
}: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const shop = await getOrCreateShopByDomain(
    session.shop,
  );

  const formData = await request.formData();

  try {
    const successMessage = String(
      formData.get("successMessage") || "",
    ).trim();

    const failureMessage = String(
      formData.get("failureMessage") || "",
    ).trim();

    const defaultCountry =
      String(
        formData.get("defaultCountry") || "",
      ).trim() || null;

    const rememberPincodeDaysRaw = String(
      formData.get("rememberPincodeDays") || "",
    ).trim();

    const rememberPincodeDays = Number(
      rememberPincodeDaysRaw,
    );

    if (!successMessage) {
      return data<ActionData>(
        {
          error: "Success message is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (successMessage.length > 250) {
      return data<ActionData>(
        {
          error:
            "Success message cannot be longer than 250 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (!failureMessage) {
      return data<ActionData>(
        {
          error: "Failure message is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (failureMessage.length > 250) {
      return data<ActionData>(
        {
          error:
            "Failure message cannot be longer than 250 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !rememberPincodeDaysRaw ||
      !Number.isInteger(rememberPincodeDays) ||
      rememberPincodeDays < 1 ||
      rememberPincodeDays > 365
    ) {
      return data<ActionData>(
        {
          error:
            "Remember pincode days must be a whole number between 1 and 365.",
        },
        {
          status: 400,
        },
      );
    }

    await upsertSettings({
      shopId: shop.id,

      restrictAddToCart: toBool(
        formData.get("restrictAddToCart"),
      ),

      restrictBuyNow: toBool(
        formData.get("restrictBuyNow"),
      ),

      enableEmbed: toBool(
        formData.get("enableEmbed"),
      ),

      enableBlock: toBool(
        formData.get("enableBlock"),
      ),

      requireValidation: toBool(
        formData.get("requireValidation"),
      ),

      successMessage,
      failureMessage,
      defaultCountry,
      rememberPincodeDays,
    });

    return data<ActionData>({
      success: "Settings saved successfully.",
    });
  } catch (error: unknown) {
    console.error(
      "Failed to save settings:",
      error,
    );

    return data<ActionData>(
      {
        error:
          "Settings could not be saved. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}

export default function SettingsPage() {
  const { settings } =
    useLoaderData<typeof loader>();

  const actionData =
    useActionData<typeof action>() as
      | ActionData
      | undefined;

  const navigation = useNavigation();

  const isSubmitting =
    navigation.state === "submitting";

  const [
    requireValidation,
    setRequireValidation,
  ] = useState(
    settings.requireValidation,
  );

  const [
    restrictAddToCart,
    setRestrictAddToCart,
  ] = useState(
    settings.restrictAddToCart,
  );

  const [
    restrictBuyNow,
    setRestrictBuyNow,
  ] = useState(
    settings.restrictBuyNow,
  );

  const [
    enableEmbed,
    setEnableEmbed,
  ] = useState(
    settings.enableEmbed,
  );

  const [
    enableBlock,
    setEnableBlock,
  ] = useState(
    settings.enableBlock,
  );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState(
    settings.successMessage,
  );

  const [
    failureMessage,
    setFailureMessage,
  ] = useState(
    settings.failureMessage,
  );

  const [
    defaultCountry,
    setDefaultCountry,
  ] = useState(
    settings.defaultCountry || "",
  );

  const [
    rememberPincodeDays,
    setRememberPincodeDays,
  ] = useState(
    String(
      settings.rememberPincodeDays,
    ),
  );

  return (
    <AppProvider i18n={{}}>
      <Page
        title="Settings"
        subtitle="Control storefront validation, button restrictions and customer-facing messages."
        backAction={{
          content: "Dashboard",
          url: "/app",
        }}
      >
        <Layout>
          {actionData?.error ? (
            <Layout.Section>
              <Banner
                tone="critical"
                title="Settings could not be saved"
              >
                <p>
                  {actionData.error}
                </p>
              </Banner>
            </Layout.Section>
          ) : null}

          {actionData?.success ? (
            <Layout.Section>
              <Banner
                tone="success"
                title="Settings updated"
              >
                <p>
                  {actionData.success}
                </p>
              </Banner>
            </Layout.Section>
          ) : null}

          <Layout.Section>
            <div className="settings-hero">
              <div>
                <span className="settings-hero-badge">
                  Storefront configuration
                </span>

                <h2>
                  Control how delivery validation works
                </h2>

                <p>
                  Configure customer validation rules,
                  storefront messages and how long a
                  verified pincode should remain
                  remembered.
                </p>
              </div>

              <div className="settings-status">
                <span
                  className={
                    requireValidation
                      ? "settings-status-dot settings-status-dot-active"
                      : "settings-status-dot"
                  }
                />

                <span>
                  Validation{" "}
                  {requireValidation
                    ? "enabled"
                    : "disabled"}
                </span>
              </div>
            </div>
          </Layout.Section>

          <Form method="post">
            <Layout>
              <Layout.Section>
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
                          Choose when customers must
                          validate their pincode and
                          which purchase buttons should
                          be restricted.
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
                          checked={
                            requireValidation
                          }
                          onChange={
                            setRequireValidation
                          }
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
                          checked={
                            restrictAddToCart
                          }
                          onChange={
                            setRestrictAddToCart
                          }
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
                          checked={
                            restrictBuyNow
                          }
                          onChange={
                            setRestrictBuyNow
                          }
                          helpText="Disable visible dynamic checkout buttons until validation succeeds."
                        />
                      </div>
                    </div>
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="400">
                    <div>
                      <Text
                        as="h2"
                        variant="headingMd"
                      >
                        Current behavior
                      </Text>

                      <Box paddingBlockStart="150">
                        <Text
                          as="p"
                          tone="subdued"
                        >
                          A live summary of the
                          currently selected rules.
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
                          Remembered for
                        </span>

                        <strong>
                          {rememberPincodeDays ||
                            "0"}{" "}
                          days
                        </strong>
                      </div>
                    </div>
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section>
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
                          Control which storefront
                          integration methods are
                          available to the merchant.
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
                          checked={
                            enableEmbed
                          }
                          onChange={
                            setEnableEmbed
                          }
                          helpText="Allow global storefront integration through the app embed."
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
                          checked={
                            enableBlock
                          }
                          onChange={
                            setEnableBlock
                          }
                          helpText="Allow merchants to add the pincode validator as a product-page block."
                        />
                      </div>
                    </div>

                    <Banner
                      tone="info"
                      title="Theme editor setup"
                    >
                      <p>
                        The app block or app embed
                        must still be enabled from
                        Online Store → Themes →
                        Customize.
                      </p>
                    </Banner>
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section>
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
                          Customize the messages shown
                          after a customer checks their
                          delivery pincode.
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
                        value={
                          successMessage
                        }
                        onChange={
                          setSuccessMessage
                        }
                        autoComplete="off"
                        multiline={3}
                        maxLength={250}
                        showCharacterCount
                        helpText="Shown when delivery is available."
                      />

                      <TextField
                        label="Failure message"
                        name="failureMessage"
                        value={
                          failureMessage
                        }
                        onChange={
                          setFailureMessage
                        }
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
              </Layout.Section>

              <Layout.Section>
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
                          Define the default market and
                          how long a successful
                          validation should be
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
                        value={
                          defaultCountry
                        }
                        onChange={
                          setDefaultCountry
                        }
                        autoComplete="country-name"
                        helpText="Used when imported or manually created records do not specify a country."
                      />

                      <TextField
                        label="Remember pincode for"
                        name="rememberPincodeDays"
                        type="number"
                        min={1}
                        max={365}
                        step={1}
                        value={
                          rememberPincodeDays
                        }
                        onChange={
                          setRememberPincodeDays
                        }
                        autoComplete="off"
                        suffix="days"
                        helpText="Choose a value between 1 and 365 days."
                      />
                    </InlineGrid>
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section>
                <div className="settings-save-bar">
                  <div>
                    <strong>
                      Save storefront settings
                    </strong>

                    <span>
                      Changes will apply to future
                      storefront validation requests.
                    </span>
                  </div>

                  <InlineStack gap="300">
                    <Button
                      url="/app"
                      disabled={
                        isSubmitting
                      }
                    >
                      Cancel
                    </Button>

                    <Button
                      submit
                      variant="primary"
                      loading={
                        isSubmitting
                      }
                      disabled={
                        isSubmitting
                      }
                    >
                      Save settings
                    </Button>
                  </InlineStack>
                </div>
              </Layout.Section>
            </Layout>
          </Form>
        </Layout>

        <style>
          {`
            .settings-hero {
              position: relative;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              overflow: hidden;
              padding: 30px;
              border-radius: 18px;
              background:
                linear-gradient(
                  135deg,
                  #1f2937 0%,
                  #111827 58%,
                  #0f766e 145%
                );
              color: #ffffff;
              box-shadow:
                0 12px 30px
                rgba(17, 24, 39, 0.16);
            }

            .settings-hero > div {
              position: relative;
              z-index: 2;
            }

            .settings-hero-badge {
              display: inline-flex;
              padding: 6px 10px;
              border: 1px solid
                rgba(255, 255, 255, 0.18);
              border-radius: 999px;
              background:
                rgba(255, 255, 255, 0.08);
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.03em;
            }

            .settings-hero h2 {
              margin: 16px 0 9px;
              font-size: 27px;
              line-height: 1.2;
            }

            .settings-hero p {
              max-width: 680px;
              margin: 0;
              color:
                rgba(255, 255, 255, 0.78);
              font-size: 14px;
              line-height: 1.7;
            }

            .settings-status {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              flex-shrink: 0;
              padding: 10px 13px;
              border: 1px solid
                rgba(255, 255, 255, 0.18);
              border-radius: 999px;
              background:
                rgba(255, 255, 255, 0.08);
              color: #ffffff;
              font-size: 12px;
              font-weight: 700;
              white-space: nowrap;
            }

            .settings-status-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #8c9196;
            }

            .settings-status-dot-active {
              background: #4ade80;
              box-shadow:
                0 0 0 4px
                rgba(74, 222, 128, 0.15);
            }

            .settings-option-grid {
              display: grid;
              grid-template-columns:
                repeat(
                  auto-fit,
                  minmax(250px, 1fr)
                );
              gap: 14px;
            }

            .settings-option-grid-two {
              grid-template-columns:
                repeat(
                  auto-fit,
                  minmax(280px, 1fr)
                );
            }

            .settings-option-card {
              display: block;
              padding: 16px;
              border: 1px solid #e3e5e7;
              border-radius: 13px;
              background: #ffffff;
              transition:
                border-color 0.15s ease,
                background 0.15s ease,
                box-shadow 0.15s ease;
            }

            .settings-option-card:hover {
              border-color: #b5b8bb;
              box-shadow:
                0 3px 12px
                rgba(20, 25, 30, 0.04);
            }

            .settings-option-card-active {
              border-color: #005bd3;
              background: #f2f7ff;
            }

            .settings-summary-list {
              display: grid;
            }

            .settings-summary-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 14px;
              padding: 13px 0;
              border-bottom:
                1px solid #ededed;
            }

            .settings-summary-row:last-child {
              border-bottom: 0;
            }

            .settings-summary-row span {
              color: #6d7175;
              font-size: 13px;
            }

            .settings-summary-row strong {
              color: #303030;
              font-size: 13px;
            }

            .message-preview-grid {
              display: grid;
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
              gap: 14px;
            }

            .message-preview {
              padding: 16px;
              border: 1px solid #e3e5e7;
              border-radius: 13px;
              background: #fafbfb;
            }

            .message-preview span {
              display: block;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }

            .message-preview p {
              margin: 8px 0 0;
              font-size: 13px;
              line-height: 1.55;
              overflow-wrap: anywhere;
            }

            .message-preview-success {
              border-color: #a9d9bd;
              background: #edf9f1;
              color: #08723f;
            }

            .message-preview-error {
              border-color: #f2b8b5;
              background: #fff1f0;
              color: #8e1f17;
            }

            .settings-save-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              flex-wrap: wrap;
              padding: 18px 20px;
              border: 1px solid #dfe3e8;
              border-radius: 14px;
              background: #ffffff;
              box-shadow:
                0 8px 24px
                rgba(20, 25, 30, 0.08);
            }

            .settings-save-bar strong,
            .settings-save-bar span {
              display: block;
            }

            .settings-save-bar strong {
              color: #202223;
              font-size: 14px;
            }

            .settings-save-bar span {
              margin-top: 4px;
              color: #6d7175;
              font-size: 12px;
            }

            @media (max-width: 760px) {
              .settings-hero {
                align-items: flex-start;
                flex-direction: column;
                padding: 24px 20px;
              }

              .settings-status {
                align-self: flex-start;
              }

              .message-preview-grid {
                grid-template-columns: 1fr;
              }

              .settings-save-bar {
                align-items: stretch;
                flex-direction: column;
              }
            }
          `}
        </style>
      </Page>
    </AppProvider>
  );
}