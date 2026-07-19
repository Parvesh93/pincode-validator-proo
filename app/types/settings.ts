import type {
  PopupTheme,
  PopupTrigger,
} from "../lib/settings.server";

export type SettingsFormValues = {
  restrictAddToCart: boolean;
  restrictBuyNow: boolean;
  enableEmbed: boolean;
  enableBlock: boolean;
  requireValidation: boolean;

  successMessage: string;
  failureMessage: string;
  defaultCountry: string;
  rememberPincodeDays: string;

  popupEnabled: boolean;
  popupTitle: string;
  popupDescription: string;
  popupButtonText: string;

  popupTrigger: PopupTrigger;
  popupDelaySeconds: string;

  popupRemember: boolean;
  popupRememberDays: string;

  popupShowClose: boolean;
  popupCloseOnOverlay: boolean;

  popupTheme: PopupTheme;
  popupWidth: string;

  popupShowHome: boolean;
  popupShowProduct: boolean;
  popupShowCollection: boolean;
  popupShowCart: boolean;
  popupShowPages: boolean;

  popupAutoClose: boolean;
  popupAutoCloseDelay: string;
};

export type SettingsFormSetters = {
  setRestrictAddToCart: (
    value: boolean,
  ) => void;

  setRestrictBuyNow: (
    value: boolean,
  ) => void;

  setEnableEmbed: (
    value: boolean,
  ) => void;

  setEnableBlock: (
    value: boolean,
  ) => void;

  setRequireValidation: (
    value: boolean,
  ) => void;

  setSuccessMessage: (
    value: string,
  ) => void;

  setFailureMessage: (
    value: string,
  ) => void;

  setDefaultCountry: (
    value: string,
  ) => void;

  setRememberPincodeDays: (
    value: string,
  ) => void;

  setPopupEnabled: (
    value: boolean,
  ) => void;

  setPopupTitle: (
    value: string,
  ) => void;

  setPopupDescription: (
    value: string,
  ) => void;

  setPopupButtonText: (
    value: string,
  ) => void;

  // setPopupLocationText: (
  //   value: string,
  // ) => void;

  setPopupTrigger: (
    value: PopupTrigger,
  ) => void;

  setPopupDelaySeconds: (
    value: string,
  ) => void;

  setPopupRemember: (
    value: boolean,
  ) => void;

  setPopupRememberDays: (
    value: string,
  ) => void;

  setPopupShowClose: (
    value: boolean,
  ) => void;

  setPopupCloseOnOverlay: (
    value: boolean,
  ) => void;

  setPopupTheme: (
    value: PopupTheme,
  ) => void;

  setPopupWidth: (
    value: string,
  ) => void;

  setPopupShowHome: (
    value: boolean,
  ) => void;

  setPopupShowProduct: (
    value: boolean,
  ) => void;

  setPopupShowCollection: (
    value: boolean,
  ) => void;

  setPopupShowCart: (
    value: boolean,
  ) => void;

  setPopupShowPages: (
    value: boolean,
  ) => void;

  setPopupAutoClose: (
    value: boolean,
  ) => void;

  setPopupAutoCloseDelay: (
    value: string,
  ) => void;

  // setLocationDetectionEnabled: (
  //   value: boolean,
  // ) => void;
};

export type SettingsSectionProps = {
  values: SettingsFormValues;
  setters: SettingsFormSetters;
};

export type SettingsHeroProps = {
  requireValidation: boolean;
  popupEnabled: boolean;
};

export type SettingsSummaryProps = {
  requireValidation: boolean;
  restrictAddToCart: boolean;
  restrictBuyNow: boolean;
  popupEnabled: boolean;
  rememberPincodeDays: string;
};

export type SettingsSaveBarProps = {
  isSubmitting: boolean;
};