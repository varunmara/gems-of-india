CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_article" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"image" text,
	"tags" text[],
	"author" text DEFAULT 'Gems of India' NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_article_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "entity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"keywords" text[],
	"street_address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"phone_number" text,
	"email" text,
	"entity_type" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"net_worth" text,
	"website_url" text,
	"logo_url" text,
	"image_url" text,
	"facebook_url" text,
	"twitter_url" text,
	"featured_on_homepage" boolean DEFAULT false,
	"daily_ranking" integer,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" uuid,
	"verified_at" timestamp,
	"verified_by" uuid,
	CONSTRAINT "entity_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "entity_relationship" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_entity_id" uuid,
	"child_entity_id" uuid,
	"relationship_type" text NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "entity_to_category" (
	"entity_id" uuid NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "entity_to_category_entity_id_category_id_pk" PRIMARY KEY("entity_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "fuma_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page" varchar(256) NOT NULL,
	"thread" integer,
	"author" varchar(256) NOT NULL,
	"content" jsonb NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuma_rates" (
	"user_id" uuid NOT NULL,
	"comment_id" uuid NOT NULL,
	"like" boolean NOT NULL,
	CONSTRAINT "fuma_rates_user_id_comment_id_pk" PRIMARY KEY("user_id","comment_id")
);
--> statement-breakpoint
CREATE TABLE "fuma_roles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"can_delete" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_attribute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"attribute_type" text NOT NULL,
	"category" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_attribute_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"tag_type" text NOT NULL,
	"category" text,
	"color" text DEFAULT '#10b981',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_tag_selection" (
	"review_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "review_tag_selection_review_id_tag_id_pk" PRIMARY KEY("review_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vote_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"helpful" integer DEFAULT 0,
	"not_helpful" integer DEFAULT 0,
	"verified" boolean DEFAULT false,
	"edited" boolean DEFAULT false,
	"overall_satisfaction" integer,
	"recommend_to_others" boolean,
	"has_evidence" boolean DEFAULT false,
	"is_anonymous" boolean DEFAULT false,
	"experience_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid,
	"org_id" uuid,
	"title" text NOT NULL,
	"responsibilities" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" uuid,
	"verified_at" timestamp,
	"verified_by" uuid
);
--> statement-breakpoint
CREATE TABLE "seo_article" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"image" text,
	"meta_title" text,
	"meta_description" text,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seo_article_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "upvote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"stripe_customer_id" text,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity" ADD CONSTRAINT "entity_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity" ADD CONSTRAINT "entity_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity" ADD CONSTRAINT "entity_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationship" ADD CONSTRAINT "entity_relationship_parent_entity_id_entity_id_fk" FOREIGN KEY ("parent_entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationship" ADD CONSTRAINT "entity_relationship_child_entity_id_entity_id_fk" FOREIGN KEY ("child_entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationship" ADD CONSTRAINT "entity_relationship_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationship" ADD CONSTRAINT "entity_relationship_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_to_category" ADD CONSTRAINT "entity_to_category_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_to_category" ADD CONSTRAINT "entity_to_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuma_rates" ADD CONSTRAINT "fuma_rates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuma_rates" ADD CONSTRAINT "fuma_rates_comment_id_fuma_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."fuma_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuma_roles" ADD CONSTRAINT "fuma_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_attribute_response" ADD CONSTRAINT "review_attribute_response_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_attribute_response" ADD CONSTRAINT "review_attribute_response_attribute_id_review_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."review_attribute"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_tag_selection" ADD CONSTRAINT "review_tag_selection_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_tag_selection" ADD CONSTRAINT "review_tag_selection_tag_id_review_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."review_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_person_id_entity_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_org_id_entity_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upvote" ADD CONSTRAINT "upvote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upvote" ADD CONSTRAINT "upvote_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_article_slug_idx" ON "blog_article" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_article_published_at_idx" ON "blog_article" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "category_name_idx" ON "category" USING btree ("name");--> statement-breakpoint
CREATE INDEX "entity_status_idx" ON "entity" USING btree ("status");--> statement-breakpoint
CREATE INDEX "entity_created_at_idx" ON "entity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "entity_daily_ranking_idx" ON "entity" USING btree ("daily_ranking");--> statement-breakpoint
CREATE INDEX "entity_featured_idx" ON "entity" USING btree ("featured_on_homepage");--> statement-breakpoint
CREATE INDEX "entity_status_created_idx" ON "entity" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "entity_status_ranking_idx" ON "entity" USING btree ("status","daily_ranking");--> statement-breakpoint
CREATE INDEX "unique_entity_relationship" ON "entity_relationship" USING btree ("parent_entity_id","child_entity_id","relationship_type");--> statement-breakpoint
CREATE INDEX "comment_idx" ON "fuma_rates" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "review_attribute_entity_type_idx" ON "review_attribute" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "review_attribute_category_idx" ON "review_attribute" USING btree ("category");--> statement-breakpoint
CREATE INDEX "review_attribute_response_review_attribute_idx" ON "review_attribute_response" USING btree ("review_id","attribute_id");--> statement-breakpoint
CREATE INDEX "review_attribute_response_attribute_idx" ON "review_attribute_response" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "review_tag_entity_type_tag_type_idx" ON "review_tag" USING btree ("entity_type","tag_type");--> statement-breakpoint
CREATE INDEX "review_tag_selection_review_idx" ON "review_tag_selection" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_tag_selection_tag_idx" ON "review_tag_selection" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "review_votes_user_review_idx" ON "review_votes" USING btree ("user_id","review_id");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_entity_id_idx" ON "reviews" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reviews_entity_created_idx" ON "reviews" USING btree ("entity_id","created_at");--> statement-breakpoint
CREATE INDEX "unique_role_assignment" ON "role_assignment" USING btree ("person_id","org_id","title","start_date");--> statement-breakpoint
CREATE INDEX "seo_article_slug_idx" ON "seo_article" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "upvote_user_id_idx" ON "upvote" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "upvote_entity_id_idx" ON "upvote" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "upvote_created_at_idx" ON "upvote" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "upvote_user_entity_idx" ON "upvote" USING btree ("user_id","entity_id");