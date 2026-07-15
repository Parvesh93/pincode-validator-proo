import type {
  CSSProperties,
} from "react";

import {
  data,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";

import {
  getAnalyticsDashboardData,
} from "../lib/analytics.server";

import {
  getOrCreateShopByDomain,
} from "../lib/pincode.server";

import {
  authenticate,
} from "../shopify.server";

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { session } =
    await authenticate.admin(request);

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

  const analytics =
    await getAnalyticsDashboardData(
      shop.id,
    );

  return data({
    shopDomain: session.shop,
    analytics,
  });
}

type TrendItem = {
  date: string;
  label: string;
  total: number;
  successful: number;
  failed: number;
};

type BreakdownProps = {
  title: string;
  description: string;
  availableLabel: string;
  unavailableLabel: string;
  available: number;
  unavailable: number;
};

function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
  ).format(value);
}

function formatPercentage(
  value: number,
) {
  return `${value.toFixed(
    value % 1 === 0 ? 0 : 1,
  )}%`;
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
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function resultLabel(
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

function getChartPoints(
  values: number[],
  width: number,
  height: number,
  padding: number,
) {
  if (!values.length) {
    return "";
  }

  const maximum = Math.max(
    ...values,
    1,
  );

  const usableWidth =
    width - padding * 2;

  const usableHeight =
    height - padding * 2;

  return values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : padding +
            (index /
              (values.length - 1)) *
              usableWidth;

      const y =
        height -
        padding -
        (value / maximum) *
          usableHeight;

      return `${x.toFixed(
        2,
      )},${y.toFixed(2)}`;
    })
    .join(" ");
}

function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  tone?:
    | "neutral"
    | "success"
    | "critical"
    | "info";
}) {
  return (
    <article
      className={`analytics-metric analytics-metric-${tone}`}
    >
      <div className="analytics-metric-top">
        <span className="analytics-metric-label">
          {label}
        </span>

        <span
          className="analytics-metric-indicator"
          aria-hidden="true"
        />
      </div>

      <strong className="analytics-metric-value">
        {value}
      </strong>

      <span className="analytics-metric-helper">
        {helper}
      </span>
    </article>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="analytics-empty">
      <div
        className="analytics-empty-icon"
        aria-hidden="true"
      >
        ↗
      </div>

      <strong>{title}</strong>

      <p>{description}</p>
    </div>
  );
}

