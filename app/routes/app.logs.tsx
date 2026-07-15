import { useState } from "react";

import {
  Form,
  data,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";

import {
  AppProvider,
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  EmptyState,
  InlineGrid,
  InlineStack,
  Page,
  Pagination,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";

import enTranslations from "@shopify/polaris/locales/en.json";

import { authenticate } from "../shopify.server";

import { getOrCreateShopByDomain } from "../lib/pincode.server";

import {
  clearValidationLogs,
  deleteValidationLogsByIds,
  getValidationLogs,
  getValidationLogSummary,
  type AvailabilityFilter,
  type BooleanAvailabilityFilter,
  type ValidationLogFilters,
  type ValidationLogSort,
} from "../lib/validation-logs.server";

type ActionData = {
  success?: string;
  error?: string;
};

function parsePositiveInteger(
  value: string | null,
  fallback = 1,
) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function parseAvailabilityFilter(
  value: string | null,
): AvailabilityFilter {
  if (
    value === "available" ||
    value === "unavailable"
  ) {
    return value;
  }

  return "all";
}

function parseBooleanAvailabilityFilter(
  value: string | null,
): BooleanAvailabilityFilter {
  if (
    value === "yes" ||
    value === "no"
  ) {
    return value;
  }

  return "all";
}

function parseValidationSort(
  value: string | null,
): ValidationLogSort {
  return value === "oldest"
    ? "oldest"
    : "newest";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(
    "en-IN",
  ).format(value);
}

function formatDateTime(
  value: string | Date,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function getResultLabel(
  result: string,
) {
  const labels: Record<
    string,
    string
  > = {
    available: "Available",
    unavailable: "Unavailable",
    inactive: "Inactive",
    invalid: "Invalid",
    prepaid_unavailable:
      "Prepaid unavailable",
  };

  return (
    labels[result] ||
    result
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      )
  );
}

function getResultTone(
  result: string,
):
  | "success"
  | "critical"
  | "warning"
  | "attention"
  | "info" {
  if (result === "available") {
    return "success";
  }

  if (result === "inactive") {
    return "warning";
  }

  if (
    result ===
    "prepaid_unavailable"
  ) {
    return "attention";
  }

  if (result === "invalid") {
    return "info";
  }

  return "critical";
}

function buildPageUrl(
  searchParams: URLSearchParams,
  page: number,
) {
  const nextParams =
    new URLSearchParams(
      searchParams,
    );

  nextParams.set(
    "page",
    String(page),
  );

  return `/app/logs?${nextParams.toString()}`;
}

function buildExportUrl(
  searchParams: URLSearchParams,
) {
  const exportParams =
    new URLSearchParams(
      searchParams,
    );

  exportParams.delete("page");

  const query =
    exportParams.toString();

  return query
    ? `/app/logs/export?${query}`
    : "/app/logs/export";
}

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { session } =
    await authenticate.admin(
      request,
    );

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

  const url = new URL(
    request.url,
  );

  const page =
    parsePositiveInteger(
      url.searchParams.get(
        "page",
      ),
      1,
    );

  const filters: ValidationLogFilters =
    {
      search:
        url.searchParams.get(
          "search",
        ) || "",

      result:
        url.searchParams.get(
          "result",
        ) || "all",

      availability:
        parseAvailabilityFilter(
          url.searchParams.get(
            "availability",
          ),
        ),

      cod:
        parseBooleanAvailabilityFilter(
          url.searchParams.get(
            "cod",
          ),
        ),

      prepaid:
        parseBooleanAvailabilityFilter(
          url.searchParams.get(
            "prepaid",
          ),
        ),

      startDate:
        url.searchParams.get(
          "startDate",
        ) || "",

      endDate:
        url.searchParams.get(
          "endDate",
        ) || "",

      sort:
        parseValidationSort(
          url.searchParams.get(
            "sort",
          ),
        ),
    };

  const [
    logsResult,
    summary,
  ] = await Promise.all([
    getValidationLogs({
      shopId: shop.id,
      page,
      pageSize: 25,
      ...filters,
    }),

    getValidationLogSummary({
      shopId: shop.id,
      ...filters,
    }),
  ]);

  return data({
    logs:
      logsResult.logs,

    pagination:
      logsResult.pagination,

    filters:
      logsResult.filters,

    summary,

    shopDomain:
      session.shop,
  });
}

export async function action({
  request,
}: ActionFunctionArgs) {
  const { session } =
    await authenticate.admin(
      request,
    );

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

  const formData =
    await request.formData();

  const intent = String(
    formData.get("intent") || "",
  );

  try {
    if (
      intent ===
      "delete-selected"
    ) {
      const selectedIds =
        formData
          .getAll("selectedIds")
          .map((value) =>
            String(value),
          );

      if (
        selectedIds.length === 0
      ) {
        return data<ActionData>(
          {
            error:
              "Select at least one validation log.",
          },
          {
            status: 400,
          },
        );
      }

      const result =
        await deleteValidationLogsByIds({
          shopId: shop.id,
          ids: selectedIds,
        });

      return data<ActionData>({
        success: `${result.count} validation log${
          result.count === 1
            ? ""
            : "s"
        } deleted.`,
      });
    }

    if (
      intent === "clear-all"
    ) {
      const confirmation =
        String(
          formData.get(
            "confirmation",
          ) || "",
        ).trim();

      if (
        confirmation !== "CLEAR"
      ) {
        return data<ActionData>(
          {
            error:
              'Type "CLEAR" exactly to delete all validation logs.',
          },
          {
            status: 400,
          },
        );
      }

      const result =
        await clearValidationLogs(
          shop.id,
        );

      return data<ActionData>({
        success: `${result.count} validation log${
          result.count === 1
            ? ""
            : "s"
        } deleted.`,
      });
    }

    return data<ActionData>(
      {
        error:
          "Invalid validation log action.",
      },
      {
        status: 400,
      },
    );
  } catch (error: unknown) {
    console.error(
      "Validation log action failed:",
      error,
    );

    return data<ActionData>(
      {
        error:
          "The validation logs could not be updated. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}

export default function ValidationLogsPage() {
  const {
    logs,
    pagination,
    filters,
    summary,
    shopDomain,
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

  const [
    searchParams,
  ] = useSearchParams();

  const [
    search,
    setSearch,
  ] = useState(
    filters.search,
  );

  const [
    resultFilter,
    setResultFilter,
  ] = useState(
    filters.result,
  );

  const [
    availabilityFilter,
    setAvailabilityFilter,
  ] =
    useState<AvailabilityFilter>(
      filters.availability,
    );

  const [
    codFilter,
    setCodFilter,
  ] =
    useState<BooleanAvailabilityFilter>(
      filters.cod,
    );

  const [
    prepaidFilter,
    setPrepaidFilter,
  ] =
    useState<BooleanAvailabilityFilter>(
      filters.prepaid,
    );

  const [
    startDate,
    setStartDate,
  ] = useState(
    filters.startDate,
  );

  const [
    endDate,
    setEndDate,
  ] = useState(
    filters.endDate,
  );

  const [
    sort,
    setSort,
  ] =
    useState<ValidationLogSort>(
      filters.sort,
    );

  const [
    selectedLogIds,
    setSelectedLogIds,
  ] = useState<string[]>([]);

  const [
    clearConfirmation,
    setClearConfirmation,
  ] = useState("");

  const isSubmitting =
    navigation.state ===
    "submitting";

  const submittedIntent =
    navigation.formData
      ? String(
          navigation.formData.get(
            "intent",
          ) || "",
        )
      : "";

  const isDeletingSelected =
    isSubmitting &&
    submittedIntent ===
      "delete-selected";

  const isClearingAll =
    isSubmitting &&
    submittedIntent ===
      "clear-all";

  const hasFilters =
    Boolean(
      filters.search ||
        filters.result !==
          "all" ||
        filters.availability !==
          "all" ||
        filters.cod !==
          "all" ||
        filters.prepaid !==
          "all" ||
        filters.startDate ||
        filters.endDate ||
        filters.sort !==
          "newest",
    );

  const exportUrl =
    buildExportUrl(
      searchParams,
    );

  const allVisibleSelected =
    logs.length > 0 &&
    logs.every((log) =>
      selectedLogIds.includes(
        log.id,
      ),
    );

  function toggleLogSelection(
    logId: string,
    checked: boolean,
  ) {
    setSelectedLogIds(
      (currentIds) => {
        if (checked) {
          return currentIds.includes(
            logId,
          )
            ? currentIds
            : [
                ...currentIds,
                logId,
              ];
        }

        return currentIds.filter(
          (id) => id !== logId,
        );
      },
    );
  }

  function toggleAllVisible(
    checked: boolean,
  ) {
    const visibleIds =
      logs.map(
        (log) => log.id,
      );

    setSelectedLogIds(
      (currentIds) => {
        if (checked) {
          return Array.from(
            new Set([
              ...currentIds,
              ...visibleIds,
            ]),
          );
        }

        return currentIds.filter(
          (id) =>
            !visibleIds.includes(
              id,
            ),
        );
      },
    );
  }

  return (
    <AppProvider i18n={enTranslations}>
    <Page
      title="Validation Logs"
      subtitle={`Review storefront pincode checks for ${shopDomain}.`}
      backAction={{
        content: "Dashboard",
        url: "/app",
      }}
      primaryAction={{
        content:
          "Export filtered CSV",
        url: exportUrl,
      }}
    >
      <BlockStack gap="500">
        {actionData?.error ? (
          <Banner
            tone="critical"
            title="Action failed"
          >
            <p>
              {actionData.error}
            </p>
          </Banner>
        ) : null}

        {actionData?.success ? (
          <Banner
            tone="success"
            title="Logs updated"
          >
            <p>
              {actionData.success}
            </p>
          </Banner>
        ) : null}

        <section className="logs-hero">
          <div>
            <span className="logs-hero-badge">
              Customer demand
            </span>

            <h2>
              Inspect every storefront
              validation
            </h2>

            <p>
              Search and filter customer
              pincode activity, identify
              delivery gaps and export
              operational data.
            </p>
          </div>

          <div className="logs-hero-total">
            <span>
              Matching records
            </span>

            <strong>
              {formatNumber(
                summary.total,
              )}
            </strong>

            <small>
              Current filter set
            </small>
          </div>
        </section>

        <section className="logs-summary-grid">
          <div className="logs-summary-card">
            <span>Total</span>

            <strong>
              {formatNumber(
                summary.total,
              )}
            </strong>

            <small>
              Validation requests
            </small>
          </div>

          <div className="logs-summary-card logs-summary-success">
            <span>Available</span>

            <strong>
              {formatNumber(
                summary.available,
              )}
            </strong>

            <small>
              Successful checks
            </small>
          </div>

          <div className="logs-summary-card logs-summary-critical">
            <span>
              Unavailable
            </span>

            <strong>
              {formatNumber(
                summary.unavailable,
              )}
            </strong>

            <small>
              Failed checks
            </small>
          </div>

          <div className="logs-summary-card">
            <span>
              COD available
            </span>

            <strong>
              {formatNumber(
                summary.codAvailable,
              )}
            </strong>

            <small>
              Matching checks
            </small>
          </div>

          <div className="logs-summary-card">
            <span>
              Prepaid available
            </span>

            <strong>
              {formatNumber(
                summary.prepaidAvailable,
              )}
            </strong>

            <small>
              Matching checks
            </small>
          </div>
        </section>

        <Card>
          <Form method="get">
            <BlockStack gap="400">
              <div>
                <Text
                  as="h2"
                  variant="headingMd"
                >
                  Search and filters
                </Text>

                <Box paddingBlockStart="100">
                  <Text
                    as="p"
                    tone="subdued"
                  >
                    Search by pincode,
                    location, product or
                    validation result.
                  </Text>
                </Box>
              </div>

              <TextField
                label="Search"
                name="search"
                value={search}
                onChange={setSearch}
                autoComplete="off"
                placeholder="Search pincode, city, state, product or result"
              />

              <InlineGrid
                columns={{
                  xs: 1,
                  sm: 2,
                  lg: 4,
                }}
                gap="300"
              >
                <Select
                  label="Result"
                  name="result"
                  value={
                    resultFilter
                  }
                  options={[
                    {
                      label:
                        "All results",
                      value: "all",
                    },
                    {
                      label:
                        "Available",
                      value:
                        "available",
                    },
                    {
                      label:
                        "Unavailable",
                      value:
                        "unavailable",
                    },
                    {
                      label:
                        "Inactive",
                      value:
                        "inactive",
                    },
                    {
                      label:
                        "Invalid",
                      value:
                        "invalid",
                    },
                    {
                      label:
                        "Prepaid unavailable",
                      value:
                        "prepaid_unavailable",
                    },
                  ]}
                  onChange={
                    setResultFilter
                  }
                />

                <Select
                  label="Availability"
                  name="availability"
                  value={
                    availabilityFilter
                  }
                  options={[
                    {
                      label:
                        "All availability",
                      value: "all",
                    },
                    {
                      label:
                        "Available",
                      value:
                        "available",
                    },
                    {
                      label:
                        "Unavailable",
                      value:
                        "unavailable",
                    },
                  ]}
                  onChange={(
                    value,
                  ) =>
                    setAvailabilityFilter(
                      value as AvailabilityFilter,
                    )
                  }
                />

                <Select
                  label="COD"
                  name="cod"
                  value={codFilter}
                  options={[
                    {
                      label:
                        "All COD statuses",
                      value: "all",
                    },
                    {
                      label:
                        "COD available",
                      value: "yes",
                    },
                    {
                      label:
                        "COD unavailable",
                      value: "no",
                    },
                  ]}
                  onChange={(
                    value,
                  ) =>
                    setCodFilter(
                      value as BooleanAvailabilityFilter,
                    )
                  }
                />

                <Select
                  label="Prepaid"
                  name="prepaid"
                  value={
                    prepaidFilter
                  }
                  options={[
                    {
                      label:
                        "All prepaid statuses",
                      value: "all",
                    },
                    {
                      label:
                        "Prepaid available",
                      value: "yes",
                    },
                    {
                      label:
                        "Prepaid unavailable",
                      value: "no",
                    },
                  ]}
                  onChange={(
                    value,
                  ) =>
                    setPrepaidFilter(
                      value as BooleanAvailabilityFilter,
                    )
                  }
                />
              </InlineGrid>

              <InlineGrid
                columns={{
                  xs: 1,
                  sm: 2,
                  lg: 3,
                }}
                gap="300"
              >
                <TextField
                  label="Start date"
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={
                    setStartDate
                  }
                  autoComplete="off"
                />

                <TextField
                  label="End date"
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={
                    setEndDate
                  }
                  autoComplete="off"
                />

                <Select
                  label="Sort"
                  name="sort"
                  value={sort}
                  options={[
                    {
                      label:
                        "Newest first",
                      value:
                        "newest",
                    },
                    {
                      label:
                        "Oldest first",
                      value:
                        "oldest",
                    },
                  ]}
                  onChange={(
                    value,
                  ) =>
                    setSort(
                      value as ValidationLogSort,
                    )
                  }
                />
              </InlineGrid>

              <InlineStack
                gap="300"
                align="end"
              >
                {hasFilters ? (
                  <Button url="/app/logs">
                    Clear filters
                  </Button>
                ) : null}

                <Button
                  submit
                  variant="primary"
                >
                  Apply filters
                </Button>
              </InlineStack>
            </BlockStack>
          </Form>
        </Card>

        <Card padding="0">
          {logs.length === 0 ? (
            <Box padding="600">
              <EmptyState
                heading={
                  hasFilters
                    ? "No matching validation logs"
                    : "No validation logs yet"
                }
                action={
                  hasFilters
                    ? {
                        content:
                          "Clear filters",
                        url: "/app/logs",
                      }
                    : undefined
                }
                image=""
              >
                <p>
                  {hasFilters
                    ? "Try changing or clearing the current filters."
                    : "Storefront pincode checks will appear here after customers use the validator."}
                </p>
              </EmptyState>
            </Box>
          ) : (
            <Form method="post">
              <input
                type="hidden"
                name="intent"
                value="delete-selected"
              />

              {selectedLogIds.map(
                (id) => (
                  <input
                    key={id}
                    type="hidden"
                    name="selectedIds"
                    value={id}
                  />
                ),
              )}

              <div className="logs-table-toolbar">
                <div>
                  <strong>
                    Validation records
                  </strong>

                  <span>
                    Page{" "}
                    {
                      pagination.currentPage
                    }{" "}
                    of{" "}
                    {
                      pagination.totalPages
                    }
                    {" · "}
                    {selectedLogIds.length}{" "}
                    selected
                  </span>
                </div>

                <Button
                  submit
                  tone="critical"
                  loading={
                    isDeletingSelected
                  }
                  disabled={
                    selectedLogIds.length ===
                    0
                  }
                >
                  Delete selected
                </Button>
              </div>

              <div className="logs-table-wrap">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>
                        <Checkbox
                          label="Select all visible logs"
                          labelHidden
                          checked={
                            allVisibleSelected
                          }
                          onChange={
                            toggleAllVisible
                          }
                        />
                      </th>

                      <th>
                        Pincode
                      </th>

                      <th>
                        Result
                      </th>

                      <th>
                        Location
                      </th>

                      <th>
                        Product
                      </th>

                      <th>COD</th>

                      <th>
                        Prepaid
                      </th>

                      <th>
                        Delivery
                      </th>

                      <th>
                        Source
                      </th>

                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {logs.map(
                      (log) => (
                        <tr
                          key={
                            log.id
                          }
                        >
                          <td>
                            <Checkbox
                              label={`Select ${log.pincode}`}
                              labelHidden
                              checked={selectedLogIds.includes(
                                log.id,
                              )}
                              onChange={(
                                checked,
                              ) =>
                                toggleLogSelection(
                                  log.id,
                                  checked,
                                )
                              }
                            />
                          </td>

                          <td>
                            <strong className="logs-pincode">
                              {
                                log.pincode
                              }
                            </strong>
                          </td>

                          <td>
                            <Badge
                              tone={getResultTone(
                                log.result,
                              )}
                            >
                              {getResultLabel(
                                log.result,
                              )}
                            </Badge>
                          </td>

                          <td>
                            <strong className="logs-primary">
                              {log.city ||
                                "Unknown"}
                            </strong>

                            <span className="logs-secondary">
                              {[
                                log.state,
                                log.country,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  ", ",
                                ) ||
                                "No location"}
                            </span>
                          </td>

                          <td>
                            {log.productTitle ? (
                              <>
                                <strong className="logs-primary">
                                  {
                                    log.productTitle
                                  }
                                </strong>

                                <span className="logs-secondary">
                                  {log.productHandle ||
                                    log.productId ||
                                    "Product"}
                                </span>
                              </>
                            ) : (
                              <span className="logs-muted">
                                Not captured
                              </span>
                            )}
                          </td>

                          <td>
                            <Badge
                              tone={
                                log.codAvailable
                                  ? "success"
                                  : undefined
                              }
                            >
                              {log.codAvailable
                                ? "Yes"
                                : "No"}
                            </Badge>
                          </td>

                          <td>
                            <Badge
                              tone={
                                log.prepaidAvailable
                                  ? "success"
                                  : undefined
                              }
                            >
                              {log.prepaidAvailable
                                ? "Yes"
                                : "No"}
                            </Badge>
                          </td>

                          <td>
                            {log.estDeliveryDays !==
                            null ? (
                              <strong className="logs-primary">
                                {
                                  log.estDeliveryDays
                                }{" "}
                                {log.estDeliveryDays ===
                                1
                                  ? "day"
                                  : "days"}
                              </strong>
                            ) : (
                              <span className="logs-muted">
                                —
                              </span>
                            )}
                          </td>

                          <td>
                            <span className="logs-source">
                              {
                                log.source
                              }
                            </span>
                          </td>

                          <td>
                            <span className="logs-date">
                              {formatDateTime(
                                log.createdAt,
                              )}
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </Form>
          )}

          {pagination.totalCount >
          0 ? (
            <div className="logs-pagination">
              <Pagination
                hasPrevious={
                  pagination.hasPreviousPage
                }
                onPrevious={() => {
                  window.location.href =
                    buildPageUrl(
                      searchParams,
                      pagination.currentPage -
                        1,
                    );
                }}
                hasNext={
                  pagination.hasNextPage
                }
                onNext={() => {
                  window.location.href =
                    buildPageUrl(
                      searchParams,
                      pagination.currentPage +
                        1,
                    );
                }}
              />
            </div>
          ) : null}
        </Card>

        <Card>
          <BlockStack gap="400">
            <div>
              <Text
                as="h2"
                variant="headingMd"
              >
                Clear validation logs
              </Text>

              <Box paddingBlockStart="100">
                <Text
                  as="p"
                  tone="subdued"
                >
                  Permanently delete all
                  validation logs for this
                  store. This action cannot
                  be undone.
                </Text>
              </Box>
            </div>

            <Form method="post">
              <input
                type="hidden"
                name="intent"
                value="clear-all"
              />

              <InlineStack
                gap="300"
                blockAlign="end"
                wrap
              >
                <div className="logs-confirmation-field">
                  <TextField
                    label='Type "CLEAR" to confirm'
                    name="confirmation"
                    value={
                      clearConfirmation
                    }
                    onChange={
                      setClearConfirmation
                    }
                    autoComplete="off"
                  />
                </div>

                <Button
                  submit
                  tone="critical"
                  loading={
                    isClearingAll
                  }
                  disabled={
                    clearConfirmation !==
                    "CLEAR"
                  }
                >
                  Clear all logs
                </Button>
              </InlineStack>
            </Form>
          </BlockStack>
        </Card>
      </BlockStack>

      <style>
        {`
          .logs-hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 30px;
            padding: 30px;
            border-radius: 18px;
            background:
              radial-gradient(
                circle at top right,
                rgba(45, 212, 191, 0.18),
                transparent 35%
              ),
              linear-gradient(
                135deg,
                #111827 0%,
                #1f2937 65%,
                #0f766e 150%
              );
            color: #ffffff;
            box-shadow:
              0 14px 34px
              rgba(17, 24, 39, 0.16);
          }

          .logs-hero > div:first-child {
            max-width: 700px;
          }

          .logs-hero-badge {
            display: inline-flex;
            padding: 6px 10px;
            border: 1px solid
              rgba(255, 255, 255, 0.2);
            border-radius: 999px;
            background:
              rgba(255, 255, 255, 0.08);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.07em;
            text-transform: uppercase;
          }

          .logs-hero h2 {
            margin: 16px 0 10px;
            font-size: clamp(
              25px,
              4vw,
              38px
            );
            line-height: 1.12;
            letter-spacing: -0.035em;
          }

          .logs-hero p {
            margin: 0;
            color:
              rgba(255, 255, 255, 0.75);
            font-size: 14px;
            line-height: 1.65;
          }

          .logs-hero-total {
            display: grid;
            min-width: 180px;
            padding: 20px;
            border: 1px solid
              rgba(255, 255, 255, 0.18);
            border-radius: 14px;
            background:
              rgba(255, 255, 255, 0.08);
          }

          .logs-hero-total span,
          .logs-hero-total small {
            color:
              rgba(255, 255, 255, 0.7);
            font-size: 12px;
          }

          .logs-hero-total strong {
            margin: 7px 0 2px;
            font-size: 31px;
            line-height: 1;
          }

          .logs-summary-grid {
            display: grid;
            grid-template-columns:
              repeat(
                5,
                minmax(0, 1fr)
              );
            gap: 14px;
          }

          .logs-summary-card {
            min-height: 130px;
            padding: 18px;
            border: 1px solid #e3e5e7;
            border-radius: 14px;
            background: #ffffff;
            box-shadow:
              0 5px 18px
              rgba(20, 25, 30, 0.045);
          }

          .logs-summary-card span,
          .logs-summary-card small,
          .logs-summary-card strong {
            display: block;
          }

          .logs-summary-card span {
            color: #6d7175;
            font-size: 12px;
            font-weight: 700;
          }

          .logs-summary-card strong {
            margin-top: 17px;
            color: #111827;
            font-size: 27px;
            line-height: 1;
          }

          .logs-summary-card small {
            margin-top: 9px;
            color: #8c9196;
            font-size: 11px;
          }

          .logs-summary-success {
            border-color: #a9d9bd;
            background: #f5fbf7;
          }

          .logs-summary-critical {
            border-color: #f2b8b5;
            background: #fff8f7;
          }

          .logs-table-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 16px 18px;
          }

          .logs-table-toolbar strong,
          .logs-table-toolbar span {
            display: block;
          }

          .logs-table-toolbar strong {
            color: #202223;
            font-size: 14px;
          }

          .logs-table-toolbar span {
            margin-top: 4px;
            color: #8c9196;
            font-size: 11px;
          }

          .logs-table-wrap {
            width: 100%;
            overflow-x: auto;
            border-top:
              1px solid #e3e5e7;
          }

          .logs-table {
            width: 100%;
            min-width: 1220px;
            border-collapse: collapse;
          }

          .logs-table th {
            padding: 12px 14px;
            border-bottom:
              1px solid #e3e5e7;
            background: #f6f6f7;
            color: #616161;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-align: left;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .logs-table td {
            padding: 14px;
            border-bottom:
              1px solid #ededed;
            color: #303030;
            font-size: 12px;
            vertical-align: middle;
          }

          .logs-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .logs-table tbody tr:hover {
            background: #fafbfb;
          }

          .logs-pincode,
          .logs-primary,
          .logs-secondary {
            display: block;
          }

          .logs-pincode {
            color: #111827;
            font-size: 13px;
          }

          .logs-primary {
            max-width: 190px;
            overflow: hidden;
            color: #303030;
            font-size: 11px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .logs-secondary {
            max-width: 190px;
            margin-top: 4px;
            overflow: hidden;
            color: #8c9196;
            font-size: 9px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .logs-source {
            display: inline-flex;
            padding: 4px 7px;
            border-radius: 999px;
            background: #f1f2f3;
            color: #616161;
            font-size: 9px;
            font-weight: 700;
            text-transform: capitalize;
            white-space: nowrap;
          }

          .logs-date {
            color: #616161;
            font-size: 10px;
            white-space: nowrap;
          }

          .logs-muted {
            color: #8c9196;
            font-size: 10px;
          }

          .logs-pagination {
            display: flex;
            justify-content: center;
            padding: 17px;
            border-top:
              1px solid #e3e5e7;
          }

          .logs-confirmation-field {
            width: min(
              100%,
              360px
            );
          }

          @media (
            max-width: 1100px
          ) {
            .logs-summary-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }
          }

          @media (
            max-width: 700px
          ) {
            .logs-hero {
              align-items: flex-start;
              flex-direction: column;
              padding: 24px 20px;
            }

            .logs-hero-total {
              width: 100%;
              min-width: 0;
            }

            .logs-summary-grid {
              grid-template-columns: 1fr;
            }

            .logs-table-toolbar {
              align-items: stretch;
              flex-direction: column;
            }

            .logs-confirmation-field {
              width: 100%;
            }
          }
        `}
      </style>
        </Page>
  </AppProvider>
  );
}