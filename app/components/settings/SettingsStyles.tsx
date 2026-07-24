export function SettingsStyles() {
  return (
    <style>
      {`
        .settings-hero {
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

        .settings-hero-badge,
        .settings-pro-badge {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .settings-hero-badge {
          border: 1px solid
            rgba(255, 255, 255, 0.18);
          background:
            rgba(255, 255, 255, 0.08);
        }

        .settings-pro-badge {
          background: #fff4d6;
          color: #7a4b00;
          white-space: nowrap;
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

        .settings-hero-statuses {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .settings-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
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
              minmax(230px, 1fr)
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
          text-align: right;
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

        .popup-preview-shell {
          display: grid;
          align-content: start;
          min-height: 100%;
          padding: 18px;
          border: 1px solid #e3e5e7;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              #f6f6f7,
              #eef2f6
            );
        }

        .popup-preview-label {
          margin-bottom: 14px;
          color: #6d7175;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .popup-preview {
          position: relative;
          width: 100%;
          margin: auto;
          padding: 26px;
          border-radius: 18px;
          box-shadow:
            0 18px 45px
            rgba(17, 24, 39, 0.16);
          transition:
            max-width 0.2s ease,
            background 0.2s ease;
        }

        .popup-preview-light {
          background: #ffffff;
          color: #111827;
        }

        .popup-preview-dark {
          background: #111827;
          color: #ffffff;
        }

        .popup-preview-close {
          position: absolute;
          top: 12px;
          right: 14px;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 24px;
          cursor: default;
        }

        .popup-preview-icon {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          margin-bottom: 16px;
          border-radius: 14px;
          background: #e7f0ff;
          color: #005bd3;
          font-size: 24px;
        }

        .popup-preview h3 {
          margin: 0;
          font-size: 21px;
        }

        .popup-preview p {
          margin: 8px 0 18px;
          color: #6d7175;
          font-size: 13px;
          line-height: 1.55;
        }

        .popup-preview-dark p {
          color:
            rgba(255, 255, 255, 0.7);
        }

        .popup-preview-input {
          padding: 12px 13px;
          border: 1px solid #c9cccf;
          border-radius: 9px;
          background: #ffffff;
          color: #8c9196;
          font-size: 13px;
        }

        .popup-preview-location,
        .popup-preview-primary {
          width: 100%;
          margin-top: 11px;
          padding: 11px 13px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
        }

        .popup-preview-location {
          border: 1px solid #c9cccf;
          background: transparent;
          color: inherit;
        }

        .popup-preview-primary {
          border: 1px solid #005bd3;
          background: #005bd3;
          color: #ffffff;
        }

        .settings-inline-warning {
          padding: 15px 16px;
          border-left: 4px solid #b98900;
          border-radius: 9px;
          background: #fff8db;
        }

        .settings-inline-warning strong {
          display: block;
          color: #5c3b00;
          font-size: 13px;
        }

        .settings-inline-warning p {
          margin: 5px 0 0;
          color: #6d4f00;
          font-size: 12px;
          line-height: 1.55;
        }

        .settings-feature-summary {
          display: grid;
          overflow: hidden;
          border: 1px solid #e3e5e7;
          border-radius: 12px;
          background: #fafbfb;
        }

        .settings-feature-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 13px 15px;
          border-bottom:
            1px solid #ededed;
        }

        .settings-feature-summary-row:last-child {
          border-bottom: 0;
        }

        .settings-feature-summary-row span {
          color: #6d7175;
          font-size: 12px;
        }

        .settings-feature-summary-row strong {
          max-width: 60%;
          color: #303030;
          font-size: 12px;
          text-align: right;
          overflow-wrap: anywhere;
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

          .settings-hero-statuses {
            justify-content: flex-start;
          }

          .message-preview-grid {
            grid-template-columns: 1fr;
          }

          .settings-save-bar {
            align-items: stretch;
            flex-direction: column;
          }

          .popup-preview {
            padding: 22px 18px;
          }

          .settings-feature-summary-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .settings-feature-summary-row strong {
            max-width: 100%;
            text-align: left;
          }
        }

        .settings-option-card-disabled{
    opacity:.55;
    filter:grayscale(.2);
    position:relative;
}

.settings-option-card-disabled .Polaris-Checkbox{
    pointer-events:none;
}

.settings-upgrade-link {
  color: #005bd3;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.settings-upgrade-link:hover {
  text-decoration: underline;
}

      `}
    </style>
  );
}