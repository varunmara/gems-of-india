// Index centralized of all blog articles
export const articles = [
  {
    slug: "product-directory-high-quality-backlinks",
    import: () => import("./product-directory-high-quality-backlinks.mdx"),
  },
] as const

export type ArticleSlug = (typeof articles)[number]["slug"]