function RankBar({
  rank,
  label,
  value,
  maximum,
  secondary,
}: {
  rank: number;
  label: string;
  value: number;
  maximum: number;
  secondary?: string;
}) {
  const width =
    maximum > 0
      ? Math.max(
          4,
          (value / maximum) *
            100,
        )
      : 0;

  return (
    <div className="analytics-rank-row">
      <div className="analytics-rank-main">
        <span className="analytics-rank-number">
          {rank}
        </span>

        <div className="analytics-rank-content">
          <div className="analytics-rank-heading">
            <strong>
              {label}
            </strong>

            <span>
              {formatNumber(value)}
            </span>
          </div>

          <div className="analytics-rank-track">
            <span
              className="analytics-rank-fill"
              style={{
                width: `${width}%`,
              }}
            />
          </div>

          {secondary ? (
            <span className="analytics-rank-secondary">
              {secondary}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  description,
  availableLabel,
  unavailableLabel,
  available,
  unavailable,
}: BreakdownProps) {
  const total =
    available + unavailable;

  const availablePercentage =
    total > 0
      ? (available / total) *
        100
      : 0;

  const unavailablePercentage =
    total > 0
      ? (unavailable / total) *
        100
      : 0;

  const chartStyle = {
    "--available-percentage": `${availablePercentage}%`,
  } as CSSProperties;

  return (
    <article className="analytics-card analytics-breakdown-card">
      <div className="analytics-card-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          title="No data yet"
          description="This breakdown will appear after storefront validations are recorded."
        />
      ) : (
        <div className="analytics-breakdown-body">
          <div
            className="analytics-donut"
            style={chartStyle}
            role="img"
            aria-label={`${availableLabel}: ${formatPercentage(
              availablePercentage,
            )}. ${unavailableLabel}: ${formatPercentage(
              unavailablePercentage,
            )}.`}
          >
            <div className="analytics-donut-center">
              <strong>
                {formatPercentage(
                  availablePercentage,
                )}
              </strong>

              <span>
                {availableLabel}
              </span>
            </div>
          </div>

          <div className="analytics-legend">
            <div className="analytics-legend-row">
              <span className="analytics-legend-label">
                <span className="analytics-legend-dot analytics-legend-dot-success" />

                {availableLabel}
              </span>

              <strong>
                {formatNumber(
                  available,
                )}
              </strong>
            </div>

            <div className="analytics-legend-row">
              <span className="analytics-legend-label">
                <span className="analytics-legend-dot analytics-legend-dot-muted" />

                {unavailableLabel}
              </span>

              <strong>
                {formatNumber(
                  unavailable,
                )}
              </strong>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function TrendChart({
  trend,
}: {
  trend: TrendItem[];
}) {
  const width = 900;
  const height = 280;
  const padding = 28;

  const totalPoints =
    getChartPoints(
      trend.map(
        (item) => item.total,
      ),
      width,
      height,
      padding,
    );

  const successfulPoints =
    getChartPoints(
      trend.map(
        (item) =>
          item.successful,
      ),
      width,
      height,
      padding,
    );

  const maximum = Math.max(
    ...trend.map(
      (item) => item.total,
    ),
    1,
  );

  const gridLines = Array.from(
    { length: 5 },
    (_, index) => {
      const y =
        padding +
        ((height -
          padding * 2) /
          4) *
          index;

      const value = Math.round(
        maximum *
          (1 - index / 4),
      );

      return {
        y,
        value,
      };
    },
  );

  const hasData = trend.some(
    (item) => item.total > 0,
  );

  return (
    <article className="analytics-card analytics-trend-card">
      <div className="analytics-card-heading analytics-card-heading-responsive">
        <div>
          <h2>
            Validation trend
          </h2>

          <p>
            Daily storefront
            validations during the
            last 30 days.
          </p>
        </div>

        <div className="analytics-chart-legend">
          <span>
            <i className="analytics-chart-dot analytics-chart-dot-total" />
            Total
          </span>

          <span>
            <i className="analytics-chart-dot analytics-chart-dot-success" />
            Successful
          </span>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          title="No validation activity"
          description="Your 30-day trend chart will appear after customers begin checking pincodes."
        />
      ) : (
        <>
          <div className="analytics-chart-wrap">
            <svg
              className="analytics-chart"
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="Thirty-day validation trend chart"
              preserveAspectRatio="none"
            >
              {gridLines.map(
                (line) => (
                  <g
                    key={line.y}
                  >
                    <line
                      x1={padding}
                      x2={
                        width -
                        padding
                      }
                      y1={line.y}
                      y2={line.y}
                      className="analytics-chart-grid"
                    />

                    <text
                      x="2"
                      y={
                        line.y + 4
                      }
                      className="analytics-chart-label"
                    >
                      {line.value}
                    </text>
                  </g>
                ),
              )}

              <polyline
                points={
                  totalPoints
                }
                className="analytics-chart-line analytics-chart-line-total"
              />

              <polyline
                points={
                  successfulPoints
                }
                className="analytics-chart-line analytics-chart-line-success"
              />
            </svg>
          </div>

          <div className="analytics-chart-dates">
            {trend
              .filter(
                (
                  _item,
                  index,
                ) =>
                  index === 0 ||
                  index ===
                    trend.length -
                      1 ||
                  index % 7 === 0,
              )
              .map((item) => (
                <span
                  key={
                    item.date
                  }
                >
                  {item.label}
                </span>
              ))}
          </div>
        </>
      )}
    </article>
  );
}

export default function AnalyticsPage() {
  const {
    analytics,
    shopDomain,
  } =
    useLoaderData<typeof loader>();

  const {
    summary,
    dailyTrend,
    topPincodes,
    topCities,
    failedPincodes,
    recentValidations,
    availabilityBreakdown,
    codBreakdown,
    prepaidBreakdown,
  } = analytics;

  const maximumPincodeSearches =
    Math.max(
      ...topPincodes.map(
        (item) =>
          item.searches,
      ),
      1,
    );

  const maximumCitySearches =
    Math.max(
      ...topCities.map(
        (item) =>
          item.searches,
      ),
      1,
    );

  const maximumFailures =
    Math.max(
      ...failedPincodes.map(
        (item) =>
          item.failures,
      ),
      1,
    );

  return (
    <s-page heading="Analytics">
      <div className="analytics-page">
        <section className="analytics-hero">
          <div className="analytics-hero-content">
            <span className="analytics-hero-badge">
              Storefront intelligence
            </span>

            <h1>
              Understand where your
              customers want delivery
            </h1>

            <p>
              Track serviceability
              demand, successful
              validations, failed
              searches and payment
              availability for{" "}
              <strong>
                {shopDomain}
              </strong>
              .
            </p>
          </div>

          <div className="analytics-hero-summary">
            <span>
              Last 30 days
            </span>

            <strong>
              {formatNumber(
                summary.last30DaysValidations,
              )}
            </strong>

            <small>
              validation requests
            </small>
          </div>
        </section>

        <section
          className="analytics-metrics-grid"
          aria-label="Analytics overview"
        >
          <MetricCard
            label="Total validations"
            value={formatNumber(
              summary.totalValidations,
            )}
            helper="All-time storefront checks"
            tone="neutral"
          />

          <MetricCard
            label="Successful"
            value={formatNumber(
              summary.successfulValidations,
            )}
            helper="Serviceable validation requests"
            tone="success"
          />

          <MetricCard
            label="Failed"
            value={formatNumber(
              summary.failedValidations,
            )}
            helper="Unavailable or invalid checks"
            tone="critical"
          />

          <MetricCard
            label="Success rate"
            value={formatPercentage(
              summary.successRate,
            )}
            helper="Successful checks across all requests"
            tone="info"
          />

          <MetricCard
            label="Today's searches"
            value={formatNumber(
              summary.todayValidations,
            )}
            helper="Recorded since midnight UTC"
            tone="neutral"
          />

          <MetricCard
            label="Average delivery"
            value={
              summary.averageDeliveryDays ===
              null
                ? "—"
                : `${summary.averageDeliveryDays} days`
            }
            helper="Based on successful validations"
            tone="neutral"
          />
        </section>

        <TrendChart
          trend={dailyTrend}
        />

        <section className="analytics-breakdown-grid">
          <BreakdownCard
            title="Serviceability"
            description="Available versus unavailable validation requests."
            availableLabel="Available"
            unavailableLabel="Unavailable"
            available={
              availabilityBreakdown.available
            }
            unavailable={
              availabilityBreakdown.unavailable
            }
          />

          <BreakdownCard
            title="Cash on delivery"
            description="COD availability across successful validations."
            availableLabel="COD available"
            unavailableLabel="COD unavailable"
            available={
              codBreakdown.available
            }
            unavailable={
              codBreakdown.unavailable
            }
          />

          <BreakdownCard
            title="Prepaid delivery"
            description="Prepaid support across successful validations."
            availableLabel="Prepaid available"
            unavailableLabel="Prepaid unavailable"
            available={
              prepaidBreakdown.available
            }
            unavailable={
              prepaidBreakdown.unavailable
            }
          />
        </section>

        <section className="analytics-ranking-grid">
          <article className="analytics-card">
            <div className="analytics-card-heading">
              <div>
                <h2>
                  Top searched pincodes
                </h2>

                <p>
                  Pincodes receiving the
                  most customer interest.
                </p>
              </div>
            </div>

            {topPincodes.length ===
            0 ? (
              <EmptyState
                title="No pincode searches"
                description="Popular pincodes will appear after validation activity is recorded."
              />
            ) : (
              <div className="analytics-rank-list">
                {topPincodes.map(
                  (
                    item,
                    index,
                  ) => (
                    <RankBar
                      key={
                        item.pincode
                      }
                      rank={
                        index + 1
                      }
                      label={
                        item.pincode
                      }
                      value={
                        item.searches
                      }
                      maximum={
                        maximumPincodeSearches
                      }
                      secondary={`${formatNumber(
                        item.successful,
                      )} successful · ${formatNumber(
                        item.failed,
                      )} failed`}
                    />
                  ),
                )}
              </div>
            )}
          </article>

          <article className="analytics-card">
            <div className="analytics-card-heading">
              <div>
                <h2>
                  Top cities
                </h2>

                <p>
                  Cities generating the
                  most successful and
                  unsuccessful checks.
                </p>
              </div>
            </div>

            {topCities.length ===
            0 ? (
              <EmptyState
                title="No city data"
                description="City demand will appear when matching pincode records include location information."
              />
            ) : (
              <div className="analytics-rank-list">
                {topCities.map(
                  (
                    item,
                    index,
                  ) => (
                    <RankBar
                      key={
                        item.city
                      }
                      rank={
                        index + 1
                      }
                      label={
                        item.city
                      }
                      value={
                        item.searches
                      }
                      maximum={
                        maximumCitySearches
                      }
                    />
                  ),
                )}
              </div>
            )}
          </article>

          <article className="analytics-card">
            <div className="analytics-card-heading">
              <div>
                <h2>
                  Most failed pincodes
                </h2>

                <p>
                  Areas where customers
                  are requesting delivery
                  but cannot currently
                  order.
                </p>
              </div>
            </div>

            {failedPincodes.length ===
            0 ? (
              <EmptyState
                title="No failed searches"
                description="Unavailable pincode demand will appear here."
              />
            ) : (
              <div className="analytics-rank-list analytics-rank-list-critical">
                {failedPincodes.map(
                  (
                    item,
                    index,
                  ) => (
                    <RankBar
                      key={
                        item.pincode
                      }
                      rank={
                        index + 1
                      }
                      label={
                        item.pincode
                      }
                      value={
                        item.failures
                      }
                      maximum={
                        maximumFailures
                      }
                      secondary="Unavailable validations"
                    />
                  ),
                )}
              </div>
            )}
          </article>
        </section>

        <section className="analytics-card analytics-activity-card">
          <div className="analytics-card-heading analytics-card-heading-responsive">
            <div>
              <h2>
                Recent validation
                activity
              </h2>

              <p>
                The latest storefront
                pincode checks and their
                outcomes.
              </p>
            </div>

            <span className="analytics-record-count">
              Latest{" "}
              {recentValidations.length}
            </span>
          </div>

          {recentValidations.length ===
          0 ? (
            <EmptyState
              title="No recent activity"
              description="Customer validation requests will appear here after the storefront widget is used."
            />
          ) : (
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
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
                    <th>
                      COD
                    </th>
                    <th>
                      Prepaid
                    </th>
                    <th>
                      Delivery
                    </th>
                    <th>
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentValidations.map(
                    (item) => (
                      <tr
                        key={item.id}
                      >
                        <td>
                          <strong className="analytics-pincode">
                            {
                              item.pincode
                            }
                          </strong>

                          <span className="analytics-source">
                            {
                              item.source
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              item.isAvailable
                                ? "analytics-status analytics-status-success"
                                : "analytics-status analytics-status-error"
                            }
                          >
                            <i />

                            {resultLabel(
                              item.result,
                            )}
                          </span>
                        </td>

                        <td>
                          <strong className="analytics-table-primary">
                            {item.city ||
                              "Unknown"}
                          </strong>

                          <span className="analytics-table-secondary">
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
                              "No location"}
                          </span>
                        </td>

                        <td>
                          {item.productTitle ? (
                            <>
                              <strong className="analytics-table-primary">
                                {
                                  item.productTitle
                                }
                              </strong>

                              <span className="analytics-table-secondary">
                                {item.productHandle ||
                                  item.productId ||
                                  "Product"}
                              </span>
                            </>
                          ) : (
                            <span className="analytics-muted">
                              Not captured
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              item.codAvailable
                                ? "analytics-mini-status analytics-mini-status-success"
                                : "analytics-mini-status"
                            }
                          >
                            {item.codAvailable
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              item.prepaidAvailable
                                ? "analytics-mini-status analytics-mini-status-success"
                                : "analytics-mini-status"
                            }
                          >
                            {item.prepaidAvailable
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>

                        <td>
                          {item.estDeliveryDays !==
                          null ? (
                            <strong className="analytics-table-primary">
                              {
                                item.estDeliveryDays
                              }{" "}
                              {item.estDeliveryDays ===
                              1
                                ? "day"
                                : "days"}
                            </strong>
                          ) : (
                            <span className="analytics-muted">
                              —
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="analytics-date">
                            {formatDateTime(
                              item.createdAt,
                            )}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <style>
        {`
          .analytics-page {
            display: grid;
            gap: 20px;
            padding-bottom: 40px;
          }

          .analytics-hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 30px;
            padding: 30px;
            border-radius: 18px;
            background:
              radial-gradient(
                circle at top right,
                rgba(45, 212, 191, 0.2),
                transparent 36%
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

          .analytics-hero-content {
            max-width: 720px;
          }

          .analytics-hero-badge {
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

          .analytics-hero h1 {
            max-width: 680px;
            margin: 16px 0 10px;
            font-size: clamp(
              26px,
              4vw,
              39px
            );
            line-height: 1.12;
            letter-spacing: -0.035em;
          }

          .analytics-hero p {
            margin: 0;
            color:
              rgba(255, 255, 255, 0.75);
            font-size: 14px;
            line-height: 1.65;
          }

          .analytics-hero p strong {
            color: #ffffff;
          }

          .analytics-hero-summary {
            display: grid;
            min-width: 180px;
            padding: 20px;
            border: 1px solid
              rgba(255, 255, 255, 0.18);
            border-radius: 14px;
            background:
              rgba(255, 255, 255, 0.08);
          }

          .analytics-hero-summary span,
          .analytics-hero-summary small {
            color:
              rgba(255, 255, 255, 0.7);
            font-size: 12px;
          }

          .analytics-hero-summary strong {
            margin: 7px 0 2px;
            font-size: 31px;
            line-height: 1;
          }

          .analytics-metrics-grid {
            display: grid;
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );
            gap: 14px;
          }

          .analytics-metric {
            position: relative;
            overflow: hidden;
            min-height: 150px;
            padding: 20px;
            border: 1px solid #e3e5e7;
            border-radius: 15px;
            background: #ffffff;
            box-shadow:
              0 5px 18px
              rgba(20, 25, 30, 0.045);
          }

          .analytics-metric::after {
            position: absolute;
            right: -28px;
            bottom: -34px;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background:
              rgba(17, 24, 39, 0.035);
            content: "";
          }

          .analytics-metric-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .analytics-metric-label {
            color: #6d7175;
            font-size: 12px;
            font-weight: 700;
          }

          .analytics-metric-indicator {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #8c9196;
            box-shadow:
              0 0 0 4px
              rgba(140, 145, 150, 0.12);
          }

          .analytics-metric-value {
            position: relative;
            z-index: 1;
            display: block;
            margin-top: 18px;
            color: #111827;
            font-size: 29px;
            line-height: 1;
            letter-spacing: -0.03em;
          }

          .analytics-metric-helper {
            position: relative;
            z-index: 1;
            display: block;
            margin-top: 10px;
            color: #8c9196;
            font-size: 12px;
            line-height: 1.45;
          }

          .analytics-metric-success
          .analytics-metric-indicator {
            background: #008060;
            box-shadow:
              0 0 0 4px
              rgba(0, 128, 96, 0.12);
          }

          .analytics-metric-critical
          .analytics-metric-indicator {
            background: #c4320a;
            box-shadow:
              0 0 0 4px
              rgba(196, 50, 10, 0.12);
          }

          .analytics-metric-info
          .analytics-metric-indicator {
            background: #005bd3;
            box-shadow:
              0 0 0 4px
              rgba(0, 91, 211, 0.12);
          }

          .analytics-card {
            overflow: hidden;
            padding: 22px;
            border: 1px solid #e3e5e7;
            border-radius: 16px;
            background: #ffffff;
            box-shadow:
              0 5px 18px
              rgba(20, 25, 30, 0.045);
          }

          .analytics-card-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 21px;
          }

          .analytics-card-heading h2 {
            margin: 0;
            color: #111827;
            font-size: 18px;
            line-height: 1.3;
          }

          .analytics-card-heading p {
            margin: 6px 0 0;
            color: #8c9196;
            font-size: 12px;
            line-height: 1.55;
          }

          .analytics-trend-card {
            padding-bottom: 17px;
          }

          .analytics-chart-legend {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
          }

          .analytics-chart-legend span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #6d7175;
            font-size: 12px;
            font-weight: 650;
          }

          .analytics-chart-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .analytics-chart-dot-total {
            background: #005bd3;
          }

          .analytics-chart-dot-success {
            background: #008060;
          }

          .analytics-chart-wrap {
            width: 100%;
            overflow: hidden;
          }

          .analytics-chart {
            display: block;
            width: 100%;
            height: 280px;
            overflow: visible;
          }

          .analytics-chart-grid {
            stroke: #eceff1;
            stroke-width: 1;
          }

          .analytics-chart-label {
            fill: #8c9196;
            font-size: 10px;
          }

          .analytics-chart-line {
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-width: 3;
            vector-effect:
              non-scaling-stroke;
          }

          .analytics-chart-line-total {
            stroke: #005bd3;
          }

          .analytics-chart-line-success {
            stroke: #008060;
          }

          .analytics-chart-dates {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 8px 28px 0;
            color: #8c9196;
            font-size: 10px;
          }

          .analytics-breakdown-grid {
            display: grid;
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );
            gap: 14px;
          }

          .analytics-breakdown-body {
            display: flex;
            align-items: center;
            gap: 22px;
            padding-top: 3px;
          }

          .analytics-donut {
            display: grid;
            place-items: center;
            width: 128px;
            height: 128px;
            flex: 0 0 128px;
            border-radius: 50%;
            background:
              conic-gradient(
                #008060 0
                  var(
                    --available-percentage
                  ),
                #e3e5e7
                  var(
                    --available-percentage
                  )
                  100%
              );
          }

          .analytics-donut-center {
            display: grid;
            place-items: center;
            width: 88px;
            height: 88px;
            border-radius: 50%;
            background: #ffffff;
          }

          .analytics-donut-center strong {
            color: #111827;
            font-size: 21px;
          }

          .analytics-donut-center span {
            max-width: 72px;
            margin-top: -14px;
            color: #8c9196;
            font-size: 9px;
            text-align: center;
          }

          .analytics-legend {
            display: grid;
            flex: 1;
            gap: 12px;
          }

          .analytics-legend-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .analytics-legend-label {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #6d7175;
            font-size: 11px;
          }

          .analytics-legend-row strong {
            color: #303030;
            font-size: 12px;
          }

          .analytics-legend-dot {
            width: 8px;
            height: 8px;
            flex-shrink: 0;
            border-radius: 50%;
          }

          .analytics-legend-dot-success {
            background: #008060;
          }

          .analytics-legend-dot-muted {
            background: #c9cccf;
          }

          .analytics-ranking-grid {
            display: grid;
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );
            gap: 14px;
          }

          .analytics-rank-list {
            display: grid;
            gap: 18px;
          }

          .analytics-rank-main {
            display: flex;
            align-items: flex-start;
            gap: 11px;
          }

          .analytics-rank-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 25px;
            height: 25px;
            flex: 0 0 25px;
            border-radius: 8px;
            background: #f2f7ff;
            color: #005bd3;
            font-size: 11px;
            font-weight: 800;
          }

          .analytics-rank-content {
            min-width: 0;
            flex: 1;
          }

          .analytics-rank-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .analytics-rank-heading strong {
            overflow: hidden;
            color: #303030;
            font-size: 13px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .analytics-rank-heading span {
            color: #6d7175;
            font-size: 12px;
            font-weight: 700;
          }

          .analytics-rank-track {
            height: 6px;
            margin-top: 8px;
            overflow: hidden;
            border-radius: 999px;
            background: #eceff1;
          }

          .analytics-rank-fill {
            display: block;
            height: 100%;
            border-radius: inherit;
            background:
              linear-gradient(
                90deg,
                #005bd3,
                #3b82f6
              );
          }

          .analytics-rank-list-critical
          .analytics-rank-fill {
            background:
              linear-gradient(
                90deg,
                #c4320a,
                #ef4444
              );
          }

          .analytics-rank-list-critical
          .analytics-rank-number {
            background: #fff1f0;
            color: #b42318;
          }

          .analytics-rank-secondary {
            display: block;
            margin-top: 5px;
            color: #8c9196;
            font-size: 10px;
          }

          .analytics-empty {
            display: grid;
            justify-items: center;
            min-height: 190px;
            align-content: center;
            padding: 25px;
            text-align: center;
          }

          .analytics-empty-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 45px;
            height: 45px;
            margin-bottom: 12px;
            border-radius: 13px;
            background: #f2f7ff;
            color: #005bd3;
            font-size: 20px;
          }

          .analytics-empty strong {
            color: #303030;
            font-size: 14px;
          }

          .analytics-empty p {
            max-width: 360px;
            margin: 7px 0 0;
            color: #8c9196;
            font-size: 12px;
            line-height: 1.55;
          }

          .analytics-record-count {
            display: inline-flex;
            padding: 6px 10px;
            border-radius: 999px;
            background: #f1f2f3;
            color: #616161;
            font-size: 11px;
            font-weight: 700;
          }

          .analytics-table-wrap {
            width: calc(
              100% + 44px
            );
            margin:
              0 -22px -22px;
            overflow-x: auto;
            border-top:
              1px solid #eceff1;
          }

          .analytics-table {
            width: 100%;
            min-width: 1120px;
            border-collapse: collapse;
          }

          .analytics-table th {
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

          .analytics-table td {
            padding: 14px;
            border-bottom:
              1px solid #ededed;
            color: #303030;
            font-size: 12px;
            vertical-align: middle;
          }

          .analytics-table tbody
          tr:last-child td {
            border-bottom: 0;
          }

          .analytics-table tbody
          tr:hover {
            background: #fafbfb;
          }

          .analytics-pincode {
            display: block;
            color: #111827;
            font-size: 13px;
          }

          .analytics-source {
            display: block;
            margin-top: 4px;
            color: #8c9196;
            font-size: 9px;
            text-transform: capitalize;
          }

          .analytics-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 8px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 750;
            white-space: nowrap;
          }

          .analytics-status i {
            width: 6px;
            height: 6px;
            border-radius: 50%;
          }

          .analytics-status-success {
            background: #edf9f1;
            color: #08723f;
          }

          .analytics-status-success i {
            background: #008060;
          }

          .analytics-status-error {
            background: #fff1f0;
            color: #8e1f17;
          }

          .analytics-status-error i {
            background: #c4320a;
          }

          .analytics-table-primary,
          .analytics-table-secondary {
            display: block;
          }

          .analytics-table-primary {
            max-width: 190px;
            overflow: hidden;
            color: #303030;
            font-size: 11px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .analytics-table-secondary {
            max-width: 190px;
            margin-top: 4px;
            overflow: hidden;
            color: #8c9196;
            font-size: 9px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .analytics-mini-status {
            display: inline-flex;
            padding: 4px 7px;
            border-radius: 999px;
            background: #f1f2f3;
            color: #616161;
            font-size: 9px;
            font-weight: 750;
          }

          .analytics-mini-status-success {
            background: #edf9f1;
            color: #08723f;
          }

          .analytics-muted {
            color: #8c9196;
            font-size: 10px;
          }

          .analytics-date {
            color: #616161;
            font-size: 10px;
            white-space: nowrap;
          }

          @media (
            max-width: 1050px
          ) {
            .analytics-metrics-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }

            .analytics-breakdown-grid,
            .analytics-ranking-grid {
              grid-template-columns:
                1fr;
            }

            .analytics-breakdown-body {
              max-width: 420px;
            }
          }

          @media (
            max-width: 700px
          ) {
            .analytics-hero {
              align-items: flex-start;
              flex-direction: column;
              padding: 25px 20px;
            }

            .analytics-hero-summary {
              width: 100%;
              min-width: 0;
            }

            .analytics-metrics-grid {
              grid-template-columns:
                1fr;
            }

            .analytics-card-heading-responsive {
              align-items: flex-start;
              flex-direction: column;
            }

            .analytics-card,
            .analytics-metric {
              padding: 18px;
            }

            .analytics-chart {
              height: 230px;
            }

            .analytics-chart-dates {
              overflow: hidden;
              padding-right: 15px;
              padding-left: 15px;
            }

            .analytics-breakdown-body {
              align-items: flex-start;
              flex-direction: column;
            }

            .analytics-table-wrap {
              width: calc(
                100% + 36px
              );
              margin:
                0 -18px -18px;
            }
          }

          @media (
            prefers-reduced-motion:
              reduce
          ) {
            * {
              scroll-behavior: auto !important;
            }
          }
        `}
      </style>
    </s-page>
  );
}