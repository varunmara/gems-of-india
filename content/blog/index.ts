// Index centralized of all blog articles
export const articles = [] as const

export type ArticleSlug = (typeof articles)[number]["slug"]
