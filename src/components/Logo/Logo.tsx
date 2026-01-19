type LogoProps = {
  className?: string
  /** Show tagline "Train hard. Live fully. Plan intelligently." */
  tagline?: "False" | "True"
  /** Logo size variant */
  size?: "Sm" | "Md" | "Lg"
  /** Color style: White for dark backgrounds, Dark for light backgrounds */
  style?: "White" | "Dark"
}

export function Logo({ className, tagline = "False", size = "Sm", style = "White" }: LogoProps) {
  // Map style to SVG source
  const getSvgSource = () => {
    switch (style) {
      case "Dark":
        return "/images/endurancebloc-logo.svg"
      case "White":
      default:
        return "/images/endurancebloc-logo-light.svg"
    }
  }

  // Map size to height and font size for tagline
  const getSizeClasses = () => {
    switch (size) {
      case "Lg":
        return { img: "h-10 w-auto", tagline: "text-lg" }
      case "Md":
        return { img: "h-6 w-auto", tagline: "text-base" }
      case "Sm":
      default:
        return { img: "h-[18px] w-auto", tagline: "text-sm" }
    }
  }

  const sizeClasses = getSizeClasses()

  return (
    <div className={className}>
      <div className="flex flex-col items-start gap-1">
        <picture>
          <source srcSet={getSvgSource()} type="image/svg+xml" />
          <img
            className={`block max-w-none ${sizeClasses.img}`}
            alt="EnduranceBloc"
            src="/images/endurancebloc-logo.png"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        </picture>
        {tagline === "True" && (
          <p
            className={`${sizeClasses.tagline} font-medium italic text-slate-600 dark:text-slate-300 tracking-tight`}
          >
            Train hard. Live fully. Plan intelligently.
          </p>
        )}
      </div>
    </div>
  )
}
