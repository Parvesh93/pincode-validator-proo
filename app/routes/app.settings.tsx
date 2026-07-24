import "@shopify/polaris/build/esm/styles.css";

import { useEffect, useState } from "react";

import {
  AppProvider,
  Banner,
  Layout,
  Page,
} from "@shopify/polaris";

import enTranslations from "@shopify/polaris/locales/en.json";

import {
  Form,
  data,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";

import { SettingsHero } from "../components/settings/SettingsHero";
import { SettingsSummary } from "../components/settings/SettingsSummary";
import { ValidationSettings } from "../components/settings/ValidationSettings";
import { ThemeSettings } from "../components/settings/ThemeSettings";
import { MessageSettings } from "../components/settings/MessageSettings";
import { PopupSettings } from "../components/settings/PopupSettings";
import { PopupBehaviourSettings } from "../components/settings/PopupBehaviourSettings";
import { PopupTargetingSettings } from "../components/settings/PopupTargetingSettings";
import { DefaultsSettings } from "../components/settings/DefaultsSettings";
import { SettingsSaveBar } from "../components/settings/SettingsSaveBar";
import { SettingsStyles } from "../components/settings/SettingsStyles";

import {
  getOrCreateShopByDomain,
} from "../lib/pincode.server";

import {
  getSettingsByShopId,
  upsertSettings,
  type PopupTheme,
  type PopupTrigger,
} from "../lib/settings.server";

import { authenticate } from "../shopify.server";

import type {
  SettingsFormSetters,
  SettingsFormValues,
} from "../types/settings";

import {
  getBillingStatus,
} from "../lib/billing.server";

type ActionData = {
  success?: string;
  error?: string;
};

const DEFAULT_SUCCESS_MESSAGE =
  "Delivery available for this pincode.";

const DEFAULT_FAILURE_MESSAGE =
  "Sorry, delivery is not available for this pincode.";

const DEFAULT_POPUP_TITLE =
  "Check Delivery Availability";

const DEFAULT_POPUP_DESCRIPTION =
  "Enter your pincode to check delivery availability.";

const DEFAULT_POPUP_BUTTON_TEXT =
  "Check Availability";

function toBool(
  value: FormDataEntryValue | null,
) {
  return (
    value === "on" ||
    value === "true"
  );
}

function getString(
  formData: FormData,
  name: string,
) {
  return String(
    formData.get(name) ?? "",
  ).trim();
}

function getInteger(
  formData: FormData,
  name: string,
) {
  const rawValue = getString(
    formData,
    name,
  );

  if (!rawValue) {
    return null;
  }

  const parsedValue =
    Number(rawValue);

  if (
    !Number.isInteger(
      parsedValue,
    )
  ) {
    return null;
  }

  return parsedValue;
}

function isPopupTrigger(
  value: string,
): value is PopupTrigger {
  return [
    "immediate",
    "delay",
    "before_add_to_cart",
  ].includes(value);
}

function isPopupTheme(
  value: string,
): value is PopupTheme {
  return [
    "light",
    "dark",
  ].includes(value);
}

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const {
  billing,
  session,
} = await authenticate.admin(
  request,
);

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

    const billingStatus =
  await getBillingStatus(
    billing,
    shop.id,
  );

const isPro =
  billingStatus.isPro;

  const settings =
    await getSettingsByShopId(
      shop.id,
    );

  const popupTriggerValue =
    settings?.popupTrigger ??
    "delay";

  const popupThemeValue =
    settings?.popupTheme ??
    "light";

  return data({
    isPro,

  settings: {
    restrictAddToCart:
      isPro
        ? settings?.restrictAddToCart ??
          false
        : false,

    restrictBuyNow:
      isPro
        ? settings?.restrictBuyNow ??
          false
        : false,

      enableEmbed:
        settings?.enableEmbed ??
        true,

      enableBlock:
        settings?.enableBlock ??
        true,

      requireValidation:
        settings?.requireValidation ??
        true,

      successMessage:
        settings?.successMessage ??
        DEFAULT_SUCCESS_MESSAGE,

      failureMessage:
        settings?.failureMessage ??
        DEFAULT_FAILURE_MESSAGE,

      defaultCountry:
        settings?.defaultCountry ??
        "India",

      rememberPincodeDays:
        settings?.rememberPincodeDays ??
        7,

      popupEnabled:
  isPro
    ? settings?.popupEnabled ??
      false
    : false,

      popupTitle:
        settings?.popupTitle ??
        DEFAULT_POPUP_TITLE,

      popupDescription:
        settings?.popupDescription ??
        DEFAULT_POPUP_DESCRIPTION,

      popupButtonText:
        settings?.popupButtonText ??
        DEFAULT_POPUP_BUTTON_TEXT,

      popupTrigger:
        isPopupTrigger(
          popupTriggerValue,
        )
          ? popupTriggerValue
          : "delay",

      popupDelaySeconds:
        settings?.popupDelaySeconds ??
        3,

      popupRemember:
        settings?.popupRemember ??
        true,

      popupRememberDays:
        settings?.popupRememberDays ??
        7,

      popupShowClose:
        settings?.popupShowClose ??
        true,

      popupCloseOnOverlay:
        settings?.popupCloseOnOverlay ??
        true,

      popupTheme:
        isPopupTheme(
          popupThemeValue,
        )
          ? popupThemeValue
          : "light",

      popupWidth:
        settings?.popupWidth ??
        420,

      popupShowHome:
        settings?.popupShowHome ??
        true,

      popupShowProduct:
        settings?.popupShowProduct ??
        true,

      popupShowCollection:
        settings?.popupShowCollection ??
        true,

      popupShowCart:
        settings?.popupShowCart ??
        false,

      popupShowPages:
        settings?.popupShowPages ??
        false,

      popupAutoClose:
        settings?.popupAutoClose ??
        true,

      popupAutoCloseDelay:
        settings?.popupAutoCloseDelay ??
        1500,

    },
  });
}

