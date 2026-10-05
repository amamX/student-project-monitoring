"use client";

import { motion } from "motion/react";
import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "../../lib/utils";

import { MotionConfig, useReducedMotion } from "motion/react";
import { createContext, useContext } from "react";

const ReducedMotionOverrideContext = createContext(false);

function useResolvedReducedMotion(reducedMotion) {
  const reducedMotionOverride = useContext(ReducedMotionOverrideContext);
  const prefersReducedMotion = useReducedMotion() ?? false;

  return Boolean(
    reducedMotion || reducedMotionOverride || prefersReducedMotion
  );
}

function ReducedMotionConfig({
  children,
  reducedMotion,
}) {
  const resolvedReducedMotion = useResolvedReducedMotion(reducedMotion);

  return (
    <MotionConfig reducedMotion={resolvedReducedMotion ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" };

const CHART_RESIZE_DEBOUNCE_MS = 150;

/** Calm easing — no spring overshoot on data surfaces. */
const chartEase = [0.22, 1, 0.36, 1];

const chartTooltipFade = {
  duration: 0.14,
  ease: chartEase,
};

const CHART_BAR_ANIMATION_DURATION = 480;
const CHART_BAR_ANIMATION_EASING = "ease-out";
const CHART_BAR_STAGGER_MS = 32;

const MotionDiv = motion.div;

const ChartContext = React.createContext(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension,
  reducedMotion,
  ...props
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;
  const resolvedReducedMotion = useResolvedReducedMotion(reducedMotion);
  const initialBarAnimationDoneRef = React.useRef(resolvedReducedMotion);
  const resizeMeasureCountRef = React.useRef(0);
  const [barAnimationActive, setBarAnimationActive] = React.useState(
    () => !resolvedReducedMotion
  );

  React.useEffect(() => {
    if (resolvedReducedMotion) {
      setBarAnimationActive(false);
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        initialBarAnimationDoneRef.current = true;
        setBarAnimationActive(false);
      },
      CHART_BAR_ANIMATION_DURATION + CHART_BAR_STAGGER_MS * 3
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resolvedReducedMotion]);

  const handleResize = React.useCallback(() => {
    resizeMeasureCountRef.current += 1;

    if (resizeMeasureCountRef.current <= 1) {
      return;
    }

    if (initialBarAnimationDoneRef.current) {
      setBarAnimationActive(false);
    }
  }, []);

  return (
    <ChartContext.Provider
      value={{
        config,
        reducedMotion: resolvedReducedMotion,
        barAnimationActive,
      }}
    >
      <ReducedMotionConfig reducedMotion={reducedMotion}>
        <div
          className={cn(
            "flex aspect-video min-h-[12rem] w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-slate-500 [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-slate-200 dark:[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-slate-800 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-200 dark:[&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-800 [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-slate-200 [&_.recharts-radial-bar-background-sector]:fill-slate-100 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-slate-100 dark:[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-slate-800 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-slate-200 [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
            className
          )}
          data-chart={chartId}
          data-slot="chart"
          {...props}
        >
          <ChartStyle config={config} id={chartId} />
          <RechartsPrimitive.ResponsiveContainer
            debounce={CHART_RESIZE_DEBOUNCE_MS}
            height="100%"
            onResize={handleResize}
            width="100%"
            {...(initialDimension ? { initialDimension } : {})}
          >
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ReducedMotionConfig>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme ?? config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme] ??
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipRow({
  color,
  formatter,
  hideIndicator,
  index,
  indicator,
  item,
  itemConfig,
  nestLabel,
  tooltipLabel,
}) {
  const indicatorColor = color ?? item.payload?.fill ?? item.color;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-slate-500",
        indicator === "dot" && "items-center"
      )}
    >
      {formatter && item?.value !== undefined && item.name ? (
        formatter(item.value, item.name, item, index, item.payload)
      ) : (
        <>
          {itemConfig?.icon ? (
            <itemConfig.icon />
          ) : (
            !hideIndicator && (
              <div
                className={cn(
                  "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                  {
                    "h-2.5 w-2.5": indicator === "dot",
                    "w-1": indicator === "line",
                    "w-0 border-[1.5px] border-dashed bg-transparent":
                      indicator === "dashed",
                    "my-0.5": nestLabel && indicator === "dashed",
                  }
                )}
                style={{
                  "--color-bg": indicatorColor,
                  "--color-border": indicatorColor,
                }}
              />
            )
          )}
          <div
            className={cn(
              "flex flex-1 justify-between leading-none gap-4",
              nestLabel ? "items-end" : "items-center"
            )}
          >
            <div className="grid gap-1.5">
              {nestLabel ? tooltipLabel : null}
              <span className="text-slate-500">
                {itemConfig?.label ?? item.name}
              </span>
            </div>
            {item.value != null && (
              <span className="font-medium font-mono text-slate-900 dark:text-slate-50 tabular-nums">
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : String(item.value)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ChartBar({
  animationBegin,
  animationDuration,
  animationEasing,
  isAnimationActive,
  seriesIndex = 0,
  ...props
}) {
  const { barAnimationActive, reducedMotion } = useChart();
  const shouldAnimateBars =
    !reducedMotion && (isAnimationActive ?? barAnimationActive);

  return (
    <RechartsPrimitive.Bar
      {...props}
      animationBegin={animationBegin ?? seriesIndex * CHART_BAR_STAGGER_MS}
      animationDuration={
        shouldAnimateBars
          ? (animationDuration ?? CHART_BAR_ANIMATION_DURATION)
          : 0
      }
      animationEasing={animationEasing ?? CHART_BAR_ANIMATION_EASING}
      isAnimationActive={shouldAnimateBars}
    />
  );
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}) {
  const { config, reducedMotion } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? (config[label]?.label ?? label)
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!(active && payload?.length)) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <MotionDiv
      animate={{ opacity: 1 }}
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs shadow-xl",
        className
      )}
      initial={{ opacity: reducedMotion ? 1 : 0 }}
      transition={reducedMotion ? { duration: 0 } : chartTooltipFade}
    >
      {nestLabel ? null : tooltipLabel}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);

            return (
              <ChartTooltipRow
                color={color}
                formatter={formatter}
                hideIndicator={hideIndicator}
                index={index}
                indicator={indicator}
                item={item}
                itemConfig={itemConfig}
                key={index}
                nestLabel={nestLabel}
                tooltipLabel={tooltipLabel}
              />
            );
          })}
      </div>
    </MotionDiv>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-slate-500"
              key={index}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

function getPayloadConfigFromPayload(
  config,
  payload,
  key
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey = key;

  if (
    key in payload &&
    typeof payload[key] === "string"
  ) {
    configLabelKey = payload[key];
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === "string"
  ) {
    configLabelKey = payloadPayload[key];
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartBar,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
