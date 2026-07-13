import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { Page, Layout, Card, BlockStack, Text, Button, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getOrCreateShopByDomain } from "../lib/pincode.server";
import { getSettingsByShopId, upsertSettings } from "../lib/settings.server";

type ActionData = {
  success?: string;
  error?: string;
};

function toBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShopByDomain(session.shop);
  const settings = await getSettingsByShopId(shop.id);

  return data({
    settings: {
      restrictAddToCart: settings?.restrictAddToCart ?? true,
      restrictBuyNow: settings?.restrictBuyNow ?? true,
      enableEmbed: settings?.enableEmbed ?? true,
      enableBlock: settings?.enableBlock ?? true,
      requireValidation: settings?.requireValidation ?? true,
      successMessage:
        settings?.successMessage ?? "Delivery available for this pincode.",
      failureMessage:
        settings?.failureMessage ??
        "Sorry, delivery is not available for this pincode.",
      defaultCountry: settings?.defaultCountry ?? "India",
      rememberPincodeDays: settings?.rememberPincodeDays ?? 7,
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShopByDomain(session.shop);
  const formData = await request.formData();

  try {
    const successMessage = String(formData.get("successMessage") || "").trim();
    const failureMessage = String(formData.get("failureMessage") || "").trim();
    const defaultCountry =
      String(formData.get("defaultCountry") || "").trim() || null;
    const rememberPincodeDays = Number(
      String(formData.get("rememberPincodeDays") || "").trim(),
    );

    if (!successMessage) {
      return data<ActionData>(
        { error: "Success message is required." },
        { status: 400 },
      );
    }

    if (!failureMessage) {
      return data<ActionData>(
        { error: "Failure message is required." },
        { status: 400 },
      );
    }

    if (
      Number.isNaN(rememberPincodeDays) ||
      rememberPincodeDays < 1 ||
      rememberPincodeDays > 365
    ) {
      return data<ActionData>(
        { error: "Remember pincode days must be between 1 and 365." },
        { status: 400 },
      );
    }

    await upsertSettings({
      shopId: shop.id,
      restrictAddToCart: toBool(formData.get("restrictAddToCart")),
      restrictBuyNow: toBool(formData.get("restrictBuyNow")),
      enableEmbed: toBool(formData.get("enableEmbed")),
      enableBlock: toBool(formData.get("enableBlock")),
      requireValidation: toBool(formData.get("requireValidation")),
      successMessage,
      failureMessage,
      defaultCountry,
      rememberPincodeDays,
    });

    return data<ActionData>({ success: "Settings saved successfully." });
  } catch (error: any) {
    return data<ActionData>(
      { error: error?.message || "Failed to save settings." },
      { status: 500 },
    );
  }
}

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  return (
    <AppProvider i18n={{}}><Page
      title="Settings"
      subtitle="Control validation behavior and storefront messages."
    >
      <Layout>
        {actionData?.error ? (
          <Layout.Section>
            <Banner tone="critical">
              <p>{actionData.error}</p>
            </Banner>
          </Layout.Section>
        ) : null}

        {actionData?.success ? (
          <Layout.Section>
            <Banner tone="success">
              <p>{actionData.success}</p>
            </Banner>
          </Layout.Section>
        ) : null}

        <Layout.Section>
          <Card>
            <Form method="post">
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">
                  Validation Rules
                </Text>

                <div style={{ display: "grid", gap: 12 }}>
                  <label>
                    <input
                      type="checkbox"
                      name="requireValidation"
                      defaultChecked={settings.requireValidation}
                    />{" "}
                    Require pincode validation before purchase
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="restrictAddToCart"
                      defaultChecked={settings.restrictAddToCart}
                    />{" "}
                    Restrict Add to Cart when pincode is not validated
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="restrictBuyNow"
                      defaultChecked={settings.restrictBuyNow}
                    />{" "}
                    Restrict Buy Now when pincode is not validated
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="enableEmbed"
                      defaultChecked={settings.enableEmbed}
                    />{" "}
                    Enable app embed
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="enableBlock"
                      defaultChecked={settings.enableBlock}
                    />{" "}
                    Enable theme block
                  </label>
                </div>

                <Text as="h2" variant="headingMd">
                  Messages
                </Text>

                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <label
                      htmlFor="successMessage"
                      style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
                    >
                      Success message
                    </label>
                    <input
                      id="successMessage"
                      name="successMessage"
                      defaultValue={settings.successMessage}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="failureMessage"
                      style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
                    >
                      Failure message
                    </label>
                    <input
                      id="failureMessage"
                      name="failureMessage"
                      defaultValue={settings.failureMessage}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <Text as="h2" variant="headingMd">
                  Defaults
                </Text>

                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <label
                      htmlFor="defaultCountry"
                      style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
                    >
                      Default country
                    </label>
                    <input
                      id="defaultCountry"
                      name="defaultCountry"
                      defaultValue={settings.defaultCountry}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="rememberPincodeDays"
                      style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
                    >
                      Remember pincode for days
                    </label>
                    <input
                      id="rememberPincodeDays"
                      name="rememberPincodeDays"
                      type="number"
                      min="1"
                      max="365"
                      defaultValue={String(settings.rememberPincodeDays)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <Button submit variant="primary" loading={isSubmitting}>
                    Save settings
                  </Button>
                </div>
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
    </AppProvider>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #c9cccf",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
};