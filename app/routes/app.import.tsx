import "@shopify/polaris/build/esm/styles.css";

import { useCallback, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import {
  AppProvider,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  DropZone,
  InlineStack,
  Layout,
  Page,
  RadioButton,
  Text,
} from "@shopify/polaris";

type InvalidRow = {
  rowNumber: number;
  row: {
    pincode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  error: string;
};

type ImportSummary = {
  mode?: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  insertedOrUpdated: number;
  deletedBeforeImport?: number;
};

type ImportResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  invalidRows?: InvalidRow[];
  invalidRowsTruncated?: boolean;
  summary?: ImportSummary;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImportPincodesPage() {
  const fetcher = useFetcher<ImportResponse>();

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [mode, setMode] =
    useState<"append" | "replace">("append");

  const [clientError, setClientError] =
    useState<string | null>(null);

  const isLoading = fetcher.state !== "idle";

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      setClientError(null);

      const file = acceptedFiles?.[0];

      if (!file) {
        setClientError("Please select a CSV file.");
        return;
      }

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setClientError("Only CSV files are supported.");
        setSelectedFile(null);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setClientError(
          "The CSV file cannot be larger than 5 MB.",
        );
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    },
    [],
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setClientError(null);
  }, []);

  const handleSubmit = useCallback(() => {
    setClientError(null);

    if (!selectedFile) {
      setClientError(
        "Please select a CSV file before importing.",
      );
      return;
    }

    if (mode === "replace") {
      const confirmed = window.confirm(
        "Replace mode will delete all existing pincodes before importing this file. Do you want to continue?",
      );

      if (!confirmed) {
        return;
      }
    }

    const formData = new FormData();

    formData.append("file", selectedFile);
    formData.append("mode", mode);

    fetcher.submit(formData, {
      method: "post",
      action: "/api/pincodes/import",
      encType: "multipart/form-data",
    });
  }, [fetcher, mode, selectedFile]);

  const invalidRowsTable = useMemo(
    () =>
      fetcher.data?.invalidRows?.map((item) => [
        item.rowNumber,
        item.row.pincode || "—",
        item.row.city || "—",
        item.row.state || "—",
        item.row.country || "—",
        item.error,
      ]) || [],
    [fetcher.data?.invalidRows],
  );

  const sampleCsvUrl = useMemo(() => {
    const csv = [
      "pincode,city,state,country,cod_available,prepaid_available,est_delivery_days,is_active",
      "110001,New Delhi,Delhi,India,true,true,2,true",
      "400001,Mumbai,Maharashtra,India,false,true,4,true",
      "560001,Bengaluru,Karnataka,India,true,true,3,true",
    ].join("\n");

    return `data:text/csv;charset=utf-8,${encodeURIComponent(
      csv,
    )}`;
  }, []);

  const summary = fetcher.data?.summary;

  return (
    <AppProvider i18n={{}}>
      <Page
        title="Import pincodes"
        subtitle="Upload and manage delivery serviceability records in bulk."
        backAction={{
          content: "Dashboard",
          url: "/app",
        }}
      >
        <Layout>
          <Layout.Section>
            <div className="import-hero">
              <div>
                <span className="import-hero-badge">
                  Bulk pincode management
                </span>

                <h2>
                  Import thousands of serviceable pincodes
                </h2>

                <p>
                  Upload a CSV file to add new pincodes,
                  update matching records or safely replace
                  your complete pincode database.
                </p>
              </div>

              <div className="import-hero-actions">
                <a
                  href={sampleCsvUrl}
                  download="pincode-import-sample.csv"
                  className="sample-download-button"
                >
                  Download sample CSV
                </a>
              </div>
            </div>
          </Layout.Section>

          {clientError ? (
            <Layout.Section>
              <Banner
                tone="critical"
                title="File could not be selected"
                onDismiss={() => setClientError(null)}
              >
                <p>{clientError}</p>
              </Banner>
            </Layout.Section>
          ) : null}

          {fetcher.data?.error ? (
            <Layout.Section>
              <Banner
                tone="critical"
                title="Import could not be completed"
              >
                <p>{fetcher.data.error}</p>
              </Banner>
            </Layout.Section>
          ) : null}

          {fetcher.data?.success ? (
            <Layout.Section>
              <Banner
                tone="success"
                title="Import completed"
              >
                <p>
                  {fetcher.data.message ||
                    "Your pincode data was imported successfully."}
                </p>
              </Banner>
            </Layout.Section>
          ) : null}

          <Layout.Section>
            <div className="import-main-grid">
              <Card>
                <BlockStack gap="500">
                  <div>
                    <Text
                      as="h2"
                      variant="headingLg"
                    >
                      Upload CSV file
                    </Text>

                    <Box paddingBlockStart="150">
                      <Text as="p" tone="subdued">
                        Select a CSV file containing up to
                        50,000 rows. The maximum supported
                        file size is 5 MB.
                      </Text>
                    </Box>
                  </div>

                  <div className="import-mode-section">
                    <Text
                      as="h3"
                      variant="headingMd"
                    >
                      Choose import mode
                    </Text>

                    <div
                      className={`import-mode-card ${
                        mode === "append"
                          ? "import-mode-card-active"
                          : ""
                      }`}
                    >
                      <RadioButton
                        id="append"
                        name="importMode"
                        label="Append and update"
                        checked={mode === "append"}
                        onChange={() =>
                          setMode("append")
                        }
                        helpText="Adds new pincodes and updates records with matching pincode values."
                      />
                    </div>

                    <div
                      className={`import-mode-card import-mode-card-danger ${
                        mode === "replace"
                          ? "import-mode-card-active-danger"
                          : ""
                      }`}
                    >
                      <RadioButton
                        id="replace"
                        name="importMode"
                        label="Replace all existing pincodes"
                        checked={mode === "replace"}
                        onChange={() =>
                          setMode("replace")
                        }
                        helpText="Deletes all existing records before importing valid rows from this file."
                      />
                    </div>

                    {mode === "replace" ? (
                      <Banner
                        tone="warning"
                        title="Replace mode is destructive"
                      >
                        <p>
                          Existing pincode records will be
                          deleted only after the uploaded file
                          contains valid rows. This action
                          cannot be undone.
                        </p>
                      </Banner>
                    ) : null}
                  </div>

                  <DropZone
                    accept=".csv,text/csv"
                    type="file"
                    allowMultiple={false}
                    onDrop={handleDrop}
                    disabled={isLoading}
                  >
                    {selectedFile ? (
                      <div className="selected-file">
                        <div className="selected-file-icon">
                          CSV
                        </div>

                        <div className="selected-file-details">
                          <strong>
                            {selectedFile.name}
                          </strong>

                          <span>
                            {formatFileSize(
                              selectedFile.size,
                            )}
                          </span>
                        </div>

                        <Button
                          variant="plain"
                          tone="critical"
                          onClick={handleRemoveFile}
                          disabled={isLoading}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <DropZone.FileUpload
                        actionTitle="Select CSV file"
                        actionHint="or drop the file here — maximum 5 MB"
                      />
                    )}
                  </DropZone>

                  <InlineStack
                    gap="300"
                    blockAlign="center"
                  >
                    <Button
                      variant="primary"
                      size="large"
                      onClick={handleSubmit}
                      loading={isLoading}
                      disabled={!selectedFile || isLoading}
                    >
                      {mode === "replace"
                        ? "Replace and import"
                        : "Import pincodes"}
                    </Button>

                    {selectedFile ? (
                      <Text as="span" tone="subdued">
                        Ready to import{" "}
                        {selectedFile.name}
                      </Text>
                    ) : null}
                  </InlineStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <div>
                    <Text
                      as="h2"
                      variant="headingMd"
                    >
                      CSV requirements
                    </Text>

                    <Box paddingBlockStart="150">
                      <Text as="p" tone="subdued">
                        Format the file using the following
                        column names.
                      </Text>
                    </Box>
                  </div>

                  <div className="requirement-item">
                    <div className="requirement-number">
                      1
                    </div>

                    <div>
                      <strong>Required column</strong>
                      <span>pincode</span>
                    </div>
                  </div>

                  <div className="requirement-item">
                    <div className="requirement-number">
                      2
                    </div>

                    <div>
                      <strong>Optional columns</strong>
                      <span>
                        city, state, country,
                        cod_available,
                        prepaid_available,
                        est_delivery_days and is_active
                      </span>
                    </div>
                  </div>

                  <div className="requirement-item">
                    <div className="requirement-number">
                      3
                    </div>

                    <div>
                      <strong>Boolean values</strong>
                      <span>
                        Use true, false, yes, no, 1 or 0.
                      </span>
                    </div>
                  </div>

                  <div className="requirement-item">
                    <div className="requirement-number">
                      4
                    </div>

                    <div>
                      <strong>Delivery days</strong>
                      <span>
                        Use a whole number between 0 and 365.
                      </span>
                    </div>
                  </div>

                  <div className="requirement-item">
                    <div className="requirement-number">
                      5
                    </div>

                    <div>
                      <strong>Pincode format</strong>
                      <span>
                        Must contain six digits and cannot
                        start with zero.
                      </span>
                    </div>
                  </div>

                  <a
                    href={sampleCsvUrl}
                    download="pincode-import-sample.csv"
                    className="secondary-download-button"
                  >
                    Download example file
                  </a>
                </BlockStack>
              </Card>
            </div>
          </Layout.Section>

          {summary ? (
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <div>
                    <Text
                      as="h2"
                      variant="headingLg"
                    >
                      Import summary
                    </Text>

                    <Box paddingBlockStart="150">
                      <Text as="p" tone="subdued">
                        Review the result of the latest CSV
                        import.
                      </Text>
                    </Box>
                  </div>

                  <div className="summary-grid">
                    <div className="summary-card">
                      <span>Import mode</span>
                      <strong>
                        {summary.mode === "replace"
                          ? "Replace"
                          : "Append"}
                      </strong>
                    </div>

                    <div className="summary-card">
                      <span>Total rows</span>
                      <strong>
                        {summary.totalRows}
                      </strong>
                    </div>

                    <div className="summary-card summary-card-success">
                      <span>Valid rows</span>
                      <strong>
                        {summary.validRows}
                      </strong>
                    </div>

                    <div className="summary-card summary-card-error">
                      <span>Invalid rows</span>
                      <strong>
                        {summary.invalidRows}
                      </strong>
                    </div>

                    <div className="summary-card">
                      <span>Inserted or updated</span>
                      <strong>
                        {summary.insertedOrUpdated}
                      </strong>
                    </div>

                    {summary.mode === "replace" ? (
                      <div className="summary-card">
                        <span>Records replaced</span>
                        <strong>
                          {summary.deletedBeforeImport ?? 0}
                        </strong>
                      </div>
                    ) : null}
                  </div>

                  <InlineStack gap="300">
                    <Button url="/app/pincodes">
                      View saved pincodes
                    </Button>

                    <Button
                      variant="plain"
                      onClick={() => {
                        setSelectedFile(null);
                        setMode("append");
                      }}
                    >
                      Start another import
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          ) : null}

          {fetcher.data?.invalidRows?.length ? (
            <Layout.Section>
              <Box paddingBlockEnd="800">
                <Card>
                  <BlockStack gap="400">
                    <div>
                      <Text
                        as="h2"
                        variant="headingLg"
                      >
                        Invalid rows
                      </Text>

                      <Box paddingBlockStart="150">
                        <Text as="p" tone="subdued">
                          These rows were skipped because
                          they contain invalid or unsupported
                          values.
                        </Text>
                      </Box>
                    </div>

                    {fetcher.data
                      .invalidRowsTruncated ? (
                      <Banner tone="warning">
                        <p>
                          Only the first 100 invalid rows are
                          displayed. Correct the file and
                          import it again to review remaining
                          errors.
                        </p>
                      </Banner>
                    ) : null}

                    <div className="invalid-table-wrapper">
                      <DataTable
                        columnContentTypes={[
                          "numeric",
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                        ]}
                        headings={[
                          "Row",
                          "Pincode",
                          "City",
                          "State",
                          "Country",
                          "Error",
                        ]}
                        rows={invalidRowsTable}
                      />
                    </div>
                  </BlockStack>
                </Card>
              </Box>
            </Layout.Section>
          ) : null}
        </Layout>

        <style>
          {`
            .import-hero {
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
                0 12px 30px rgba(17, 24, 39, 0.16);
            }

            .import-hero > div {
              position: relative;
              z-index: 2;
            }

            .import-hero-badge {
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

            .import-hero h2 {
              margin: 16px 0 9px;
              font-size: 27px;
              line-height: 1.2;
            }

            .import-hero p {
              max-width: 680px;
              margin: 0;
              color: rgba(255, 255, 255, 0.78);
              font-size: 14px;
              line-height: 1.7;
            }

            .sample-download-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-height: 42px;
              padding: 10px 16px;
              border: 1px solid
                rgba(255, 255, 255, 0.28);
              border-radius: 10px;
              background: #ffffff;
              color: #202223;
              font-size: 13px;
              font-weight: 700;
              text-decoration: none;
              white-space: nowrap;
            }

            .import-main-grid {
              display: grid;
              grid-template-columns:
                minmax(0, 1.35fr)
                minmax(300px, 0.65fr);
              gap: 20px;
            }

            .import-mode-section {
              display: grid;
              gap: 12px;
            }

            .import-mode-card {
              padding: 15px;
              border: 1px solid #e3e5e7;
              border-radius: 12px;
              background: #ffffff;
              transition:
                border-color 0.15s ease,
                background 0.15s ease;
            }

            .import-mode-card-active {
              border-color: #005bd3;
              background: #f2f7ff;
            }

            .import-mode-card-danger {
              border-color: #e3e5e7;
            }

            .import-mode-card-active-danger {
              border-color: #b98900;
              background: #fff8e5;
            }

            .selected-file {
              display: flex;
              align-items: center;
              gap: 14px;
              min-height: 120px;
              padding: 22px;
              text-align: left;
            }

            .selected-file-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 54px;
              height: 54px;
              flex-shrink: 0;
              border-radius: 13px;
              background: #e8f5ee;
              color: #087a44;
              font-size: 13px;
              font-weight: 800;
            }

            .selected-file-details {
              display: flex;
              flex: 1;
              flex-direction: column;
              gap: 4px;
              min-width: 0;
            }

            .selected-file-details strong {
              overflow: hidden;
              color: #202223;
              font-size: 14px;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .selected-file-details span {
              color: #8c9196;
              font-size: 12px;
            }

            .requirement-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding-bottom: 14px;
              border-bottom: 1px solid #ededed;
            }

            .requirement-number {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              flex-shrink: 0;
              border-radius: 8px;
              background: #eef4ff;
              color: #254f9c;
              font-size: 12px;
              font-weight: 800;
            }

            .requirement-item strong,
            .requirement-item span {
              display: block;
            }

            .requirement-item strong {
              color: #303030;
              font-size: 13px;
            }

            .requirement-item span {
              margin-top: 4px;
              color: #6d7175;
              font-size: 12px;
              line-height: 1.5;
            }

            .secondary-download-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-height: 40px;
              padding: 9px 14px;
              border: 1px solid #c9cccf;
              border-radius: 9px;
              background: #ffffff;
              color: #202223;
              font-size: 13px;
              font-weight: 650;
              text-decoration: none;
            }

            .summary-grid {
              display: grid;
              grid-template-columns:
                repeat(auto-fit, minmax(150px, 1fr));
              gap: 14px;
            }

            .summary-card {
              padding: 17px;
              border: 1px solid #e3e5e7;
              border-radius: 13px;
              background: #fafbfb;
            }

            .summary-card span,
            .summary-card strong {
              display: block;
            }

            .summary-card span {
              color: #6d7175;
              font-size: 12px;
              font-weight: 600;
            }

            .summary-card strong {
              margin-top: 8px;
              color: #202223;
              font-size: 24px;
              line-height: 1;
            }

            .summary-card-success {
              border-color: #a9d9bd;
              background: #edf9f1;
            }

            .summary-card-error {
              border-color: #f2b8b5;
              background: #fff1f0;
            }

            .invalid-table-wrapper {
              width: 100%;
              overflow-x: auto;
            }

            @media (max-width: 900px) {
              .import-main-grid {
                grid-template-columns: 1fr;
              }
            }

            @media (max-width: 650px) {
              .import-hero {
                align-items: flex-start;
                flex-direction: column;
                padding: 24px 20px;
              }

              .import-hero-actions,
              .sample-download-button {
                width: 100%;
                box-sizing: border-box;
              }

              .selected-file {
                align-items: flex-start;
                flex-wrap: wrap;
              }

              .selected-file-details {
                min-width: calc(100% - 72px);
              }
            }
          `}
        </style>
      </Page>
    </AppProvider>
  );
}