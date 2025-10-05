import React from "react"

const colors = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#DC2626",
  "#7C3AED",
  "#DB2777",
]

const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

function getRandomColor(seed: string): string {
  const hash = hashString(seed)
  return colors[hash % colors.length]
}

function getRandomGradient(seed: string): string {
  const hash = hashString(seed + "gradient")
  return gradients[hash % gradients.length]
}

type LogoVariant = "solid" | "gradient" | "rounded"

function getLogoVariant(seed: string): LogoVariant {
  const variants: LogoVariant[] = ["solid", "gradient", "rounded"]
  const hash = hashString(seed + "variant")
  return variants[hash % variants.length]
}

export const RandomLogo: React.FC<{
  name: string
  size?: number
  variant?: LogoVariant
}> = ({ name, size = 100, variant }) => {
  if (!name || name.trim() === "") {
    return (
      <div style={{ width: size, height: size, backgroundColor: "#f3f4f6", borderRadius: 8 }} />
    )
  }

  const seed = name.toLowerCase().trim()
  const color = getRandomColor(seed)
  const gradient = getRandomGradient(seed)
  const logoVariant = variant || getLogoVariant(seed)
  const initials = name
    .trim()
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  // Calculate responsive font size based on logo size and number of characters
  const baseFontSize = size * 0.4
  const fontSize = initials.length > 1 ? baseFontSize * 0.8 : baseFontSize

  const renderLogo = () => {
    const commonStyles: React.CSSProperties = {
      width: size,
      height: size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: "600",
      fontSize: fontSize,
      color: "white",
      textShadow: "0 1px 2px rgba(0,0,0,0.1)",
      userSelect: "none",
      position: "relative",
      overflow: "hidden",
    }

    switch (logoVariant) {
      case "gradient":
        return (
          <div
            style={{
              ...commonStyles,
              background: gradient,
              borderRadius: size * 0.2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {initials}
          </div>
        )

      case "rounded":
        return (
          <div
            style={{
              ...commonStyles,
              backgroundColor: color,
              borderRadius: "50%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {initials}
          </div>
        )

      default: // 'solid'
        return (
          <div
            style={{
              ...commonStyles,
              backgroundColor: color,
              borderRadius: size * 0.2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {initials}
          </div>
        )
    }
  }

  return renderLogo()
}

// Demo component to showcase different variations
const LogoShowcase: React.FC = () => {
  const testNames = [
    "John Doe",
    "Alice Smith",
    "TechCorp",
    "Design Studio",
    "M",
    "OpenAI",
    "React Dev",
    "UX Team",
    "Beta Labs",
    "Pixel Art",
  ]

  const variants: LogoVariant[] = ["solid", "gradient", "rounded"]

  return (
    <div
      style={{
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h2 style={{ marginBottom: 20, color: "#374151" }}>Random Logo Generator</h2>

      <div style={{ marginBottom: 30 }}>
        <h3 style={{ marginBottom: 15, color: "#6B7280", fontSize: 16 }}>
          Auto-generated variants:
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 15,
            marginBottom: 20,
          }}
        >
          {testNames.map((name, idx) => (
            <div key={idx} style={{ textAlign: "center" }}>
              <RandomLogo name={name} size={80} />
              <p style={{ marginTop: 8, fontSize: 12, color: "#6B7280" }}>{name}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: 15, color: "#6B7280", fontSize: 16 }}>
          Different variants for &quot;Design Co&quot;:
        </h3>
        <div
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {variants.map((variant, idx) => (
            <div key={idx} style={{ textAlign: "center" }}>
              <RandomLogo name="Design Co" size={80} variant={variant} />
              <p
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#6B7280",
                  textTransform: "capitalize",
                }}
              >
                {variant}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h3 style={{ marginBottom: 15, color: "#6B7280", fontSize: 16 }}>Different sizes:</h3>
        <div
          style={{
            display: "flex",
            gap: 15,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {[40, 60, 80, 100, 120].map((size, idx) => (
            <div key={idx} style={{ textAlign: "center" }}>
              <RandomLogo name="React" size={size} />
              <p style={{ marginTop: 8, fontSize: 12, color: "#6B7280" }}>{size}px</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LogoShowcase
