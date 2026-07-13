// import { useMemo } from "react";
// import { AppProvider } from "@shopify/polaris";
// import "@shopify/polaris/build/esm/styles.css";
// import { useFetcher } from "react-router";
// import {
//   Page,
//   Layout,
//   Card,
//   BlockStack,
//   Text,
//   Button,
//   DropZone,
//   InlineStack,
//   DataTable,
//   Banner,
// } from "@shopify/polaris";

// export default function ImportPincodesPage() {
//   const fetcher = useFetcher<{
//     invalidRows?: Array<{ rowNumber: number; row: { pincode?: string; city?: string; state?: string; country?: string }; error: string }>;
//     summary?: { totalRows: number; validRows: number; invalidRows: number; insertedOrUpdated: number };
//     error?: string;
//   }>();

//   const isLoading = fetcher.state !== "idle";

//   const fileName = useMemo(() => {
//     const formData = fetcher.formData;
//     const file = formData?.get("file");
//     return file instanceof File ? file.name : "";
//   }, [fetcher.formData]);

//   const invalidRowsTable =
//     fetcher.data?.invalidRows?.map((item) => [
//       item.rowNumber,
//       item.row.pincode || "-",
//       item.row.city || "-",
//       item.row.state || "-",
//       item.row.country || "-",
//       item.error,
//     ]) || [];

//   return (
//     <AppProvider i18n={{}}>
//     <Page title="Import Pincodes">
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <BlockStack gap="400">
//               <Text as="h2" variant="headingMd">
//                 Upload CSV file
//               </Text>

//               <Text as="p" tone="subdued">
//                 Upload a CSV containing pincodes and optional delivery metadata.
//               </Text>

//               <fetcher.Form method="post" action="/api/pincodes/import" encType="multipart/form-data">
//                 <BlockStack gap="400">
//                   <DropZone
//                     accept=".csv"
//                     type="file"
//                     allowMultiple={false}
//                     onDrop={(files) => {
//                       const form = new FormData();
//                       if (files[0]) {
//                         form.append("file", files[0]);
//                         fetcher.submit(form, {
//                           method: "post",
//                           action: "/api/pincodes/import",
//                           encType: "multipart/form-data",
//                         });
//                       }
//                     }}
//                   >
//                     <DropZone.FileUpload
//                       actionHint="Accepts only .csv files"
//                     />
//                   </DropZone>

//                   {fileName ? (
//                     <Text as="p">Selected file: {fileName}</Text>
//                   ) : null}

//                   <InlineStack gap="300">
//                     <Button
//                       submit
//                       variant="primary"
//                       loading={isLoading}
//                     >
//                       Upload CSV
//                     </Button>
//                     <Button
//                       url="data:text/csv;charset=utf-8,pincode,city,state,country,cod_available,prepaid_available,est_delivery_days,is_active%0A110001,New Delhi,Delhi,India,true,true,2,true%0A400001,Mumbai,Maharashtra,India,false,true,4,true"
//                       external
//                     >
//                       Download Sample CSV
//                     </Button>
//                   </InlineStack>
//                 </BlockStack>
//               </fetcher.Form>
//             </BlockStack>
//           </Card>
//         </Layout.Section>

//         {fetcher.data?.error ? (
//           <Layout.Section>
//             <Banner tone="critical">
//               <p>{fetcher.data.error}</p>
//             </Banner>
//           </Layout.Section>
//         ) : null}

//         {fetcher.data?.summary ? (
//           <Layout.Section>
//             <Card>
//               <BlockStack gap="300">
//                 <Text as="h2" variant="headingMd">
//                   Import Summary
//                 </Text>
//                 <Text as="p">
//                   Total Rows: {fetcher.data.summary.totalRows}
//                 </Text>
//                 <Text as="p">
//                   Valid Rows: {fetcher.data.summary.validRows}
//                 </Text>
//                 <Text as="p">
//                   Invalid Rows: {fetcher.data.summary.invalidRows}
//                 </Text>
//                 <Text as="p">
//                   Inserted or Updated: {fetcher.data.summary.insertedOrUpdated}
//                 </Text>
//               </BlockStack>
//             </Card>
//           </Layout.Section>
//         ) : null}

//         {fetcher.data?.invalidRows?.length ? (
//           <Layout.Section>
//             <Card>
//               <BlockStack gap="400">
//                 <Text as="h2" variant="headingMd">
//                   Invalid Rows
//                 </Text>

//                 <DataTable
//                   columnContentTypes={[
//                     "numeric",
//                     "text",
//                     "text",
//                     "text",
//                     "text",
//                     "text",
//                   ]}
//                   headings={[
//                     "Row",
//                     "Pincode",
//                     "City",
//                     "State",
//                     "Country",
//                     "Error",
//                   ]}
//                   rows={invalidRowsTable}
//                 />
//               </BlockStack>
//             </Card>
//           </Layout.Section>
//         ) : null}
//       </Layout>
//     </Page>
//     </AppProvider>
//   );
// }



