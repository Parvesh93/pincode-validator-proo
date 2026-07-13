import type { CSSProperties } from "react";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  data,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { authenticate } from "../shopify.server";
import {
  bulkDeletePincodes,
  deletePincode,
  getOrCreateShopByDomain,
  getPincodesByShop,
  upsertSinglePincode,
  updatePincode,
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

function toBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function validatePincode(pincode: string) {
  return /^[0-9]{6}$/.test(pincode);
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  const shop = await getOrCreateShopByDomain(session.shop);
  const pincodes = await getPincodesByShop(shop.id, search);

  return data({
    pincodes,
    search,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  const shop = await getOrCreateShopByDomain(session.shop);

  try {
    if (intent === "save") {
      const pincode = String(formData.get("pincode") || "").trim();
      const city = String(formData.get("city") || "").trim() || null;
      const state = String(formData.get("state") || "").trim() || null;
      const country = String(formData.get("country") || "").trim() || null;
      const estDeliveryDaysRaw = String(formData.get("estDeliveryDays") || "").trim();

      if (!validatePincode(pincode)) {
        return data({ error: "Pincode must be exactly 6 digits." }, { status: 400 });
      }

      const estDeliveryDays =
        estDeliveryDaysRaw === "" ? null : Number(estDeliveryDaysRaw);

      if (
        estDeliveryDaysRaw !== "" &&
        (Number.isNaN(estDeliveryDays) || (estDeliveryDays !== null && estDeliveryDays < 0))
      ) {
        return data(
          { error: "ETA days must be a valid non-negative number." },
          { status: 400 },
        );
      }

      await upsertSinglePincode({
        shopId: shop.id,
        pincode,
        city,
        state,
        country,
        codAvailable: toBool(formData.get("codAvailable")),
        prepaidAvailable: toBool(formData.get("prepaidAvailable")),
        estDeliveryDays,
        isActive: toBool(formData.get("isActive")),
        source: "manual",
      });

      return data({ success: `Pincode ${pincode} saved successfully.` });
    }

    if (intent === "update") {
      const id = String(formData.get("id") || "");
      const pincode = String(formData.get("pincode") || "").trim();
      const city = String(formData.get("city") || "").trim() || null;
      const state = String(formData.get("state") || "").trim() || null;
      const country = String(formData.get("country") || "").trim() || null;
      const estDeliveryDaysRaw = String(formData.get("estDeliveryDays") || "").trim();

      if (!id) {
        return data({ error: "Missing record ID." }, { status: 400 });
      }

      if (!validatePincode(pincode)) {
        return data({ error: "Pincode must be exactly 6 digits." }, { status: 400 });
      }

      const estDeliveryDays =
        estDeliveryDaysRaw === "" ? null : Number(estDeliveryDaysRaw);

      if (
        estDeliveryDaysRaw !== "" &&
        (estDeliveryDays === null || Number.isNaN(estDeliveryDays) || estDeliveryDays < 0)
      ) {
        return data(
          { error: "ETA days must be a valid non-negative number." },
          { status: 400 },
        );
      }

      await updatePincode(id, shop.id, {
        pincode,
        city,
        state,
        country,
        codAvailable: toBool(formData.get("codAvailable")),
        prepaidAvailable: toBool(formData.get("prepaidAvailable")),
        estDeliveryDays,
        isActive: toBool(formData.get("isActive")),
        source: "manual",
      });

      return data({ success: `Pincode ${pincode} updated successfully.` });
    }

    if (intent === "delete") {
      const id = String(formData.get("id") || "");

      if (!id) {
        return data({ error: "Missing record ID." }, { status: 400 });
      }

      await deletePincode(id, shop.id);
      return data({ success: "Pincode deleted successfully." });
    }

    if (intent === "bulk-delete") {
      const ids = formData.getAll("selectedIds").map(String).filter(Boolean);

      if (!ids.length) {
        return data({ error: "Please select at least one pincode." }, { status: 400 });
      }

      const result = await bulkDeletePincodes(ids, shop.id);

      return data({
        success: `${result.count} pincode(s) deleted successfully.`,
      });
    }

    return data({ error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 },
    );
  }
}

export default function PincodesPage() {
  const loaderData = useLoaderData<typeof loader>();
  const pincodes = (loaderData.pincodes || []) as Pincode[];
  const search = (loaderData.search || "") as string;
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const isSubmitting = navigation.state === "submitting";
  const editId = searchParams.get("edit");

  const editingRow = editId ? pincodes.find((item) => item.id === editId) ?? null : null;

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
        Pincode Management
      </h1>
      <p style={{ marginBottom: "24px", color: "#555" }}>
        Add, edit, search, and delete serviceable pincodes for your store.
      </p>

      {actionData?.error ? (
        <div style={errorBox}>
          {actionData.error}
        </div>
      ) : null}

      {actionData?.success ? (
        <div style={successBox}>
          {actionData.success}
        </div>
      ) : null}

      <div style={cardStyle}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
          {editingRow ? "Edit pincode" : "Add pincode"}
        </h2>

        <Form method="post">
          <input
            type="hidden"
            name="intent"
            value={editingRow ? "update" : "save"}
          />
          {editingRow ? <input type="hidden" name="id" value={editingRow.id} /> : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label htmlFor="pincode">Pincode</label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                defaultValue={editingRow?.pincode || ""}
                placeholder="110001"
                maxLength={6}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label htmlFor="estDeliveryDays">ETA days</label>
              <input
                id="estDeliveryDays"
                name="estDeliveryDays"
                type="number"
                min="0"
                defaultValue={editingRow?.estDeliveryDays ?? ""}
                placeholder="3"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                type="text"
                defaultValue={editingRow?.city || ""}
                placeholder="Delhi"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="state">State</label>
              <input
                id="state"
                name="state"
                type="text"
                defaultValue={editingRow?.state || ""}
                placeholder="Delhi"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="country">Country</label>
              <input
                id="country"
                name="country"
                type="text"
                defaultValue={editingRow?.country || "India"}
                placeholder="India"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", marginTop: "16px", flexWrap: "wrap" }}>
            <label>
              <input
                type="checkbox"
                name="prepaidAvailable"
                defaultChecked={editingRow ? !!editingRow.prepaidAvailable : true}
              />{" "}
              Delivery available
            </label>

            <label>
              <input
                type="checkbox"
                name="codAvailable"
                defaultChecked={editingRow ? !!editingRow.codAvailable : false}
              />{" "}
              COD available
            </label>

            <label>
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={editingRow ? !!editingRow.isActive : true}
              />{" "}
              Active
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button type="submit" disabled={isSubmitting} style={primaryButton}>
              {isSubmitting
                ? "Saving..."
                : editingRow
                  ? "Update pincode"
                  : "Save pincode"}
            </button>

            {editingRow ? (
             <Link to="/app/pincodes" style={secondaryButton}>
  Cancel
</Link>
            ) : null}
          </div>
        </Form>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>
            Saved pincodes
          </h2>

          <Form method="get" style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search pincode"
              style={{ ...inputStyle, width: "220px", marginBottom: 0 }}
            />
            <button type="submit" style={secondaryButton}>
              Search
            </button>
            {search ? (
              <Link to="/app/pincodes" style={secondaryButton}>
  Clear
</Link>
            ) : null}
          </Form>
        </div>

        <Form method="post">
          <input type="hidden" name="intent" value="bulk-delete" />

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ background: "#f6f6f7" }}>
                  <th style={thStyle}></th>
                  <th style={thStyle}>Pincode</th>
                  <th style={thStyle}>City</th>
                  <th style={thStyle}>State</th>
                  <th style={thStyle}>Delivery</th>
                  <th style={thStyle}>COD</th>
                  <th style={thStyle}>ETA</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pincodes.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "16px", textAlign: "center", color: "#666" }}>
                      No pincodes found.
                    </td>
                  </tr>
                ) : (
                  pincodes.map((item) => (
                    <tr key={item.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={tdStyle}>
                        <input type="checkbox" name="selectedIds" value={item.id} />
                      </td>
                      <td style={tdStyle}>{item.pincode}</td>
                      <td style={tdStyle}>{item.city || "-"}</td>
                      <td style={tdStyle}>{item.state || "-"}</td>
                      <td style={tdStyle}>
                        {item.prepaidAvailable ? "Available" : "Unavailable"}
                      </td>
                      <td style={tdStyle}>
                        {item.codAvailable ? "Available" : "Unavailable"}
                      </td>
                      <td style={tdStyle}>
                        {item.estDeliveryDays != null
                          ? `${item.estDeliveryDays} day(s)`
                          : "-"}
                      </td>
                      <td style={tdStyle}>{item.isActive ? "Active" : "Inactive"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <Link
  to={`/app/pincodes?edit=${item.id}`}
  style={secondaryButton}
>
  Edit
</Link>

                          <Form method="post">
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="id" value={item.id} />
                            <button
                              type="submit"
                              style={dangerButton}
                              onClick={(e) => {
                                const ok = window.confirm(`Delete pincode ${item.pincode}?`);
                                if (!ok) e.preventDefault();
                              }}
                            >
                              Delete
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pincodes.length > 0 ? (
            <div style={{ marginTop: "16px" }}>
              <button
                type="submit"
                style={dangerButton}
                onClick={(e) => {
                  const ok = window.confirm("Delete all selected pincodes?");
                  if (!ok) e.preventDefault();
                }}
              >
                Delete selected
              </button>
            </div>
          ) : null}
        </Form>
      </div>
    </div>
  );
}

const cardStyle: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "24px",
  background: "#fff",
};

const errorBox: CSSProperties = {
  background: "#ffe8e8",
  color: "#a10000",
  padding: "12px 16px",
  borderRadius: "8px",
  marginBottom: "16px",
  border: "1px solid #f5b5b5",
};

const successBox: CSSProperties = {
  background: "#e8fff0",
  color: "#0a6a2f",
  padding: "12px 16px",
  borderRadius: "8px",
  marginBottom: "16px",
  border: "1px solid #a9e4bc",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  marginTop: "6px",
  marginBottom: "4px",
  boxSizing: "border-box",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  fontWeight: 600,
};

const tdStyle: CSSProperties = {
  padding: "12px",
  verticalAlign: "top",
};

const primaryButton: CSSProperties = {
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  textDecoration: "none",
};

const secondaryButton: CSSProperties = {
  background: "#fff",
  color: "#111827",
  border: "1px solid #d1d5db",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

const dangerButton: CSSProperties = {
  background: "#b91c1c",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  textDecoration: "none",
};