CREATE TABLE "moderator_scope" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moderator_id" uuid NOT NULL,
	"scope_type" text NOT NULL,
	"entity_id" uuid,
	"state" text,
	"city" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "moderator_scope_moderator_id_unique" UNIQUE("moderator_id")
);
--> statement-breakpoint
ALTER TABLE "moderator_scope" ADD CONSTRAINT "moderator_scope_moderator_id_user_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderator_scope" ADD CONSTRAINT "moderator_scope_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderator_scope" ADD CONSTRAINT "moderator_scope_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderator_scope" ADD CONSTRAINT "moderator_scope_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "moderator_scope_entity_id_idx" ON "moderator_scope" USING btree ("entity_id");