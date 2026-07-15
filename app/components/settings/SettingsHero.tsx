import type {
  SettingsHeroProps,
} from "../../types/settings";

export function SettingsHero({
  requireValidation,
  popupEnabled,
}: SettingsHeroProps) {
  return (
    <div className="settings-hero">
      <div>
        <span className="settings-hero-badge">
          Storefront configuration
        </span>

        <h2>
          Control delivery validation and popup behaviour
        </h2>

        <p>
          Configure customer validation rules, storefront
          messages, popup targeting, and automatic location
          detection from one place.
        </p>
      </div>

      <div className="settings-hero-statuses">
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

        <div className="settings-status">
          <span
            className={
              popupEnabled
                ? "settings-status-dot settings-status-dot-active"
                : "settings-status-dot"
            }
          />

          <span>
            Popup{" "}
            {popupEnabled
              ? "enabled"
              : "disabled"}
          </span>
        </div>
      </div>
    </div>
  );
}