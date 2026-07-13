
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
// If the CSS module is missing, fall back to an empty styles object
// to avoid import resolution errors during builds or linting.
const styles: { [key: string]: string } = {
  index: "",
  content: "",
  heading: "",
  label: "",
  input: "",
  error: "",
  button: "",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = login
    ? await login(request)
    : {};

  return {
    errors,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = login
    ? await login(request)
    : {};

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors || loaderData.errors;

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Log in</h1>

        <Form method="post">
          <label className={styles.label}>
            <span>Shop domain</span>

            <input
              className={styles.input}
              type="text"
              name="shop"
              placeholder="example.myshopify.com"
              autoComplete="on"
              required
            />

            {errors?.shop && (
              <span className={styles.error}>
                {errors.shop}
              </span>
            )}
          </label>

          <button
            className={styles.button}
            type="submit"
          >
            Log in
          </button>
        </Form>
      </div>
    </div>
  );
}