import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { useMemo, useState, useCallback } from "react";
import { useFetcher } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  DropZone,
  InlineStack,
  DataTable,
  Banner,
  Box,
  RadioButton,
} from "@shopify/polaris";

type ImportResponse = {
  invalidRows?: Array<{
    rowNumber: number;
    row: {
      pincode?: string;
      city?: string;
      state?: string;
      country?: string;
    };
    error: string;
  }>;
  summary?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    insertedOrUpdated: number;
    mode?: string;
    deletedBeforeImport?: number;
  };
  error?: string;
};

export default function ImportPincodesPage() {
  const fetcher = useFetcher<ImportResponse>();
  const isLoading = fetcher.state !== "idle";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"append" | "replace">("append");

  const handleDrop = useCallback((files: File[]) => {
    if (files?.[0]) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("mode", mode);

    fetcher.submit(formData, {
      method: "post",
      action: "/api/pincodes/import",
      encType: "multipart/form-data",
    });
  }, [fetcher, selectedFile, mode]);

  const invalidRowsTable =
    fetcher.data?.invalidRows?.map((item) => [
      item.rowNumber,
      item.row.pincode || "-",
      item.row.city || "-",
      item.row.state || "-",
      item.row.country || "-",
      item.error,
    ]) || [];

  const sampleCsvUrl = useMemo(() => {
    const csv = [
      "pincode,city,state,country,cod_available,prepaid_available,est_delivery_days,is_active",
      "110001,New Delhi,Delhi,India,true,true,2,true",
      "400001,Mumbai,Maharashtra,India,false,true,4,true",
      "560001,Bengaluru,Karnataka,India,true,true,3,true",
    ].join("\n");

    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, []);

  return (
    <AppProvider i18n={{}}>
    <Page
      title="Import Pincodes"
      subtitle="Upload pincodes in bulk using a CSV file."
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                CSV Upload
              </Text>

              <Text as="p" tone="subdued">
                Upload a CSV file to add or update pincodes. You can either append
                new data or replace all existing pincodes for this shop.
              </Text>

              <Box>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Import Mode
                  </Text>

                  <RadioButton
                    label="Append / Update existing pincodes"
                    checked={mode === "append"}
                    id="append"
                    name="importMode"
                    onChange={() => setMode("append")}
                    helpText="Adds new pincodes and updates matching ones."
                  />

                  <RadioButton
                    label="Replace all existing pincodes"
                    checked={mode === "replace"}
                    id="replace"
                    name="importMode"
                    onChange={() => setMode("replace")}
                    helpText="Deletes all existing pincodes for this shop before importing."
                  />
                </BlockStack>
              </Box>

              <DropZone
                accept=".csv"
                type="file"
                allowMultiple={false}
                onDrop={handleDrop}
              >
                <DropZone.FileUpload actionHint="Accepts only .csv files" />
              </DropZone>

              {selectedFile ? (
                <Banner tone="info">
                  <p>
                    Selected file: <strong>{selectedFile.name}</strong>
                  </p>
                </Banner>
              ) : null}

              <InlineStack gap="300">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isLoading}
                  disabled={!selectedFile || isLoading}
                >
                  {mode === "replace" ? "Replace & Import CSV" : "Upload CSV"}
                </Button>

                <Button url={sampleCsvUrl} external>
                  Download Sample CSV
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Expected CSV Columns
              </Text>

              <Text as="p" tone="subdued">
                Required: <strong>pincode</strong>
              </Text>

              <Text as="p" tone="subdued">
                Optional: city, state, country, cod_available, prepaid_available,
                est_delivery_days, is_active
              </Text>

              <Text as="p" tone="subdued">
                Example values for booleans: true, false, yes, no, 1, 0
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {fetcher.data?.error ? (
          <Layout.Section>
            <Banner tone="critical">
              <p>{fetcher.data.error}</p>
            </Banner>
          </Layout.Section>
        ) : null}

        {fetcher.data?.summary ? (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Import Summary
                </Text>

                <Text as="p">
                  Mode: {fetcher.data.summary.mode || "-"}
                </Text>

                <Text as="p">
                  Total Rows: {fetcher.data.summary.totalRows}
                </Text>

                <Text as="p">
                  Valid Rows: {fetcher.data.summary.validRows}
                </Text>

                <Text as="p">
                  Invalid Rows: {fetcher.data.summary.invalidRows}
                </Text>

                {"deletedBeforeImport" in fetcher.data.summary ? (
                  <Text as="p">
                    Deleted Before Import:{" "}
                    {fetcher.data.summary.deletedBeforeImport ?? 0}
                  </Text>
                ) : null}

                <Text as="p">
                  Inserted or Updated: {fetcher.data.summary.insertedOrUpdated}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        ) : null}

        {fetcher.data?.invalidRows?.length ? (
          <Layout.Section>
            <Box paddingBlockEnd="800">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Invalid Rows
                  </Text>

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
                </BlockStack>
              </Card>
            </Box>
          </Layout.Section>
        ) : null}
      </Layout>
    </Page>
    </AppProvider>
  );
}