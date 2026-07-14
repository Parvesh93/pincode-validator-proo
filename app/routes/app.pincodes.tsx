import type { CSSProperties } from "react";
import {
  Form,
  Link,
  data,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";

import { authenticate } from "../shopify.server";
import {
  bulkDeletePincodes,
  bulkUpdatePincodeStatus,
  deletePincode,
  getOrCreateShopByDomain,
  getPaginatedPincodes,
  getPincodeById,
  updatePincode,
  upsertSinglePincode,
} from "../lib/pincode.server";

type ActionData = {
  error?: string;
  success?: string;
};

type Pincode = {
  id: string;
  pincode: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  prepaidAvailable?: boolean | null;
  codAvailable?: boolean | null;
  estDeliveryDays?: number | null;
  isActive?: boolean | null;
};

function toBool(
  value: FormDataEntryValue | null,
) {
  return (
    value === "on" ||
    value === "true"
  );
}

function validatePincode(
  pincode: string,
) {
  return /^[1-9][0-9]{5}$/.test(
    pincode,
  );
}

function parseDeliveryDays(
  value: string,
) {
  if (!value) {
    return {
      value: null,
      error: null,
    };
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 0 ||
    parsed > 365
  ) {
    return {
      value: null,
      error:
        "ETA days must be a whole number between 0 and 365.",
    };
  }

  return {
    value: parsed,
    error: null,
  };
}

function getSelectedIds(
  formData: FormData,
) {
  return formData
    .getAll("selectedIds")
    .map(String)
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { session } =
    await authenticate.admin(request);

  const url = new URL(request.url);

  const search =
    url.searchParams
      .get("search")
      ?.trim() || "";

  const editId =
    url.searchParams
      .get("edit")
      ?.trim() || "";

  const requestedPage = Number(
    url.searchParams.get("page") ||
      "1",
  );

  const page =
    Number.isInteger(
      requestedPage,
    ) && requestedPage > 0
      ? requestedPage
      : 1;

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

  const [
    paginationResult,
    editingRow,
  ] = await Promise.all([
    getPaginatedPincodes({
      shopId: shop.id,
      search,
      page,
      pageSize: 25,
    }),
    editId
      ? getPincodeById(
          editId,
          shop.id,
        )
      : Promise.resolve(null),
  ]);

  return data({
    pincodes:
      paginationResult.pincodes,
    search,
    pagination: {
      currentPage:
        paginationResult.currentPage,
      totalPages:
        paginationResult.totalPages,
      totalCount:
        paginationResult.totalCount,
      pageSize:
        paginationResult.pageSize,
    },
    editingRow,
  });
}

export async function action({
  request,
}: ActionFunctionArgs) {
  const { session } =
    await authenticate.admin(request);

  const formData =
    await request.formData();

  const intent = String(
    formData.get("intent") || "",
  );

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

  try {
    if (intent === "save") {
      const pincode = String(
        formData.get("pincode") ||
          "",
      ).trim();

      const city =
        String(
          formData.get("city") ||
            "",
        ).trim() || null;

      const state =
        String(
          formData.get("state") ||
            "",
        ).trim() || null;

      const country =
        String(
          formData.get("country") ||
            "",
        ).trim() || null;

      const deliveryDaysResult =
        parseDeliveryDays(
          String(
            formData.get(
              "estDeliveryDays",
            ) || "",
          ).trim(),
        );

      if (
        !validatePincode(pincode)
      ) {
        return data(
          {
            error:
              "Pincode must contain exactly six digits and cannot start with 0.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        deliveryDaysResult.error
      ) {
        return data(
          {
            error:
              deliveryDaysResult.error,
          },
          {
            status: 400,
          },
        );
      }

      await upsertSinglePincode({
        shopId: shop.id,
        pincode,
        city,
        state,
        country,
        codAvailable: toBool(
          formData.get(
            "codAvailable",
          ),
        ),
        prepaidAvailable: toBool(
          formData.get(
            "prepaidAvailable",
          ),
        ),
        estDeliveryDays:
          deliveryDaysResult.value,
        isActive: toBool(
          formData.get(
            "isActive",
          ),
        ),
        source: "manual",
      });

      return data({
        success: `Pincode ${pincode} saved successfully.`,
      });
    }

    if (intent === "update") {
      const id = String(
        formData.get("id") || "",
      ).trim();

      const pincode = String(
        formData.get("pincode") ||
          "",
      ).trim();

      const city =
        String(
          formData.get("city") ||
            "",
        ).trim() || null;

      const state =
        String(
          formData.get("state") ||
            "",
        ).trim() || null;

      const country =
        String(
          formData.get("country") ||
            "",
        ).trim() || null;

      const deliveryDaysResult =
        parseDeliveryDays(
          String(
            formData.get(
              "estDeliveryDays",
            ) || "",
          ).trim(),
        );

      if (!id) {
        return data(
          {
            error:
              "Missing record ID.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        !validatePincode(pincode)
      ) {
        return data(
          {
            error:
              "Pincode must contain exactly six digits and cannot start with 0.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        deliveryDaysResult.error
      ) {
        return data(
          {
            error:
              deliveryDaysResult.error,
          },
          {
            status: 400,
          },
        );
      }

      await updatePincode(
        id,
        shop.id,
        {
          pincode,
          city,
          state,
          country,
          codAvailable: toBool(
            formData.get(
              "codAvailable",
            ),
          ),
          prepaidAvailable: toBool(
            formData.get(
              "prepaidAvailable",
            ),
          ),
          estDeliveryDays:
            deliveryDaysResult.value,
          isActive: toBool(
            formData.get(
              "isActive",
            ),
          ),
          source: "manual",
        },
      );

      return data({
        success: `Pincode ${pincode} updated successfully.`,
      });
    }

    if (
      intent.startsWith(
        "delete:",
      )
    ) {
      const id = intent
        .replace("delete:", "")
        .trim();

      if (!id) {
        return data(
          {
            error:
              "Missing record ID.",
          },
          {
            status: 400,
          },
        );
      }

      await deletePincode(
        id,
        shop.id,
      );

      return data({
        success:
          "Pincode deleted successfully.",
      });
    }

    if (
      intent === "bulk-activate"
    ) {
      const ids =
        getSelectedIds(formData);

      if (!ids.length) {
        return data(
          {
            error:
              "Please select at least one pincode to activate.",
          },
          {
            status: 400,
          },
        );
      }

      const result =
        await bulkUpdatePincodeStatus(
          ids,
          shop.id,
          true,
        );

      return data({
        success: `${result.count} pincode(s) activated successfully.`,
      });
    }

    if (
      intent ===
      "bulk-deactivate"
    ) {
      const ids =
        getSelectedIds(formData);

      if (!ids.length) {
        return data(
          {
            error:
              "Please select at least one pincode to deactivate.",
          },
          {
            status: 400,
          },
        );
      }

      const result =
        await bulkUpdatePincodeStatus(
          ids,
          shop.id,
          false,
        );

      return data({
        success: `${result.count} pincode(s) deactivated successfully.`,
      });
    }

    if (
      intent === "bulk-delete"
    ) {
      const ids =
        getSelectedIds(formData);

      if (!ids.length) {
        return data(
          {
            error:
              "Please select at least one pincode to delete.",
          },
          {
            status: 400,
          },
        );
      }

      const result =
        await bulkDeletePincodes(
          ids,
          shop.id,
        );

      return data({
        success: `${result.count} pincode(s) deleted successfully.`,
      });
    }

    return data(
      {
        error: "Invalid action.",
      },
      {
        status: 400,
      },
    );
  } catch (error: unknown) {
    console.error(
      "Pincode management action failed:",
      error,
    );

    return data(
      {
        error:
          "The requested operation could not be completed. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}

function StatusBadge({
  enabled,
  enabledText,
  disabledText,
}: {
  enabled: boolean;
  enabledText: string;
  disabledText: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 9px",
        borderRadius: "999px",
        background: enabled
          ? "#e8f5ee"
          : "#f1f2f3",
        color: enabled
          ? "#087a44"
          : "#616161",
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: enabled
            ? "#008060"
            : "#8c9196",
        }}
      />

      {enabled
        ? enabledText
        : disabledText}
    </span>
  );
}

export default function PincodesPage() {
  const loaderData =
    useLoaderData<typeof loader>();

  const pincodes = (
    loaderData.pincodes || []
  ) as Pincode[];

  const search =
    loaderData.search || "";

  const pagination =
    loaderData.pagination;

  const currentPage =
    pagination.currentPage;

  const totalPages =
    pagination.totalPages;

  const totalCount =
    pagination.totalCount;

  const pageSize =
    pagination.pageSize;

  const editingRow =
    loaderData.editingRow as Pincode | null;

  const actionData =
    useActionData<typeof action>() as
      | ActionData
      | undefined;

  const navigation =
    useNavigation();

  const isSubmitting =
    navigation.state ===
    "submitting";

  const firstVisibleRecord =
    totalCount === 0
      ? 0
      : (currentPage - 1) *
          pageSize +
        1;

  const lastVisibleRecord =
    Math.min(
      currentPage * pageSize,
      totalCount,
    );

  function getPageUrl(
    pageNumber: number,
  ) {
    const params =
      new URLSearchParams();

    if (search) {
      params.set(
        "search",
        search,
      );
    }

    params.set(
      "page",
      String(pageNumber),
    );

    return `/app/pincodes?${params.toString()}`;
  }

  function getEditUrl(
    id: string,
  ) {
    const params =
      new URLSearchParams();

    if (search) {
      params.set(
        "search",
        search,
      );
    }

    params.set(
      "page",
      String(currentPage),
    );

    params.set("edit", id);

    return `/app/pincodes?${params.toString()}`;
  }

  return (
    <s-page heading="Manage pincodes">
      <div className="pincode-page">
        <section className="pincode-intro-card">
          <div>
            <h2 className="pincode-section-title">
              Delivery serviceability
            </h2>

            <p className="pincode-section-description">
              Add, edit and manage
              the postal codes where
              your store can deliver
              orders.
            </p>
          </div>

          <span className="pincode-count-badge">
            {totalCount}{" "}
            {totalCount === 1
              ? "pincode"
              : "pincodes"}
          </span>
        </section>

        {actionData?.error ? (
          <div
            role="alert"
            style={errorBox}
          >
            {actionData.error}
          </div>
        ) : null}

        {actionData?.success ? (
          <div
            role="status"
            style={successBox}
          >
            {actionData.success}
          </div>
        ) : null}

        <section className="pincode-card pincode-form-card">
          <div className="pincode-card-header">
            <div>
              <h2 className="pincode-card-title">
                {editingRow
                  ? `Edit ${editingRow.pincode}`
                  : "Add a pincode"}
              </h2>

              <p className="pincode-card-description">
                Configure delivery
                availability, payment
                methods and estimated
                delivery time.
              </p>
            </div>

            {editingRow ? (
              <span className="editing-badge">
                Editing record
              </span>
            ) : null}
          </div>

          <Form method="post">
            <div className="pincode-card-body">
              <input
                type="hidden"
                name="intent"
                value={
                  editingRow
                    ? "update"
                    : "save"
                }
              />

              {editingRow ? (
                <input
                  type="hidden"
                  name="id"
                  value={
                    editingRow.id
                  }
                />
              ) : null}

              <div className="pincode-form-grid">
                <div>
                  <label
                    htmlFor="pincode"
                    style={fieldLabel}
                  >
                    Pincode
                  </label>

                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    defaultValue={
                      editingRow?.pincode ||
                      ""
                    }
                    placeholder="110001"
                    maxLength={6}
                    pattern="[1-9][0-9]{5}"
                    style={premiumInput}
                    required
                  />

                  <p style={fieldHelp}>
                    Enter a valid
                    six-digit Indian
                    postal code.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="estDeliveryDays"
                    style={fieldLabel}
                  >
                    Estimated delivery
                    time
                  </label>

                  <div
                    style={{
                      position:
                        "relative",
                    }}
                  >
                    <input
                      id="estDeliveryDays"
                      name="estDeliveryDays"
                      type="number"
                      min="0"
                      max="365"
                      step="1"
                      defaultValue={
                        editingRow
                          ?.estDeliveryDays ??
                        ""
                      }
                      placeholder="3"
                      style={{
                        ...premiumInput,
                        paddingRight:
                          "65px",
                      }}
                    />

                    <span className="input-suffix">
                      days
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="city"
                    style={fieldLabel}
                  >
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    defaultValue={
                      editingRow?.city ||
                      ""
                    }
                    placeholder="Delhi"
                    style={premiumInput}
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    style={fieldLabel}
                  >
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    defaultValue={
                      editingRow?.state ||
                      ""
                    }
                    placeholder="Delhi"
                    style={premiumInput}
                  />
                </div>

                <div>
                  <label
                    htmlFor="country"
                    style={fieldLabel}
                  >
                    Country
                  </label>

                  <input
                    id="country"
                    name="country"
                    type="text"
                    defaultValue={
                      editingRow
                        ?.country ||
                      "India"
                    }
                    placeholder="India"
                    style={premiumInput}
                  />
                </div>
              </div>

              <div className="availability-box">
                <h3 className="availability-title">
                  Availability settings
                </h3>

                <div className="availability-grid">
                  <label
                    style={optionCard}
                  >
                    <input
                      type="checkbox"
                      name="prepaidAvailable"
                      defaultChecked={
                        editingRow
                          ? !!editingRow.prepaidAvailable
                          : true
                      }
                    />

                    <span>
                      <strong
                        style={
                          optionTitle
                        }
                      >
                        Delivery
                        available
                      </strong>

                      <span
                        style={
                          optionDescription
                        }
                      >
                        Allow prepaid
                        delivery to this
                        pincode.
                      </span>
                    </span>
                  </label>

                  <label
                    style={optionCard}
                  >
                    <input
                      type="checkbox"
                      name="codAvailable"
                      defaultChecked={
                        editingRow
                          ? !!editingRow.codAvailable
                          : false
                      }
                    />

                    <span>
                      <strong
                        style={
                          optionTitle
                        }
                      >
                        COD available
                      </strong>

                      <span
                        style={
                          optionDescription
                        }
                      >
                        Allow cash on
                        delivery orders.
                      </span>
                    </span>
                  </label>

                  <label
                    style={optionCard}
                  >
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={
                        editingRow
                          ? !!editingRow.isActive
                          : true
                      }
                    />

                    <span>
                      <strong
                        style={
                          optionTitle
                        }
                      >
                        Active
                      </strong>

                      <span
                        style={
                          optionDescription
                        }
                      >
                        Include this
                        record in
                        storefront
                        validation.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={
                    isSubmitting
                  }
                  style={{
                    ...primaryButton,
                    opacity:
                      isSubmitting
                        ? 0.65
                        : 1,
                    cursor:
                      isSubmitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingRow
                      ? "Update pincode"
                      : "Save pincode"}
                </button>

                {editingRow ? (
                  <Link
                    to={getPageUrl(
                      currentPage,
                    )}
                    style={
                      secondaryButton
                    }
                  >
                    Cancel editing
                  </Link>
                ) : null}
              </div>
            </div>
          </Form>
        </section>

        <section className="pincode-card">
          <div className="saved-header">
            <div>
              <h2 className="pincode-card-title">
                Saved pincodes
              </h2>

              <p className="pincode-card-description">
                Search, edit and
                manage your current
                serviceability
                records.
              </p>
            </div>

            <Form
              method="get"
              className="search-form"
            >
              <input
                type="hidden"
                name="page"
                value="1"
              />

              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search by pincode, city or state"
                aria-label="Search saved pincodes"
                style={searchInput}
              />

              <button
                type="submit"
                style={
                  secondaryButton
                }
              >
                Search
              </button>

              {search ? (
                <Link
                  to="/app/pincodes"
                  style={
                    secondaryButton
                  }
                >
                  Clear
                </Link>
              ) : null}
            </Form>
          </div>

          <Form method="post">
            <div className="table-wrapper">
              <table className="pincode-table">
                <thead>
                  <tr>
                    <th
                      style={
                        checkboxHeaderStyle
                      }
                    >
                      <span className="visually-hidden">
                        Select
                      </span>
                    </th>

                    <th style={thStyle}>
                      Pincode
                    </th>

                    <th style={thStyle}>
                      Location
                    </th>

                    <th style={thStyle}>
                      Delivery
                    </th>

                    <th style={thStyle}>
                      COD
                    </th>

                    <th style={thStyle}>
                      ETA
                    </th>

                    <th style={thStyle}>
                      Status
                    </th>

                    <th
                      style={
                        actionHeaderStyle
                      }
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pincodes.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="empty-table-cell"
                      >
                        <div className="empty-state">
                          <div className="empty-state-icon">
                            #
                          </div>

                          <h3>
                            {search
                              ? "No matching pincodes"
                              : "No pincodes added yet"}
                          </h3>

                          <p>
                            {search
                              ? "Try changing your search term or clear the search."
                              : "Add your first pincode using the form above or import a CSV file."}
                          </p>

                          {search ? (
                            <Link
                              to="/app/pincodes"
                              style={
                                secondaryButton
                              }
                            >
                              Clear
                              search
                            </Link>
                          ) : (
                            <Link
                              to="/app/import"
                              style={
                                secondaryButton
                              }
                            >
                              Import CSV
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pincodes.map(
                      (item) => (
                        <tr
                          key={
                            item.id
                          }
                        >
                          <td
                            style={
                              checkboxCellStyle
                            }
                          >
                            <input
                              type="checkbox"
                              name="selectedIds"
                              value={
                                item.id
                              }
                              aria-label={`Select pincode ${item.pincode}`}
                            />
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <strong className="pincode-number">
                              {
                                item.pincode
                              }
                            </strong>
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <div className="location-primary">
                              {item.city ||
                                "No city"}
                            </div>

                            <div className="location-secondary">
                              {[
                                item.state,
                                item.country,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  ", ",
                                ) ||
                                "Location not set"}
                            </div>
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <StatusBadge
                              enabled={
                                !!item.prepaidAvailable
                              }
                              enabledText="Available"
                              disabledText="Unavailable"
                            />
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <StatusBadge
                              enabled={
                                !!item.codAvailable
                              }
                              enabledText="Available"
                              disabledText="Unavailable"
                            />
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {item.estDeliveryDays !=
                            null ? (
                              <span className="eta-text">
                                {
                                  item.estDeliveryDays
                                }{" "}
                                {item.estDeliveryDays ===
                                1
                                  ? "day"
                                  : "days"}
                              </span>
                            ) : (
                              <span className="muted-text">
                                Not set
                              </span>
                            )}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <StatusBadge
                              enabled={
                                !!item.isActive
                              }
                              enabledText="Active"
                              disabledText="Inactive"
                            />
                          </td>

                          <td
                            style={
                              actionCellStyle
                            }
                          >
                            <div className="row-actions">
                              <Link
                                to={getEditUrl(
                                  item.id,
                                )}
                                style={
                                  compactSecondaryButton
                                }
                              >
                                Edit
                              </Link>

                              <button
                                type="submit"
                                name="intent"
                                value={`delete:${item.id}`}
                                style={
                                  compactDangerButton
                                }
                                onClick={(
                                  event,
                                ) => {
                                  const confirmed =
                                    window.confirm(
                                      `Delete pincode ${item.pincode}?`,
                                    );

                                  if (
                                    !confirmed
                                  ) {
                                    event.preventDefault();
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>

            {totalCount > 0 ? (
              <div className="pagination-bar">
                <div className="pagination-summary">
                  Showing{" "}
                  <strong>
                    {
                      firstVisibleRecord
                    }
                    –
                    {
                      lastVisibleRecord
                    }
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {totalCount}
                  </strong>{" "}
                  pincodes
                </div>

                <div className="pagination-controls">
                  {currentPage >
                  1 ? (
                    <Link
                      to={getPageUrl(
                        currentPage -
                          1,
                      )}
                      className="pagination-button"
                      aria-label="Go to previous page"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span
                      className="pagination-button pagination-button-disabled"
                      aria-disabled="true"
                    >
                      Previous
                    </span>
                  )}

                  <span className="pagination-current">
                    Page{" "}
                    {currentPage} of{" "}
                    {totalPages}
                  </span>

                  {currentPage <
                  totalPages ? (
                    <Link
                      to={getPageUrl(
                        currentPage +
                          1,
                      )}
                      className="pagination-button"
                      aria-label="Go to next page"
                    >
                      Next
                    </Link>
                  ) : (
                    <span
                      className="pagination-button pagination-button-disabled"
                      aria-disabled="true"
                    >
                      Next
                    </span>
                  )}
                </div>
              </div>
            ) : null}

            {pincodes.length >
            0 ? (
              <div className="bulk-action-bar">
                <div className="bulk-action-copy">
                  <strong>
                    Bulk actions
                  </strong>

                  <span>
                    Select one or more
                    records from the
                    current page.
                  </span>
                </div>

                <div className="bulk-action-buttons">
                  <button
                    type="submit"
                    name="intent"
                    value="bulk-activate"
                    style={
                      activateButton
                    }
                  >
                    Activate selected
                  </button>

                  <button
                    type="submit"
                    name="intent"
                    value="bulk-deactivate"
                    style={
                      deactivateButton
                    }
                  >
                    Deactivate selected
                  </button>

                  <button
                    type="submit"
                    name="intent"
                    value="bulk-delete"
                    style={
                      dangerButton
                    }
                    onClick={(
                      event,
                    ) => {
                      const confirmed =
                        window.confirm(
                          "Delete all selected pincodes?",
                        );

                      if (
                        !confirmed
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    Delete selected
                  </button>
                </div>
              </div>
            ) : null}
          </Form>
        </section>
      </div>

      <style>
        {`
          .pincode-page {
            display: grid;
            gap: 20px;
            padding-bottom: 36px;
          }

          .pincode-intro-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
            padding: 24px;
            border: 1px solid #e3e5e7;
            border-radius: 16px;
            background: #ffffff;
            box-shadow: 0 4px 18px rgba(20, 25, 30, 0.04);
          }

          .pincode-section-title,
          .pincode-card-title {
            margin: 0;
            color: #202223;
            font-size: 20px;
            font-weight: 700;
          }

          .pincode-section-description,
          .pincode-card-description {
            margin: 6px 0 0;
            color: #6d7175;
            font-size: 14px;
            line-height: 1.55;
          }

          .pincode-count-badge,
          .editing-badge {
            display: inline-flex;
            align-items: center;
            padding: 7px 11px;
            border-radius: 999px;
            background: #eef4ff;
            color: #254f9c;
            font-size: 12px;
            font-weight: 700;
          }

          .pincode-card {
            overflow: hidden;
            border: 1px solid #e3e5e7;
            border-radius: 16px;
            background: #ffffff;
            box-shadow: 0 4px 18px rgba(20, 25, 30, 0.04);
          }

          .pincode-card-header,
          .saved-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
            padding: 22px 24px;
            border-bottom: 1px solid #ebebeb;
            background: #fafbfb;
          }

          .pincode-card-body {
            padding: 24px;
          }

          .pincode-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .input-suffix {
            position: absolute;
            top: 50%;
            right: 14px;
            transform: translateY(-50%);
            color: #6d7175;
            font-size: 13px;
            pointer-events: none;
          }

          .availability-box {
            margin-top: 24px;
            padding: 20px;
            border: 1px solid #e3e5e7;
            border-radius: 14px;
            background: #fafbfb;
          }

          .availability-title {
            margin: 0 0 15px;
            color: #202223;
            font-size: 15px;
            font-weight: 700;
          }

          .availability-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 12px;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 24px;
          }

          .saved-header {
            background: #ffffff;
          }

          .search-form {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .table-wrapper {
            width: 100%;
            overflow-x: auto;
          }

          .pincode-table {
            width: 100%;
            min-width: 900px;
            border-collapse: collapse;
            font-size: 14px;
          }

          .pincode-table thead {
            background: #f6f6f7;
          }

          .pincode-table tbody tr {
            border-top: 1px solid #ededed;
            transition: background 0.15s ease;
          }

          .pincode-table tbody tr:hover {
            background: #fafbfb;
          }

          .pincode-number {
            color: #202223;
            font-size: 14px;
            font-weight: 750;
          }

          .location-primary {
            color: #303030;
            font-size: 14px;
            font-weight: 600;
          }

          .location-secondary {
            margin-top: 3px;
            color: #8c9196;
            font-size: 12px;
          }

          .eta-text {
            color: #303030;
            font-size: 13px;
            font-weight: 600;
          }

          .muted-text {
            color: #8c9196;
            font-size: 13px;
          }

          .row-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            flex-wrap: wrap;
          }

          .pagination-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            padding: 16px 24px;
            border-top: 1px solid #e3e5e7;
            background: #ffffff;
          }

          .pagination-summary {
            color: #6d7175;
            font-size: 13px;
          }

          .pagination-summary strong {
            color: #303030;
            font-weight: 700;
          }

          .pagination-controls {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .pagination-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 34px;
            padding: 7px 13px;
            border: 1px solid #babfc3;
            border-radius: 8px;
            background: #ffffff;
            color: #202223;
            font-size: 13px;
            font-weight: 600;
            line-height: 1;
            text-decoration: none;
            transition:
              background 0.15s ease,
              border-color 0.15s ease;
          }

          .pagination-button:hover {
            border-color: #8c9196;
            background: #f6f6f7;
          }

          .pagination-button-disabled {
            border-color: #e1e3e5;
            background: #f6f6f7;
            color: #a5a9ad;
            cursor: not-allowed;
          }

          .pagination-current {
            min-width: 100px;
            color: #303030;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
          }

          .bulk-action-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
            padding: 16px 24px;
            border-top: 1px solid #e3e5e7;
            background: #fafbfb;
          }

          .bulk-action-copy strong {
            display: block;
            color: #303030;
            font-size: 13px;
          }

          .bulk-action-copy span {
            display: block;
            margin-top: 3px;
            color: #8c9196;
            font-size: 12px;
          }

          .bulk-action-buttons {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
            flex-wrap: wrap;
          }

          .empty-table-cell {
            padding: 50px 20px;
            text-align: center;
          }

          .empty-state {
            max-width: 420px;
            margin: 0 auto;
          }

          .empty-state-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 52px;
            height: 52px;
            margin-bottom: 14px;
            border-radius: 14px;
            background: #eef4ff;
            color: #254f9c;
            font-size: 23px;
            font-weight: 800;
          }

          .empty-state h3 {
            margin: 0;
            color: #202223;
            font-size: 17px;
          }

          .empty-state p {
            margin: 8px 0 18px;
            color: #6d7175;
            font-size: 14px;
            line-height: 1.6;
          }

          .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }

          input:focus {
            border-color: #005bd3 !important;
            box-shadow: 0 0 0 1px #005bd3;
            outline: none;
          }

          @media (max-width: 700px) {
            .pincode-form-grid {
              grid-template-columns: 1fr;
            }

            .pincode-card-body,
            .pincode-card-header,
            .saved-header,
            .pincode-intro-card {
              padding-left: 18px;
              padding-right: 18px;
            }

            .search-form {
              width: 100%;
            }

            .search-form input {
              width: 100% !important;
              flex: 1 1 100%;
            }

            .form-actions > * {
              width: 100%;
              text-align: center;
              box-sizing: border-box;
            }

            .pagination-bar {
              align-items: stretch;
              padding-left: 18px;
              padding-right: 18px;
            }

            .pagination-summary {
              width: 100%;
              text-align: center;
            }

            .pagination-controls {
              width: 100%;
              justify-content: space-between;
            }

            .pagination-button {
              flex: 1;
            }

            .pagination-current {
              flex: 1.2;
            }

            .bulk-action-bar {
              align-items: stretch;
              padding-left: 18px;
              padding-right: 18px;
            }

            .bulk-action-copy {
              width: 100%;
            }

            .bulk-action-buttons {
              width: 100%;
              display: grid;
              grid-template-columns: 1fr;
            }

            .bulk-action-buttons button {
              width: 100%;
            }
          }
        `}
      </style>
    </s-page>
  );
}

const errorBox: CSSProperties = {
  padding: "14px 16px",
  border: "1px solid #f2b8b5",
  borderRadius: "12px",
  background: "#fff1f0",
  color: "#8e1f17",
  fontSize: "14px",
  fontWeight: 500,
};

const successBox: CSSProperties = {
  padding: "14px 16px",
  border: "1px solid #a9d9bd",
  borderRadius: "12px",
  background: "#edf9f1",
  color: "#08723f",
  fontSize: "14px",
  fontWeight: 500,
};

const fieldLabel: CSSProperties = {
  display: "block",
  marginBottom: "7px",
  color: "#303030",
  fontSize: "13px",
  fontWeight: 650,
};

const fieldHelp: CSSProperties = {
  margin: "6px 0 0",
  color: "#8c9196",
  fontSize: "12px",
  lineHeight: 1.4,
};

const premiumInput: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  padding: "10px 13px",
  border: "1px solid #c9cccf",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#202223",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const searchInput: CSSProperties = {
  width: "280px",
  minHeight: "40px",
  padding: "9px 12px",
  border: "1px solid #c9cccf",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#202223",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const optionCard: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "11px",
  padding: "14px",
  border: "1px solid #e3e5e7",
  borderRadius: "12px",
  background: "#ffffff",
  cursor: "pointer",
};

const optionTitle: CSSProperties = {
  display: "block",
  color: "#202223",
  fontSize: "13px",
  fontWeight: 700,
};

const optionDescription: CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#6d7175",
  fontSize: "12px",
  lineHeight: 1.45,
};

const thStyle: CSSProperties = {
  padding: "13px 12px",
  borderBottom: "1px solid #ddd",
  color: "#616161",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.02em",
  textAlign: "left",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const checkboxHeaderStyle: CSSProperties = {
  ...thStyle,
  width: "42px",
  textAlign: "center",
};

const actionHeaderStyle: CSSProperties = {
  ...thStyle,
  textAlign: "right",
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  color: "#303030",
  verticalAlign: "middle",
};

const checkboxCellStyle: CSSProperties = {
  ...tdStyle,
  width: "42px",
  textAlign: "center",
};

const actionCellStyle: CSSProperties = {
  ...tdStyle,
  textAlign: "right",
};

const primaryButton: CSSProperties = {
  minHeight: "40px",
  padding: "10px 16px",
  border: "1px solid #111827",
  borderRadius: "9px",
  background: "#111827",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 700,
  textDecoration: "none",
};

const secondaryButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  padding: "9px 14px",
  border: "1px solid #c9cccf",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#202223",
  fontSize: "13px",
  fontWeight: 650,
  cursor: "pointer",
  textDecoration: "none",
  boxSizing: "border-box",
};

const compactSecondaryButton: CSSProperties = {
  ...secondaryButton,
  minHeight: "34px",
  padding: "7px 11px",
  fontSize: "12px",
};

const activateButton: CSSProperties = {
  minHeight: "40px",
  padding: "9px 14px",
  border: "1px solid #008060",
  borderRadius: "9px",
  background: "#008060",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const deactivateButton: CSSProperties = {
  minHeight: "40px",
  padding: "9px 14px",
  border: "1px solid #8c9196",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#303030",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButton: CSSProperties = {
  minHeight: "40px",
  padding: "9px 14px",
  border: "1px solid #b42318",
  borderRadius: "9px",
  background: "#b42318",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const compactDangerButton: CSSProperties = {
  ...dangerButton,
  minHeight: "34px",
  padding: "7px 11px",
  fontSize: "12px",
};