export async function action({
  request,
}: ActionFunctionArgs) {
  const {
  billing,
  session,
} = await authenticate.admin(
  request,
);

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

    const billingStatus =
  await getBillingStatus(
    billing,
    shop.id,
  );

const isPro =
  billingStatus.isPro;

  const formData =
    await request.formData();

  console.log(
    "[Settings] Submitted values:",
    Object.fromEntries(
      formData.entries(),
    ),
  );

  try {
    const successMessage =
      getString(
        formData,
        "successMessage",
      );

    const failureMessage =
      getString(
        formData,
        "failureMessage",
      );

    const defaultCountry =
      getString(
        formData,
        "defaultCountry",
      ) || null;

    const rememberPincodeDays =
      getInteger(
        formData,
        "rememberPincodeDays",
      );

    const popupTitle =
      getString(
        formData,
        "popupTitle",
      );

    const popupDescription =
      getString(
        formData,
        "popupDescription",
      );

    const popupButtonText =
      getString(
        formData,
        "popupButtonText",
      );

    const popupTriggerRaw =
      getString(
        formData,
        "popupTrigger",
      );

    const popupDelaySeconds =
      getInteger(
        formData,
        "popupDelaySeconds",
      );

    const popupRememberDays =
      getInteger(
        formData,
        "popupRememberDays",
      );

    const popupThemeRaw =
      getString(
        formData,
        "popupTheme",
      );

    const popupWidth =
      getInteger(
        formData,
        "popupWidth",
      );

    const popupAutoCloseDelay =
      getInteger(
        formData,
        "popupAutoCloseDelay",
      );

    if (!successMessage) {
      return data<ActionData>(
        {
          error:
            "Success message is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      successMessage.length >
      250
    ) {
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
          error:
            "Failure message is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      failureMessage.length >
      250
    ) {
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
      rememberPincodeDays ===
        null ||
      rememberPincodeDays < 1 ||
      rememberPincodeDays >
        365
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

    if (isPro) {
  if (!popupTitle) {
    return data<ActionData>(
      {
        error:
          "Popup title is required.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    popupTitle.length > 100
  ) {
    return data<ActionData>(
      {
        error:
          "Popup title cannot be longer than 100 characters.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    popupDescription.length >
    250
  ) {
    return data<ActionData>(
      {
        error:
          "Popup description cannot be longer than 250 characters.",
      },
      {
        status: 400,
      },
    );
  }

  if (!popupButtonText) {
    return data<ActionData>(
      {
        error:
          "Popup button text is required.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    popupButtonText.length > 50
  ) {
    return data<ActionData>(
      {
        error:
          "Popup button text cannot be longer than 50 characters.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !isPopupTrigger(
      popupTriggerRaw,
    )
  ) {
    return data<ActionData>(
      {
        error:
          "Select a valid popup trigger.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    popupDelaySeconds === null ||
    popupDelaySeconds < 0 ||
    popupDelaySeconds > 60
  ) {
    return data<ActionData>(
      {
        error:
          "Popup delay must be a whole number between 0 and 60 seconds.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    popupRememberDays === null ||
    popupRememberDays < 1 ||
    popupRememberDays > 365
  ) {
    return data<ActionData>(
      {
        error:
          "Popup remember days must be a whole number between 1 and 365.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !isPopupTheme(
      popupThemeRaw,
    )
  ) {
    return data<ActionData>(
      {
        error:
          "Select a valid popup theme.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    popupWidth === null ||
    popupWidth < 320 ||
    popupWidth > 700
  ) {
    return data<ActionData>(
      {
        error:
          "Popup width must be a whole number between 320 and 700 pixels.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    popupAutoCloseDelay ===
      null ||
    popupAutoCloseDelay < 0 ||
    popupAutoCloseDelay >
      10000
  ) {
    return data<ActionData>(
      {
        error:
          "Auto-close delay must be a whole number between 0 and 10000 milliseconds.",
      },
      {
        status: 400,
      },
    );
  }
}

    const popupEnabled =
  isPro
    ? toBool(
        formData.get(
          "popupEnabled",
        ),
      )
    : false;

    const popupShowHome =
  isPro
    ? toBool(
        formData.get(
          "popupShowHome",
        ),
      )
    : false;

const popupShowProduct =
  isPro
    ? toBool(
        formData.get(
          "popupShowProduct",
        ),
      )
    : false;

const popupShowCollection =
  isPro
    ? toBool(
        formData.get(
          "popupShowCollection",
        ),
      )
    : false;

const popupShowCart =
  isPro
    ? toBool(
        formData.get(
          "popupShowCart",
        ),
      )
    : false;

const popupShowPages =
  isPro
    ? toBool(
        formData.get(
          "popupShowPages",
        ),
      )
    : false;

    if (
  isPro &&
  popupEnabled &&
  !popupShowHome &&
  !popupShowProduct &&
  !popupShowCollection &&
  !popupShowCart &&
  !popupShowPages
) {
  return data<ActionData>(
    {
      error:
        "Select at least one storefront page type when the popup is enabled.",
    },
    {
      status: 400,
    },
  );
}

    const safePopupTrigger: PopupTrigger =
  isPro &&
  isPopupTrigger(popupTriggerRaw)
    ? popupTriggerRaw
    : "delay";

const safePopupDelaySeconds =
  isPro &&
  popupDelaySeconds !== null
    ? popupDelaySeconds
    : 3;

const safePopupRememberDays =
  isPro &&
  popupRememberDays !== null
    ? popupRememberDays
    : 7;

const safePopupTheme: PopupTheme =
  isPro &&
  isPopupTheme(popupThemeRaw)
    ? popupThemeRaw
    : "light";

const safePopupWidth =
  isPro &&
  popupWidth !== null
    ? popupWidth
    : 420;

const safePopupAutoCloseDelay =
  isPro &&
  popupAutoCloseDelay !== null
    ? popupAutoCloseDelay
    : 1500;

const savedSettings =
  await upsertSettings({
    shopId: shop.id,

    restrictAddToCart:
      isPro
        ? toBool(
            formData.get(
              "restrictAddToCart",
            ),
          )
        : false,

    restrictBuyNow:
      isPro
        ? toBool(
            formData.get(
              "restrictBuyNow",
            ),
          )
        : false,

    enableEmbed:
      toBool(
        formData.get(
          "enableEmbed",
        ),
      ),

    enableBlock:
      toBool(
        formData.get(
          "enableBlock",
        ),
      ),

    requireValidation:
      toBool(
        formData.get(
          "requireValidation",
        ),
      ),

    successMessage,
    failureMessage,
    defaultCountry,
    rememberPincodeDays,

    popupEnabled,

    popupTitle:
      isPro
        ? popupTitle
        : DEFAULT_POPUP_TITLE,

    popupDescription:
      isPro
        ? popupDescription
        : DEFAULT_POPUP_DESCRIPTION,

    popupButtonText:
      isPro
        ? popupButtonText
        : DEFAULT_POPUP_BUTTON_TEXT,

    popupTrigger:
      safePopupTrigger,

    popupDelaySeconds:
      safePopupDelaySeconds,

    popupRemember:
      isPro
        ? toBool(
            formData.get(
              "popupRemember",
            ),
          )
        : false,

    popupRememberDays:
      safePopupRememberDays,

    popupShowClose:
      isPro
        ? toBool(
            formData.get(
              "popupShowClose",
            ),
          )
        : false,

    popupCloseOnOverlay:
      isPro
        ? toBool(
            formData.get(
              "popupCloseOnOverlay",
            ),
          )
        : false,

    popupTheme:
      safePopupTheme,

    popupWidth:
      safePopupWidth,

    popupShowHome,
    popupShowProduct,
    popupShowCollection,
    popupShowCart,
    popupShowPages,

    popupAutoClose:
      isPro
        ? toBool(
            formData.get(
              "popupAutoClose",
            ),
          )
        : false,

    popupAutoCloseDelay:
      safePopupAutoCloseDelay,
  });

    console.log(
      "[Settings] Saved record:",
      savedSettings,
    );

    return data<ActionData>({
      success:
        "Settings saved successfully.",
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
  const {
  settings,
  isPro,
} =
  useLoaderData<typeof loader>();

  const actionData =
    useActionData<
      typeof action
    >() as
      | ActionData
      | undefined;

  const navigation =
    useNavigation();

  const isSubmitting =
    navigation.state ===
    "submitting";

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
  isPro
    ? settings.restrictAddToCart
    : false,
);

const [
  restrictBuyNow,
  setRestrictBuyNow,
] = useState(
  isPro
    ? settings.restrictBuyNow
    : false,
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
    settings.defaultCountry,
  );

  const [
    rememberPincodeDays,
    setRememberPincodeDays,
  ] = useState(
    String(
      settings.rememberPincodeDays,
    ),
  );

  const [
  popupEnabled,
  setPopupEnabled,
] = useState(
  isPro
    ? settings.popupEnabled
    : false,
);

  const [
    popupTitle,
    setPopupTitle,
  ] = useState(
    settings.popupTitle,
  );

  const [
    popupDescription,
    setPopupDescription,
  ] = useState(
    settings.popupDescription,
  );

  const [
    popupButtonText,
    setPopupButtonText,
  ] = useState(
    settings.popupButtonText,
  );

  const [
    popupTrigger,
    setPopupTrigger,
  ] =
    useState<PopupTrigger>(
      settings.popupTrigger,
    );

  const [
    popupDelaySeconds,
    setPopupDelaySeconds,
  ] = useState(
    String(
      settings.popupDelaySeconds,
    ),
  );

  const [
    popupRemember,
    setPopupRemember,
  ] = useState(
    settings.popupRemember,
  );

  const [
    popupRememberDays,
    setPopupRememberDays,
  ] = useState(
    String(
      settings.popupRememberDays,
    ),
  );

  const [
    popupShowClose,
    setPopupShowClose,
  ] = useState(
    settings.popupShowClose,
  );

  const [
    popupCloseOnOverlay,
    setPopupCloseOnOverlay,
  ] = useState(
    settings.popupCloseOnOverlay,
  );

  const [
    popupTheme,
    setPopupTheme,
  ] =
    useState<PopupTheme>(
      settings.popupTheme,
    );

  const [
    popupWidth,
    setPopupWidth,
  ] = useState(
    String(
      settings.popupWidth,
    ),
  );

  const [
    popupShowHome,
    setPopupShowHome,
  ] = useState(
    settings.popupShowHome,
  );

  const [
    popupShowProduct,
    setPopupShowProduct,
  ] = useState(
    settings.popupShowProduct,
  );

  const [
    popupShowCollection,
    setPopupShowCollection,
  ] = useState(
    settings.popupShowCollection,
  );

  const [
    popupShowCart,
    setPopupShowCart,
  ] = useState(
    settings.popupShowCart,
  );

  const [
    popupShowPages,
    setPopupShowPages,
  ] = useState(
    settings.popupShowPages,
  );

  const [
    popupAutoClose,
    setPopupAutoClose,
  ] = useState(
    settings.popupAutoClose,
  );

  const [
    popupAutoCloseDelay,
    setPopupAutoCloseDelay,
  ] = useState(
    String(
      settings.popupAutoCloseDelay,
    ),
  );


  useEffect(() => {
    setRequireValidation(settings.requireValidation);
    setRestrictAddToCart(
  isPro
    ? settings.restrictAddToCart
    : false,
);
    setRestrictBuyNow(
  isPro
    ? settings.restrictBuyNow
    : false,
);
    setEnableEmbed(settings.enableEmbed);
    setEnableBlock(settings.enableBlock);
    setSuccessMessage(settings.successMessage);
    setFailureMessage(settings.failureMessage);
    setDefaultCountry(settings.defaultCountry);
    setRememberPincodeDays(String(settings.rememberPincodeDays));
    setPopupEnabled(
  isPro
    ? settings.popupEnabled
    : false,
);
    setPopupTitle(settings.popupTitle);
    setPopupDescription(settings.popupDescription);
    setPopupButtonText(settings.popupButtonText);
    setPopupTrigger(settings.popupTrigger);
    setPopupDelaySeconds(String(settings.popupDelaySeconds));
    setPopupRemember(settings.popupRemember);
    setPopupRememberDays(String(settings.popupRememberDays));
    setPopupShowClose(settings.popupShowClose);
    setPopupCloseOnOverlay(settings.popupCloseOnOverlay);
    setPopupTheme(settings.popupTheme);
    setPopupWidth(String(settings.popupWidth));
    setPopupShowHome(settings.popupShowHome);
    setPopupShowProduct(settings.popupShowProduct);
    setPopupShowCollection(settings.popupShowCollection);
    setPopupShowCart(settings.popupShowCart);
    setPopupShowPages(settings.popupShowPages);
    setPopupAutoClose(settings.popupAutoClose);
    setPopupAutoCloseDelay(String(settings.popupAutoCloseDelay));
  }, [settings, isPro]);

  const values: SettingsFormValues = {
    restrictAddToCart,
    restrictBuyNow,
    enableEmbed,
    enableBlock,
    requireValidation,

    successMessage,
    failureMessage,
    defaultCountry,
    rememberPincodeDays,

    popupEnabled,
    popupTitle,
    popupDescription,
    popupButtonText,
    popupTrigger,
    popupDelaySeconds,

    popupRemember,
    popupRememberDays,

    popupShowClose,
    popupCloseOnOverlay,

    popupTheme,
    popupWidth,

    popupShowHome,
    popupShowProduct,
    popupShowCollection,
    popupShowCart,
    popupShowPages,

    popupAutoClose,
    popupAutoCloseDelay,

  };

  const setters: SettingsFormSetters = {
    setRestrictAddToCart,
    setRestrictBuyNow,
    setEnableEmbed,
    setEnableBlock,
    setRequireValidation,

    setSuccessMessage,
    setFailureMessage,
    setDefaultCountry,
    setRememberPincodeDays,

    setPopupEnabled,
    setPopupTitle,
    setPopupDescription,
    setPopupButtonText,
    setPopupTrigger,
    setPopupDelaySeconds,

    setPopupRemember,
    setPopupRememberDays,

    setPopupShowClose,
    setPopupCloseOnOverlay,

    setPopupTheme,
    setPopupWidth,

    setPopupShowHome,
    setPopupShowProduct,
    setPopupShowCollection,
    setPopupShowCart,
    setPopupShowPages,

    setPopupAutoClose,
    setPopupAutoCloseDelay,

  };

  return (
    <AppProvider
      i18n={enTranslations}
    >
      <Page
        title="Settings"
        subtitle="Control storefront validation, popup behaviour and customer-facing messages."
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
  <div className="settings-hero-wrapper">
    <SettingsHero
      requireValidation={
        requireValidation
      }
      popupEnabled={
        popupEnabled
      }
    />
  </div>
</Layout.Section>

<Form method="post">
            <input
              type="hidden"
              name="requireValidation"
              value={
                requireValidation
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="restrictAddToCart"
              value={
                restrictAddToCart
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="restrictBuyNow"
              value={
                restrictBuyNow
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="enableEmbed"
              value={
                enableEmbed
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="enableBlock"
              value={
                enableBlock
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupEnabled"
              value={
                popupEnabled
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupRemember"
              value={
                popupRemember
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupShowClose"
              value={
                popupShowClose
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupCloseOnOverlay"
              value={
                popupCloseOnOverlay
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupShowHome"
              value={
                popupShowHome
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupShowProduct"
              value={
                popupShowProduct
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupShowCollection"
              value={
                popupShowCollection
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupShowCart"
              value={
                popupShowCart
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupShowPages"
              value={
                popupShowPages
                  ? "true"
                  : "false"
              }
            />

            <input
              type="hidden"
              name="popupAutoClose"
              value={
                popupAutoClose
                  ? "true"
                  : "false"
              }
            />

            <Layout>
              <Layout.Section>
                <ValidationSettings
  values={values}
  setters={setters}
  isPro={isPro}
/>
              </Layout.Section>

              <Layout.Section variant="oneThird">
                <SettingsSummary
                  requireValidation={
                    requireValidation
                  }
                  restrictAddToCart={
                    restrictAddToCart
                  }
                  restrictBuyNow={
                    restrictBuyNow
                  }
                  popupEnabled={
                    popupEnabled
                  }
                  rememberPincodeDays={
                    rememberPincodeDays
                  }
                />
              </Layout.Section>

              <Layout.Section>
                <ThemeSettings
                  values={values}
                  setters={setters}
                />
              </Layout.Section>

              <Layout.Section>
                <MessageSettings
                  values={values}
                  setters={setters}
                />
              </Layout.Section>

              <Layout.Section>
  <fieldset
    disabled={!isPro}
    className={
      isPro
        ? "pro-settings-section"
        : "pro-settings-section pro-settings-section--locked"
    }
  >
    {!isPro ? (
      <div className="pro-settings-lock">
        <span>
          👑 Pro feature
        </span>

        <a href="/app/billing">
          View plans
        </a>
      </div>
    ) : null}

    <PopupSettings
      values={values}
      setters={setters}
    />
  </fieldset>
</Layout.Section>

<Layout.Section>
  <fieldset
    disabled={!isPro}
    className={
      isPro
        ? "pro-settings-section"
        : "pro-settings-section pro-settings-section--locked"
    }
  >
    {!isPro ? (
      <div className="pro-settings-lock">
        <span>
          👑 Pro feature
        </span>

        <a href="/app/billing">
          View plans
        </a>
      </div>
    ) : null}

    <PopupBehaviourSettings
      values={values}
      setters={setters}
    />
  </fieldset>
</Layout.Section>

<Layout.Section>
  <fieldset
    disabled={!isPro}
    className={
      isPro
        ? "pro-settings-section"
        : "pro-settings-section pro-settings-section--locked"
    }
  >
    {!isPro ? (
      <div className="pro-settings-lock">
        <span>
          👑 Pro feature
        </span>

        <a href="/app/billing">
          View plans
        </a>
      </div>
    ) : null}

    <PopupTargetingSettings
      values={values}
      setters={setters}
    />
  </fieldset>
</Layout.Section>

              <Layout.Section>
                <DefaultsSettings
                  values={values}
                  setters={setters}
                />
              </Layout.Section>

              <Layout.Section>
                <SettingsSaveBar
                  isSubmitting={
                    isSubmitting
                  }
                />
              </Layout.Section>
            </Layout>
          </Form>
        </Layout>


        <style>
  {`
    .pro-settings-section {
      min-width: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .pro-settings-section--locked {
      position: relative;
      opacity: 0.58;
      filter: grayscale(0.35);
    }

    .pro-settings-section--locked input,
    .pro-settings-section--locked button,
    .pro-settings-section--locked select,
    .pro-settings-section--locked textarea {
      cursor: not-allowed !important;
    }

    .pro-settings-lock {
      position: relative;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
      padding: 10px 14px;
      border: 1px solid #d4d6d8;
      border-radius: 10px;
      background: #f1f2f3;
      color: #616161;
      font-size: 13px;
      font-weight: 700;
    }

    .pro-settings-lock a {
      color: #005bd3;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      pointer-events: auto;
    }

    .pro-settings-lock a:hover {
      text-decoration: underline;
    }

    .settings-hero-wrapper {
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .settings-hero-wrapper {
        margin-bottom: 18px;
      }
    }

  `}
</style>


        <SettingsStyles />
      </Page>
    </AppProvider>
  );
}